
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.callback import Callback
from app.models.callback_history import CallbackHistory
from app.models.user import User
from app.core.dependencies import require_roles


router = APIRouter(
    prefix="/api/callbacks",
    tags=["Callbacks"],
)


ALLOWED_STATUSES = {
    "PENDING",
    "CONTACTED",
    "COMPLETED",
    "CANCELLED",
}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== Schemas ====================

class CallbackCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=6, max_length=20)
    message: str | None = Field(default=None, max_length=500)


class CallbackStatusUpdate(BaseModel):
    status: Literal[
        "PENDING",
        "CONTACTED",
        "COMPLETED",
        "CANCELLED",
    ]


class CallbackAssign(BaseModel):
    agent_id: int = Field(gt=0)


class CallbackNoteCreate(BaseModel):
    note: str = Field(min_length=1, max_length=1000)


# ==================== Helpers ====================

def add_history(
    db: Session,
    callback_id: int,
    actor_user_id: int | None,
    action: str,
    old_value: str | None = None,
    new_value: str | None = None,
    note: str | None = None,
):
    history = CallbackHistory(
        callback_id=callback_id,
        actor_user_id=actor_user_id,
        action=action,
        old_value=old_value,
        new_value=new_value,
        note=note,
    )

    db.add(history)


def get_callback_or_404(db: Session, callback_id: int):
    callback = (
        db.query(Callback)
        .filter(Callback.id == callback_id)
        .first()
    )

    if not callback:
        raise HTTPException(
            status_code=404,
            detail="Callback request not found",
        )

    return callback


def check_callback_access(
    callback: Callback,
    current_user: User,
):
    if current_user.role == "ADMIN":
        return

    if (
        current_user.role == "SALES_AGENT"
        and callback.assigned_agent_id == current_user.id
    ):
        return

    raise HTTPException(
        status_code=403,
        detail="You do not have access to this callback request",
    )


def serialize_callback(callback: Callback):
    return {
        "id": callback.id,
        "customer_name": callback.customer_name,
        "phone": callback.phone,
        "message": callback.message,
        "status": callback.status,
        "assigned_agent_id": callback.assigned_agent_id,
        "created_at": callback.created_at,
    }


# ==================== Public: Create Callback ====================

@router.post("/")
def create_callback(
    data: CallbackCreate,
    db: Session = Depends(get_db),
):
    callback = Callback(
        customer_name=data.customer_name.strip(),
        phone=data.phone.strip(),
        message=data.message.strip() if data.message else None,
        status="PENDING",
    )

    try:
        db.add(callback)
        db.flush()

        add_history(
            db=db,
            callback_id=callback.id,
            actor_user_id=None,
            action="CREATED",
            new_value="PENDING",
            note="Callback request submitted",
        )

        db.commit()
        db.refresh(callback)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not submit callback request",
        )

    return {
        "message": "Callback request submitted successfully",
        "callback_id": callback.id,
        "status": callback.status,
    }


# ==================== Admin / Agent: List Callbacks ====================

@router.get("/")
def get_callbacks(
    status: str | None = Query(default=None),
    search: str | None = Query(default=None, max_length=100),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "SALES_AGENT")
    ),
):
    query = db.query(Callback)

    if current_user.role == "SALES_AGENT":
        query = query.filter(
            Callback.assigned_agent_id == current_user.id
        )

    if status:
        normalized_status = status.upper()

        if normalized_status not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=422,
                detail="Invalid callback status",
            )

        query = query.filter(
            Callback.status == normalized_status
        )

    if search:
        search_term = f"%{search.strip()}%"

        query = query.filter(
            (Callback.customer_name.ilike(search_term))
            | (Callback.phone.ilike(search_term))
            | (Callback.message.ilike(search_term))
        )

    total = query.count()

    callbacks = (
        query.order_by(Callback.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "items": [serialize_callback(item) for item in callbacks],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


# ==================== Callback Details ====================

@router.get("/{callback_id}")
def get_callback(
    callback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "SALES_AGENT")
    ),
):
    callback = get_callback_or_404(db, callback_id)

    check_callback_access(callback, current_user)

    return serialize_callback(callback)


# ==================== Admin: Assign Sales Agent ====================

