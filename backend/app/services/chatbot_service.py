from sqlalchemy.orm import Session

from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.models.future_lead import FutureLead
from app.models.chat_assignment import ChatAssignment
from app.models.user import User
from datetime import datetime, timezone


def get_or_create_session(
    db: Session,
    visitor_id: str,
) -> ChatSession:

    chat_session = (
        db.query(ChatSession)
        .filter(ChatSession.visitor_id == visitor_id)
        .first()
    )

    if chat_session:
        return chat_session

    chat_session = ChatSession(
        visitor_id=visitor_id,
        status="AI",
    )

    db.add(chat_session)
    db.commit()
    db.refresh(chat_session)

    return chat_session


def save_message(
    db: Session,
    session_id: int,
    sender_type: str,
    message: str,
) -> ChatMessage:

    chat_message = ChatMessage(
        session_id=session_id,
        sender_type=sender_type,
        message=message,
    )

    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)

    return chat_message


def update_customer_info(
    db: Session,
    visitor_id: str,
    customer_name: str | None = None,
    phone: str | None = None,
    city: str | None = None,
    area: str | None = None,
    address: str | None = None,
) -> ChatSession:

    chat_session = (
        db.query(ChatSession)
        .filter(ChatSession.visitor_id == visitor_id)
        .first()
    )

    if not chat_session:
        raise ValueError("Chat session not found")

    if customer_name is not None:
        chat_session.customer_name = customer_name

    if phone is not None:
        chat_session.phone = phone

    if city is not None:
        chat_session.city = city

    if area is not None:
        chat_session.area = area

    if address is not None:
        chat_session.address = address

    db.commit()
    db.refresh(chat_session)

    return chat_session


def create_or_update_future_lead(
    db: Session,
    chat_session: ChatSession,
) -> FutureLead | None:

    if not all([
        chat_session.customer_name,
        chat_session.phone,
        chat_session.city,
        chat_session.area,
    ]):
        return None

    future_lead = (
        db.query(FutureLead)
        .filter(FutureLead.phone == chat_session.phone)
        .first()
    )

    if future_lead:
        future_lead.customer_name = chat_session.customer_name
        future_lead.city = chat_session.city
        future_lead.area = chat_session.area
        future_lead.address = chat_session.address

    else:
        future_lead = FutureLead(
            customer_name=chat_session.customer_name,
            phone=chat_session.phone,
            city=chat_session.city,
            area=chat_session.area,
            address=chat_session.address,
            status="NEW",
        )

        db.add(future_lead)

    db.commit()
    db.refresh(future_lead)

    return future_lead


def request_live_agent(
    db: Session,
    visitor_id: str,
) -> ChatSession:

    chat_session = (
        db.query(ChatSession)
        .filter(ChatSession.visitor_id == visitor_id)
        .with_for_update()
        .first()
    )

    if not chat_session:
        raise ValueError("Chat session not found")

    if chat_session.status == "CLOSED":
        raise ValueError("This chat session is closed")

    if chat_session.status == "ACTIVE":
        raise ValueError("An agent is already handling this chat")

    if chat_session.status == "PENDING":
        return chat_session

    chat_session.status = "PENDING"

    create_or_update_future_lead(
        db=db,
        chat_session=chat_session,
    )

    db.commit()
    db.refresh(chat_session)

    return chat_session


def assign_chat_to_agent(
    db: Session,
    session_id: int,
    agent_id: int,
) -> ChatAssignment:

    chat_session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .with_for_update()
        .first()
    )

    if not chat_session:
        raise ValueError("Chat session not found")

    if chat_session.status != "PENDING":
        raise ValueError("This chat is not available for assignment")

    agent = (
        db.query(User)
        .filter(
            User.id == agent_id,
            User.is_active == True,
            User.role == "SALES_AGENT",
        )
        .first()
    )

    if not agent:
        raise ValueError("Active sales agent not found")

    assignment = ChatAssignment(
        session_id=session_id,
        agent_id=agent_id,
        status="ASSIGNED",
    )

    chat_session.status = "ACTIVE"

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return assignment


def transfer_chat_to_agent(
    db: Session,
    session_id: int,
    current_agent_id: int,
    new_agent_id: int,
) -> ChatAssignment:

    chat_session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .with_for_update()
        .first()
    )

    if not chat_session:
        raise ValueError("Chat session not found")

    if chat_session.status != "ACTIVE":
        raise ValueError("Only active chats can be transferred")

    current_assignment = (
        db.query(ChatAssignment)
        .filter(
            ChatAssignment.session_id == session_id,
            ChatAssignment.status == "ASSIGNED",
        )
        .first()
    )

    if not current_assignment:
        raise ValueError("Current chat assignment not found")

    if current_assignment.agent_id == new_agent_id:
        raise ValueError("Chat is already assigned to this agent")

    if current_agent_id != 0 and current_assignment.agent_id != current_agent_id:
        raise ValueError("This chat is not assigned to you")

    new_agent = (
        db.query(User)
        .filter(
            User.id == new_agent_id,
            User.role == "SALES_AGENT",
            User.is_active == True,
        )
        .first()
    )

    if not new_agent:
        raise ValueError("Active sales agent not found")

    current_assignment.status = "TRANSFERRED"
    current_assignment.ended_at = datetime.now(timezone.utc)

    new_assignment = ChatAssignment(
        session_id=session_id,
        agent_id=new_agent_id,
        status="ASSIGNED",
    )

    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return new_assignment