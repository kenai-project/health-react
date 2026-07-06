from db.session import engine
from db.models import Base


def create_tables_if_needed():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully.")
    except Exception as e:
        print("❌ Error creating database:", e)
        raise


if __name__ == "__main__":
    create_tables_if_needed()