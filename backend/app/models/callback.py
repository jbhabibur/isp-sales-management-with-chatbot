
from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Callback(Base):
    __tablename__ = "callbacks"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    customer_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    phone: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )
    message: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="PENDING", nullable=False
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
