
import getpass

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password


def main():
    db = SessionLocal()

    try:
        full_name = input("Admin full name: ").strip()
        email = input("Admin email: ").strip().lower()

        if not full_name or not email:
            print("Name and email are required.")
            return

        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            print("This email already exists. No account created.")
            return

        password = getpass.getpass("Admin password (min 12 characters): ")
        confirm_password = getpass.getpass("Confirm password: ")

        if len(password) < 12:
            print("Password must contain at least 12 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        admin = User(
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            role="ADMIN",
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Admin account created successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
