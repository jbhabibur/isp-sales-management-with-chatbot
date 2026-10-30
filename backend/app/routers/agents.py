
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


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_agent(
    data: AgentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMIN")),
):
    print(">>> AGENT CREATE API HIT <<<", flush=True)
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
            "agent": {
                "id": agent.id,
                "full_name": agent.full_name,
                "email": agent.email,
                "role": agent.role,
                "is_active": agent.is_active,
            },
        }

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        print("AGENT CREATE ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Could not create sales agent"
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

    return [
        {
            "id": agent.id,
            "full_name": agent.full_name,
            "email": agent.email,
            "role": agent.role,
            "is_active": agent.is_active,
        }
        for agent in agents
    ]
