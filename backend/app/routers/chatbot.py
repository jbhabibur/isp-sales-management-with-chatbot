from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession
from app.models.chat_assignment import ChatAssignment
from datetime import datetime, timezone

from pydantic import BaseModel
from app.core.dependencies import get_current_user
from app.models.user import User

from app.core.dependencies import get_db
from app.schemas.chatbot import (
    ChatSessionCreate,
    ChatMessageCreate,
    ChatCustomerInfo,
    ChatHandoffRequest,
    AgentMessageCreate,
)
from app.services.chatbot_service import (
    get_or_create_session,
    save_message,
    update_customer_info,
    request_live_agent,
    assign_chat_to_agent,
    transfer_chat_to_agent,
)

class ChatAssignmentRequest(BaseModel):
    session_id: int

router = APIRouter(
    prefix="/api/chatbot",
    tags=["Chatbot"],
)


@router.post("/session")
def create_chat_session(
    data: ChatSessionCreate,
    db: Session = Depends(get_db),
):
    chat_session = get_or_create_session(
        db=db,
        visitor_id=data.visitor_id,
    )

    return {
        "session_id": chat_session.id,
        "visitor_id": chat_session.visitor_id,
        "status": chat_session.status,
    }


@router.post("/message")
def send_message(
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
):
    chat_session = (
        db.query(__import__(
            "app.models.chat_session",
            fromlist=["ChatSession"]
        ).ChatSession)
        .filter(
            __import__(
                "app.models.chat_session",
                fromlist=["ChatSession"]
            ).ChatSession.visitor_id == data.visitor_id
        )
        .first()
    )

    if not chat_session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found",
        )

    if chat_session.status == "CLOSED":
        raise HTTPException(
            status_code=400,
            detail="This chat session is closed",
        )

    chat_message = save_message(
        db=db,
        session_id=chat_session.id,
        sender_type="CUSTOMER",
        message=data.message,
    )

    return {
        "message_id": chat_message.id,
        "session_id": chat_session.id,
        "message": chat_message.message,
        "sender_type": chat_message.sender_type,
        "created_at": chat_message.created_at,
    }


@router.get("/history/{visitor_id}")
def get_chat_history(
    visitor_id: str,
    db: Session = Depends(get_db),
):
    chat_session = (
        db.query(ChatSession)
        .filter(ChatSession.visitor_id == visitor_id)
        .first()
    )

    if not chat_session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found",
        )

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == chat_session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return {
        "session_id": chat_session.id,
        "visitor_id": visitor_id,
        "status": chat_session.status,
        "messages": [
            {
                "id": message.id,
                "sender_type": message.sender_type,
                "message": message.message,
                "created_at": message.created_at,
            }
            for message in messages
        ],
    }


@router.patch("/customer-info/{visitor_id}")
def update_chat_customer_info(
    visitor_id: str,
    data: ChatCustomerInfo,
    db: Session = Depends(get_db),
):
    try:
        chat_session = update_customer_info(
            db=db,
            visitor_id=visitor_id,
            customer_name=data.customer_name,
            phone=data.phone,
            city=data.city,
            area=data.area,
            address=data.address,
        )

        return {
            "message": "Customer information updated successfully",
            "visitor_id": chat_session.visitor_id,
            "customer_name": chat_session.customer_name,
            "phone": chat_session.phone,
            "city": chat_session.city,
            "area": chat_session.area,
            "address": chat_session.address,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )


@router.post("/handoff")
def handoff_to_agent(
    data: ChatHandoffRequest,
    db: Session = Depends(get_db),
):
    try:
        chat_session = request_live_agent(
            db=db,
            visitor_id=data.visitor_id,
        )

        return {
            "message": "Live agent requested successfully",
            "session_id": chat_session.id,
            "visitor_id": chat_session.visitor_id,
            "status": chat_session.status,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.post("/assign")
def assign_chat(
    data: ChatAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["ADMIN", "SALES_AGENT"]:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to handle chats",
        )

    try:
        assignment = assign_chat_to_agent(
            db=db,
            session_id=data.session_id,
            agent_id=current_user.id,
        )

        return {
            "message": "Chat assigned successfully",
            "session_id": assignment.session_id,
            "agent_id": assignment.agent_id,
            "status": assignment.status,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.get("/pending")
def get_pending_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["ADMIN", "SALES_AGENT"]:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view chats",
        )

    chats = (
        db.query(ChatSession)
        .filter(ChatSession.status == "PENDING")
        .order_by(ChatSession.created_at.asc())
        .all()
    )

    return [
        {
            "session_id": chat.id,
            "visitor_id": chat.visitor_id,
            "customer_name": chat.customer_name,
            "phone": chat.phone,
            "city": chat.city,
            "area": chat.area,
            "address": chat.address,
            "status": chat.status,
            "created_at": chat.created_at,
        }
        for chat in chats
    ]


@router.get("/active")
def get_active_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["ADMIN", "SALES_AGENT"]:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view chats",
        )

    query = (
        db.query(ChatSession, ChatAssignment)
        .join(
            ChatAssignment,
            ChatAssignment.session_id == ChatSession.id,
        )
        .filter(
            ChatSession.status == "ACTIVE",
            ChatAssignment.status == "ASSIGNED",
        )
    )

    if current_user.role == "SALES_AGENT":
        query = query.filter(
            ChatAssignment.agent_id == current_user.id
        )

    chats = query.order_by(
        ChatAssignment.assigned_at.desc()
    ).all()

    return [
        {
            "session_id": chat.id,
            "visitor_id": chat.visitor_id,
            "customer_name": chat.customer_name,
            "phone": chat.phone,
            "city": chat.city,
            "area": chat.area,
            "address": chat.address,
            "status": chat.status,
            "agent_id": assignment.agent_id,
            "assigned_at": assignment.assigned_at,
        }
        for chat, assignment in chats
    ]


