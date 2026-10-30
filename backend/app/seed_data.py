
from app.db.session import SessionLocal
from app.models.package import Package


def seed_packages():
    db = SessionLocal()

    try:
        sample_packages = [
            {
                "name": "Basic",
                "speed": "20 Mbps",
                "monthly_price": 500,
                "is_active": True,
            },
            {
                "name": "Standard",
                "speed": "40 Mbps",
                "monthly_price": 800,
                "is_active": True,
            },
            {
                "name": "Premium",
                "speed": "60 Mbps",
                "monthly_price": 1200,
                "is_active": True,
            },
        ]

        for item in sample_packages:
            existing = (
                db.query(Package)
                .filter(Package.name == item["name"])
                .first()
            )

            if not existing:
                db.add(Package(**item))

        db.commit()
        print("Sample packages added successfully!")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_packages()
