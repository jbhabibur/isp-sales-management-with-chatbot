from app.db.session import test_connection

if __name__ == "__main__":
    result = test_connection()
    print(f"Database connected successfully! Result: {result}")