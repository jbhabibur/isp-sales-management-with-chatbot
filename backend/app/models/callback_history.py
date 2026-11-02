
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CallbackHistory(Base):
    __tablename__ = "callback_history"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    callback_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("callbacks.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    actor_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    action: Mapped[str] = mapped_column(
        String(30), nullable=False
    )

    old_value: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    new_value: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    note: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
