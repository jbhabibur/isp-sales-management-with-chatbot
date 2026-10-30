from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.dependencies import require_roles
from app.models.future_lead import FutureLead
from app.models.user import User

router = APIRouter(
    prefix="/api/future-leads",
    tags=["Future Leads"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class FutureLeadCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=6, max_length=20)
    city: str = Field(min_length=2, max_length=100)
    area: str = Field(min_length=2, max_length=100)
    address: str | None = Field(default=None, max_length=500)


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


@router.get("/")
def get_future_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    leads = (
        db.query(FutureLead)
        .order_by(FutureLead.created_at.desc())
        .all()
    )

    return [
        {
            "id": lead.id,
            "customer_name": lead.customer_name,
            "phone": lead.phone,
            "city": lead.city,
            "area": lead.area,
            "address": lead.address,
            "status": lead.status,
            "created_at": lead.created_at,
        }
        for lead in leads
    ]