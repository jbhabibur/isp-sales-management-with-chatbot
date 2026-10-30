
from app.db.base import Base

print("Registered database tables: ")

for table_name in Base.metadata.tables:
    print(f"- {table_name}")

print(f"\nTotal tables: {len(Base.metadata.tables)}")
