
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    customer_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    phone: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )
    city: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    area: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    address: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    package_id: Mapped[int] = mapped_column(
        ForeignKey("packages.id"), nullable=False
    )
    assigned_agent_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    monthly_price: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="PENDING", nullable=False
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
