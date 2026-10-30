from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.dependencies import require_roles
from app.models.user import User
from app.models.order import Order

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/admin")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    ),
):
    total_orders = db.query(Order).count()

    pending_orders = db.query(Order).filter(
        Order.status == "PENDING"
    ).count()

    completed_connections = db.query(Order).filter(
        Order.status == "CONNECTED"
    ).count()

    total_sales_agents = db.query(User).filter(
        User.role == "SALES_AGENT",
        User.is_active.is_(True),
    ).count()

    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_connections": completed_connections,
        "total_sales_agents": total_sales_agents,
    }


@router.get("/agent")
def agent_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("SALES_AGENT")
    ),
):
    total_orders = db.query(Order).count()

    pending_orders = db.query(Order).filter(
        Order.status == "PENDING"
    ).count()

    confirmed_orders = db.query(Order).filter(
        Order.status == "CONFIRMED"
    ).count()

    connected_orders = db.query(Order).filter(
        Order.status == "CONNECTED"
    ).count()

    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "confirmed_orders": confirmed_orders,
        "connected_orders": connected_orders,
    }