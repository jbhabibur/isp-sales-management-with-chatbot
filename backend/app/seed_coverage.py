
from app.db.session import SessionLocal
from app.models.coverage_area import CoverageArea

coverage_areas = [
    ("Dhaka", "Uttara"),
    ("Dhaka", "Ashulia"),
    ("Dhaka", "Savar"),
    ("Dhaka", "Mohammadpur"),
    ("Chattogram", "Colonelhat"),
    ("Chattogram", "Agrabad"),
    ("Chattogram", "Boropol"),
]

db = SessionLocal()

try:
    added = 0

    for city, area_name in coverage_areas:
        exists = (
            db.query(CoverageArea)
            .filter(
                CoverageArea.city.ilike(city),
                CoverageArea.area_name.ilike(area_name),
            )
            .first()
        )

        if not exists:
            db.add(
                CoverageArea(
                    city=city,
                    area_name=area_name,
                    is_active=True,
                )
            )
            added += 1

    db.commit()
    print(f"Coverage areas seeded successfully. Added: {added}")

except Exception:
    db.rollback()
    raise

finally:
    db.close()
