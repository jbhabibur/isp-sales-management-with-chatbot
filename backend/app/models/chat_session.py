
from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    visitor_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    customer_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    phone: Mapped[str | None] = mapped_column(
        String(20), nullable=True, index=True
    )
    city: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    area: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    address: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="AI", nullable=False
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
