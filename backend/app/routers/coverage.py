
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.coverage_area import CoverageArea
from app.models.user import User
from app.core.dependencies import require_roles


router = APIRouter(
    prefix="/api/coverage",
    tags=["Coverage"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Schemas
class CoverageAreaCreate(BaseModel):
    city: str = Field(min_length=2, max_length=100)
    area_name: str = Field(min_length=2, max_length=100)


class CoverageAreaUpdate(BaseModel):
    city: str | None = Field(default=None, min_length=2, max_length=100)
    area_name: str | None = Field(default=None, min_length=2, max_length=100)
    is_active: bool | None = None


# Public: Get active coverage areas
@router.get("/")
def get_coverage_areas(db: Session = Depends(get_db)):
    areas = (
        db.query(CoverageArea)
        .filter(CoverageArea.is_active.is_(True))
        .order_by(CoverageArea.city, CoverageArea.area_name)
        .all()
    )

    return [
        {
            "id": area.id,
            "city": area.city,
            "area_name": area.area_name,
            "is_active": area.is_active,
        }
        for area in areas
    ]


# Public: Check coverage
@router.get("/check")
def check_coverage(
    city: str,
    area: str,
    db: Session = Depends(get_db),
):
    coverage = (
        db.query(CoverageArea)
        .filter(
            CoverageArea.is_active.is_(True),
            CoverageArea.city.ilike(city.strip()),
            CoverageArea.area_name.ilike(area.strip()),
        )
        .first()
    )

    return {
        "city": city,
        "area": area,
        "covered": coverage is not None,
    }


# Admin: Get all coverage areas (including inactive)
@router.get("/admin")
def get_all_coverage_areas(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    areas = (
        db.query(CoverageArea)
        .order_by(CoverageArea.city, CoverageArea.area_name)
        .all()
    )

    return [
        {
            "id": area.id,
            "city": area.city,
            "area_name": area.area_name,
            "is_active": area.is_active,
            "created_at": area.created_at,
        }
        for area in areas
    ]


# Admin: Create coverage area
@router.post("/")
def create_coverage_area(
    data: CoverageAreaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    city = data.city.strip()
    area_name = data.area_name.strip()

    existing = (
        db.query(CoverageArea)
        .filter(
            CoverageArea.city.ilike(city),
            CoverageArea.area_name.ilike(area_name),
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="This coverage area already exists",
        )

    coverage = CoverageArea(
        city=city,
        area_name=area_name,
        is_active=True,
    )

    try:
        db.add(coverage)
        db.commit()
        db.refresh(coverage)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not create coverage area",
        )

    return {
        "message": "Coverage area created successfully",
        "id": coverage.id,
    }


# Admin: Update coverage area
@router.patch("/{area_id}")
def update_coverage_area(
    area_id: int,
    data: CoverageAreaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    coverage = db.query(CoverageArea).filter(
        CoverageArea.id == area_id
    ).first()

    if not coverage:
        raise HTTPException(
            status_code=404,
            detail="Coverage area not found",
        )

    update_data = data.model_dump(exclude_unset=True)

    for field in ("city", "area_name"):
        if field in update_data and update_data[field] is not None:
            update_data[field] = update_data[field].strip()

    new_city = update_data.get("city", coverage.city)
    new_area = update_data.get("area_name", coverage.area_name)

    duplicate = (
        db.query(CoverageArea)
        .filter(
            CoverageArea.id != area_id,
            CoverageArea.city.ilike(new_city),
            CoverageArea.area_name.ilike(new_area),
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="This coverage area already exists",
        )

    for field, value in update_data.items():
        setattr(coverage, field, value)

    try:
        db.commit()
        db.refresh(coverage)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not update coverage area",
        )

    return {
        "message": "Coverage area updated successfully",
        "id": coverage.id,
    }


# Admin: Delete coverage area
@router.delete("/{area_id}")
def delete_coverage_area(
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    coverage = db.query(CoverageArea).filter(
        CoverageArea.id == area_id
    ).first()

    if not coverage:
        raise HTTPException(
            status_code=404,
            detail="Coverage area not found",
        )

    try:
        db.delete(coverage)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not delete coverage area",
        )

    return {
        "message": "Coverage area deleted successfully"
    }