@router.get("/agent/history/{session_id}")
def get_agent_chat_history(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["ADMIN", "SALES_AGENT"]:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view chats",
        )

    chat_session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .first()
    )

    if not chat_session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found",
        )

    if current_user.role == "SALES_AGENT":
        assignment = (
            db.query(ChatAssignment)
            .filter(
                ChatAssignment.session_id == session_id,
                ChatAssignment.agent_id == current_user.id,
                ChatAssignment.status == "ASSIGNED",
            )
            .first()
        )

        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="This chat is not assigned to you",
            )

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return {
        "session_id": chat_session.id,
        "customer_name": chat_session.customer_name,
        "phone": chat_session.phone,
        "status": chat_session.status,
        "messages": [
            {
                "id": message.id,
                "sender_type": message.sender_type,
                "message": message.message,
                "created_at": message.created_at,
            }
            for message in messages
        ],
    }


@router.post("/agent/reply")
def agent_reply(
    data: AgentMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["ADMIN", "SALES_AGENT"]:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to send messages",
        )

    chat_session = (
        db.query(ChatSession)
        .filter(ChatSession.id == data.session_id)
        .first()
    )

    if not chat_session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found",
        )

    if chat_session.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="This chat is not active",
        )

    if current_user.role == "SALES_AGENT":
        assignment = (
            db.query(ChatAssignment)
            .filter(
                ChatAssignment.session_id == data.session_id,
                ChatAssignment.agent_id == current_user.id,
                ChatAssignment.status == "ASSIGNED",
            )
            .first()
        )

        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="This chat is not assigned to you",
            )

    message = save_message(
        db=db,
        session_id=data.session_id,
        sender_type="AGENT",
        message=data.message,
    )

    return {
        "message": "Reply sent successfully",
        "message_id": message.id,
        "session_id": message.session_id,
        "sender_type": message.sender_type,
        "content": message.message,
        "created_at": message.created_at,
    }


@router.post("/agent/close/{session_id}")
def close_chat(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["ADMIN", "SALES_AGENT"]:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to close chats",
        )

    chat_session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .first()
    )

    if not chat_session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found",
        )

    if chat_session.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="Only active chats can be closed",
        )

    assignment = (
        db.query(ChatAssignment)
        .filter(
            ChatAssignment.session_id == session_id,
            ChatAssignment.status == "ASSIGNED",
        )
        .first()
    )

    if current_user.role == "SALES_AGENT":
        if not assignment or assignment.agent_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="This chat is not assigned to you",
            )

    chat_session.status = "CLOSED"

    if assignment:
        assignment.status = "COMPLETED"
        assignment.ended_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "message": "Chat closed successfully",
        "session_id": session_id,
        "status": chat_session.status,
    }


@router.post("/agent/transfer")
def transfer_chat(
    data: ChatTransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["ADMIN", "SALES_AGENT"]:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to transfer chats",
        )

    try:
        assignment = transfer_chat_to_agent(
            db=db,
            session_id=data.session_id,
            current_agent_id=(
                0 if current_user.role == "ADMIN"
                else current_user.id
            ),
            new_agent_id=data.new_agent_id,
        )

        return {
            "message": "Chat transferred successfully",
            "session_id": assignment.session_id,
            "new_agent_id": assignment.agent_id,
            "status": assignment.status,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.get("/agents")
def get_chat_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["ADMIN", "SALES_AGENT"]:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view agents",
        )

    agents = (
        db.query(User)
        .filter(
            User.role == "SALES_AGENT",
            User.is_active == True,
        )
        .order_by(User.full_name.asc())
        .all()
    )

    return [
        {
            "id": agent.id,
            "full_name": agent.full_name,
            "email": agent.email,
        }
        for agent in agents
    ]