@router.patch("/{callback_id}/assign")
def assign_callback(
    callback_id: int,
    data: CallbackAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    callback = get_callback_or_404(db, callback_id)

    agent = (
        db.query(User)
        .filter(
            User.id == data.agent_id,
            User.role == "SALES_AGENT",
            User.is_active.is_(True),
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Active sales agent not found",
        )

    old_agent_id = callback.assigned_agent_id

    if old_agent_id == agent.id:
        return {
            "message": "Callback is already assigned to this agent",
            "id": callback.id,
            "assigned_agent_id": agent.id,
        }

    try:
        callback.assigned_agent_id = agent.id

        add_history(
            db=db,
            callback_id=callback.id,
            actor_user_id=current_user.id,
            action="ASSIGNED",
            old_value=str(old_agent_id) if old_agent_id else None,
            new_value=str(agent.id),
            note=f"Assigned to {agent.full_name}",
        )

        db.commit()
        db.refresh(callback)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not assign callback",
        )

    return {
        "message": "Callback assigned successfully",
        "id": callback.id,
        "assigned_agent_id": callback.assigned_agent_id,
    }


# ==================== Admin / Assigned Agent: Update Status ====================

@router.patch("/{callback_id}/status")
def update_callback_status(
    callback_id: int,
    data: CallbackStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "SALES_AGENT")
    ),
):
    callback = get_callback_or_404(db, callback_id)

    check_callback_access(callback, current_user)

    old_status = callback.status
    new_status = data.status

    if old_status == new_status:
        return {
            "message": "Callback status is already up to date",
            "id": callback.id,
            "status": callback.status,
        }

    try:
        callback.status = new_status

        add_history(
            db=db,
            callback_id=callback.id,
            actor_user_id=current_user.id,
            action="STATUS_CHANGED",
            old_value=old_status,
            new_value=new_status,
        )

        db.commit()
        db.refresh(callback)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not update callback status",
        )

    return {
        "message": "Callback status updated successfully",
        "id": callback.id,
        "status": callback.status,
    }


# ==================== Admin / Assigned Agent: Add Note ====================

@router.post("/{callback_id}/notes")
def add_callback_note(
    callback_id: int,
    data: CallbackNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "SALES_AGENT")
    ),
):
    callback = get_callback_or_404(db, callback_id)

    check_callback_access(callback, current_user)

    try:
        add_history(
            db=db,
            callback_id=callback.id,
            actor_user_id=current_user.id,
            action="NOTE_ADDED",
            note=data.note.strip(),
        )

        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not add callback note",
        )

    return {
        "message": "Note added successfully",
        "callback_id": callback.id,
    }


# ==================== Admin / Assigned Agent: Callback History ====================

@router.get("/{callback_id}/history")
def get_callback_history(
    callback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "SALES_AGENT")
    ),
):
    callback = get_callback_or_404(db, callback_id)

    check_callback_access(callback, current_user)

    history = (
        db.query(CallbackHistory, User.full_name)
        .outerjoin(
            User,
            CallbackHistory.actor_user_id == User.id,
        )
        .filter(CallbackHistory.callback_id == callback_id)
        .order_by(CallbackHistory.created_at.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "callback_id": item.callback_id,
            "actor_user_id": item.actor_user_id,
            "actor_name": actor_name or "System",
            "action": item.action,
            "old_value": item.old_value,
            "new_value": item.new_value,
            "note": item.note,
            "created_at": item.created_at,
        }
        for item, actor_name in history
    ]


# ==================== Agent: Own Callback History ====================

@router.get("/agents/{agent_id}/callback-history")
def get_agent_callback_history(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "SALES_AGENT")
    ),
):
    if (
        current_user.role == "SALES_AGENT"
        and current_user.id != agent_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view your own callback history",
        )

    agent = (
        db.query(User)
        .filter(
            User.id == agent_id,
            User.role == "SALES_AGENT",
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Sales agent not found",
        )

    history = (
        db.query(CallbackHistory, User.full_name)
        .join(
            Callback,
            CallbackHistory.callback_id == Callback.id,
        )
        .outerjoin(
            User,
            CallbackHistory.actor_user_id == User.id,
        )
        .filter(
            CallbackHistory.actor_user_id == agent_id
        )
        .order_by(CallbackHistory.created_at.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "callback_id": item.callback_id,
            "customer_name": (
                db.query(Callback.customer_name)
                .filter(Callback.id == item.callback_id)
                .scalar()
            ),
            "phone": (
                db.query(Callback.phone)
                .filter(Callback.id == item.callback_id)
                .scalar()
            ),
            "action": item.action,
            "old_value": item.old_value,
            "new_value": item.new_value,
            "note": item.note,
            "created_at": item.created_at,
        }
        for item, actor_name in history
    ]
