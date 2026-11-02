
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.db.session import SessionLocal
from app.core.dependencies import require_roles
from app.models.future_lead import FutureLead
from app.models.user import User


router = APIRouter(
    prefix="/api/future-leads",
    tags=["Future Leads"],
)


# ==================== Database Dependency ====================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== Schemas ====================

class FutureLeadCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=6, max_length=20)
    city: str = Field(min_length=2, max_length=100)
    area: str = Field(min_length=2, max_length=100)
    address: str | None = Field(default=None, max_length=500)


class FutureLeadStatusUpdate(BaseModel):
    status: Literal[
        "NEW",
        "CONTACTED",
        "INTERESTED",
        "COVERAGE_PLANNED",
        "CONVERTED",
        "REJECTED",
    ]


# ==================== Helper ====================

def serialize_lead(lead: FutureLead):
    return {
        "id": lead.id,
        "customer_name": lead.customer_name,
        "phone": lead.phone,
        "city": lead.city,
        "area": lead.area,
        "address": lead.address,
        "status": lead.status,
        "created_at": lead.created_at,
    }


# ==================== Customer: Create Future Lead ====================

@router.post("/")
def create_future_lead(
    data: FutureLeadCreate,
    db: Session = Depends(get_db),
):
    lead = FutureLead(
        customer_name=data.customer_name.strip(),
        phone=data.phone.strip(),
        city=data.city.strip(),
        area=data.area.strip(),
        address=data.address.strip() if data.address else None,
        status="NEW",
    )

    try:
        db.add(lead)
        db.commit()
        db.refresh(lead)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save future lead",
        )

    return {
        "message": "Future lead saved successfully",
        "lead_id": lead.id,
        "status": lead.status,
    }


# ==================== Admin: Get All Future Leads ====================

@router.get("/")
def get_future_leads(
    search: str | None = Query(default=None),
    city: str | None = Query(default=None),
    area: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    query = db.query(FutureLead)

    if search and search.strip():
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                FutureLead.customer_name.ilike(keyword),
                FutureLead.phone.ilike(keyword),
            )
        )

    if city and city.strip():
        query = query.filter(
            FutureLead.city.ilike(f"%{city.strip()}%")
        )

    if area and area.strip():
        query = query.filter(
            FutureLead.area.ilike(f"%{area.strip()}%")
        )

    if status and status.strip():
        query = query.filter(
            FutureLead.status == status.strip().upper()
        )

    leads = query.order_by(
        FutureLead.created_at.desc()
    ).all()

    return [serialize_lead(lead) for lead in leads]


# ==================== Admin: Get Single Future Lead ====================

@router.get("/{lead_id}")
def get_future_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    lead = db.query(FutureLead).filter(
        FutureLead.id == lead_id
    ).first()

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Future lead not found",
        )

    return serialize_lead(lead)


# ==================== Admin: Update Future Lead Status ====================

@router.patch("/{lead_id}/status")
def update_future_lead_status(
    lead_id: int,
    data: FutureLeadStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    lead = db.query(FutureLead).filter(
        FutureLead.id == lead_id
    ).first()

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Future lead not found",
        )

    try:
        lead.status = data.status

        db.commit()
        db.refresh(lead)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not update future lead status",
        )

    return {
        "message": "Future lead status updated successfully",
        "id": lead.id,
        "status": lead.status,
    }


# ==================== Admin: Future Lead Statistics ====================

@router.get("/stats/summary")
def get_future_lead_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    total = db.query(func.count(FutureLead.id)).scalar() or 0

    status_counts = dict(
        db.query(
            FutureLead.status,
            func.count(FutureLead.id)
        )
        .group_by(FutureLead.status)
        .all()
    )

    return {
        "total_leads": total,
        "new_leads": status_counts.get("NEW", 0),
        "contacted_leads": status_counts.get("CONTACTED", 0),
        "converted_leads": status_counts.get("CONVERTED", 0),
    }
