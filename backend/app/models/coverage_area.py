
from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CoverageArea(Base):
    __tablename__ = "coverage_areas"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    city: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    area_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
