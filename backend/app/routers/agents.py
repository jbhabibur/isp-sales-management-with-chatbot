
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User
from app.core.dependencies import require_roles
from app.core.security import hash_password


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/agents",
    tags=["Sales Agents"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class AgentCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class AgentUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None


class AgentStatusUpdate(BaseModel):
    is_active: bool


def get_sales_agent(db: Session, agent_id: int):
    agent = (
        db.query(User)
        .filter(
            User.id == agent_id,
            User.role == "SALES_AGENT",
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales agent not found",
        )

    return agent


def agent_response(agent: User):
    return {
        "id": agent.id,
        "full_name": agent.full_name,
        "email": agent.email,
        "role": agent.role,
        "is_active": agent.is_active,
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_agent(
    data: AgentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMIN")),
):
    try:
        email = str(data.email).lower().strip()

        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is already registered",
            )

        agent = User(
            full_name=data.full_name.strip(),
            email=email,
            hashed_password=hash_password(data.password),
            role="SALES_AGENT",
            is_active=True,
        )

        db.add(agent)
        db.commit()
        db.refresh(agent)

        return {
            "message": "Sales agent created successfully",
            "agent": agent_response(agent),
        }

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Agent creation failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Could not create sales agent",
        )


@router.get("/")
def list_agents(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMIN")),
):
    agents = (
        db.query(User)
        .filter(User.role == "SALES_AGENT")
        .order_by(User.id.desc())
        .all()
    )

    return [agent_response(agent) for agent in agents]


@router.patch("/{agent_id}")
def update_agent(
    agent_id: int,
    data: AgentUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMIN")),
):
    agent = get_sales_agent(db, agent_id)

    update_data = data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided",
        )

    if "full_name" in update_data:
        agent.full_name = update_data["full_name"].strip()

    if "email" in update_data:
        email = str(update_data["email"]).lower().strip()

        existing_user = (
            db.query(User)
            .filter(
                User.email == email,
                User.id != agent_id,
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is already registered",
            )

        agent.email = email

    try:
        db.commit()
        db.refresh(agent)

        return {
            "message": "Sales agent updated successfully",
            "agent": agent_response(agent),
        }

    except Exception as exc:
        db.rollback()
        logger.exception("Agent update failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Could not update sales agent",
        )


@router.patch("/{agent_id}/status")
def update_agent_status(
    agent_id: int,
    data: AgentStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMIN")),
):
    agent = get_sales_agent(db, agent_id)

    try:
        agent.is_active = data.is_active

        db.commit()
        db.refresh(agent)

        return {
            "message": (
                "Sales agent activated successfully"
                if agent.is_active
                else "Sales agent deactivated successfully"
            ),
            "agent": agent_response(agent),
        }

    except Exception as exc:
        db.rollback()
        logger.exception("Agent status update failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Could not update sales agent status",
        )


@router.delete("/{agent_id}")
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMIN")),
):
    agent = get_sales_agent(db, agent_id)

    try:
        db.delete(agent)
        db.commit()

        return {
            "message": "Sales agent deleted successfully",
            "agent_id": agent_id,
        }

    except Exception as exc:
        db.rollback()
        logger.exception("Agent deletion failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Could not delete sales agent. Check whether this agent is referenced by other records.",
        )
