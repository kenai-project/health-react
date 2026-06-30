from db.session import engine
from db.models import Base


def create_tables_if_needed():
    Base.metadata.create_all(bind=engine)

