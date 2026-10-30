
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.package import Package
from app.models.user import User
from app.core.dependencies import require_roles


router = APIRouter(prefix="/api/packages", tags=["Packages"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Schemas
class PackageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    speed: str = Field(min_length=1, max_length=50)
    monthly_price: float = Field(gt=0)


class PackageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    speed: str | None = Field(default=None, min_length=1, max_length=50)
    monthly_price: float | None = Field(default=None, gt=0)
    is_active: bool | None = None


# Public: Get active packages
@router.get("/")
def get_packages(db: Session = Depends(get_db)):
    packages = (
        db.query(Package)
        .filter(Package.is_active.is_(True))
        .order_by(Package.monthly_price.asc())
        .all()
    )

    return [
        {
            "id": package.id,
            "name": package.name,
            "speed": package.speed,
            "monthly_price": float(package.monthly_price),
            "is_active": package.is_active,
        }
        for package in packages
    ]


# Admin: Get all packages
@router.get("/admin")
def get_all_packages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    packages = (
        db.query(Package)
        .order_by(Package.monthly_price.asc())
        .all()
    )

    return [
        {
            "id": package.id,
            "name": package.name,
            "speed": package.speed,
            "monthly_price": float(package.monthly_price),
            "is_active": package.is_active,
            "created_at": package.created_at,
        }
        for package in packages
    ]


# Admin: Create package
@router.post("/")
def create_package(
    data: PackageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    name = data.name.strip()
    speed = data.speed.strip()

    if not name or not speed:
        raise HTTPException(
            status_code=422,
            detail="Package name and speed cannot be empty",
        )

    existing = (
        db.query(Package)
        .filter(Package.name.ilike(name))
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Package with this name already exists",
        )

    package = Package(
        name=name,
        speed=speed,
        monthly_price=data.monthly_price,
        is_active=True,
    )

    try:
        db.add(package)
        db.commit()
        db.refresh(package)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not create package",
        )

    return {
        "message": "Package created successfully",
        "id": package.id,
    }


# Admin: Update package
@router.patch("/{package_id}")
def update_package(
    package_id: int,
    data: PackageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    package = db.query(Package).filter(
        Package.id == package_id
    ).first()

    if not package:
        raise HTTPException(
            status_code=404,
            detail="Package not found",
        )

    update_data = data.model_dump(exclude_unset=True)

    for field in ("name", "speed"):
        if field in update_data and update_data[field] is not None:
            update_data[field] = update_data[field].strip()
            if not update_data[field]:
                raise HTTPException(
                    status_code=422,
                    detail=f"{field} cannot be empty",
                )

    new_name = update_data.get("name", package.name)

    duplicate = (
        db.query(Package)
        .filter(
            Package.id != package_id,
            Package.name.ilike(new_name),
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Package with this name already exists",
        )

    for field, value in update_data.items():
        setattr(package, field, value)

    try:
        db.commit()
        db.refresh(package)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not update package",
        )

    return {
        "message": "Package updated successfully",
        "id": package.id,
    }


# Admin: Delete package
@router.delete("/{package_id}")
def delete_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    package = db.query(Package).filter(
        Package.id == package_id
    ).first()

    if not package:
        raise HTTPException(
            status_code=404,
            detail="Package not found",
        )

    try:
        db.delete(package)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not delete package",
        )

    return {
        "message": "Package deleted successfully"
    }
