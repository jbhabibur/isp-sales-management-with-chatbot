
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles


from app.db.session import SessionLocal
from app.models.order import Order
from app.models.package import Package
from app.models.coverage_area import CoverageArea
from app.models.future_lead import FutureLead
from app.models.user import User

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=6, max_length=20)
    city: str = Field(min_length=2, max_length=100)
    area: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=5, max_length=500)
    package_id: int = Field(gt=0)


@router.post("/")
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    city = data.city.strip()
    area = data.area.strip()
    customer_name = data.customer_name.strip()
    phone = data.phone.strip()
    address = data.address.strip()

    package = (
        db.query(Package)
        .filter(
            Package.id == data.package_id,
            Package.is_active.is_(True),
        )
        .first()
    )

    if not package:
        raise HTTPException(
            status_code=404,
            detail="Active package not found",
        )

    coverage = (
        db.query(CoverageArea)
        .filter(
            CoverageArea.is_active.is_(True),
            CoverageArea.city.ilike(city),
            CoverageArea.area_name.ilike(area),
        )
        .first()
    )

    if coverage:
        order = Order(
            customer_name=customer_name,
            phone=phone,
            city=city,
            area=area,
            address=address,
            package_id=package.id,
            monthly_price=package.monthly_price,
            status="PENDING",
        )

        try:
            db.add(order)
            db.commit()
            db.refresh(order)
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Could not create connection request",
            )

        return {
            "message": "Connection request submitted successfully",
            "order_id": order.id,
            "status": order.status,
            "covered": True,
        }

    lead = FutureLead(
        customer_name=customer_name,
        phone=phone,
        city=city,
        area=area,
        address=address,
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
        "message": "Your area is not covered yet. We have saved your information for future service.",
        "lead_id": lead.id,
        "status": lead.status,
        "covered": False,
    }


class OrderStatusUpdate(BaseModel):
    status: str


@router.get("/")
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "SALES_AGENT")
    ),
):
    orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .all()
    )

    return [
        {
            "id": order.id,
            "customer_name": order.customer_name,
            "phone": order.phone,
            "city": order.city,
            "area": order.area,
            "address": order.address,
            "package_id": order.package_id,
            "monthly_price": float(order.monthly_price),
            "status": order.status,
            "assigned_agent_id": order.assigned_agent_id,
            "created_at": order.created_at,
        }
        for order in orders
    ]


@router.patch("/{order_id}/status")
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "SALES_AGENT")
    ),
):
    allowed_statuses = {
        "PENDING",
        "CONFIRMED",
        "CONNECTED",
        "CANCELLED",
    }

    status = data.status.strip().upper()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status",
        )

    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    order.status = status

    try:
        db.commit()
        db.refresh(order)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not update order status",
        )

    return {
        "message": "Order status updated successfully",
        "order_id": order.id,
        "status": order.status,
    }