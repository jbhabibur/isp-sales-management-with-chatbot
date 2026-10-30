
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.callback import Callback

from app.core.dependencies import require_roles
from app.models.user import User

router = APIRouter(
    prefix="/api/callbacks",
    tags=["Callbacks"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CallbackCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=6, max_length=20)
    message: str | None = Field(default=None, max_length=500)


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


@router.get("/")
def get_callbacks(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    ),
):
    callbacks = (
        db.query(Callback)
        .order_by(Callback.created_at.desc())
        .all()
    )

    return [
        {
            "id": callback.id,
            "customer_name": callback.customer_name,
            "phone": callback.phone,
            "message": callback.message,
            "status": callback.status,
            "created_at": callback.created_at,
        }
        for callback in callbacks
    ]