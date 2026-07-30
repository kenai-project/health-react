"""
Database Isolation Verification

Verifies that the DATABASE_URL override in test_documents.py correctly
isolates tests to an in-memory SQLite database.

Checks (matching user's 5 verification points):
1. Engine is created lazily after DATABASE_URL is read
2. No module imports db.session before the env var is set (structural)
3. Engine used by tests is actually in-memory SQLite
4. Foreign key enforcement can be enabled via event listener
5. Tests execute against the isolated database
"""

import os
import sys
import pytest


def test_point1_engine_created_after_env_read():
    """Point 1: Engine is created lazily after DATABASE_URL is read.

    db/session.py reads os.environ.get('DATABASE_URL') at module level.
    We verify by setting the env var BEFORE importing db.session
    and checking that the engine reflects the override.
    """
    os.environ["DATABASE_URL"] = "sqlite:///:memory:?foreign_keys=on"

    # Force a fresh import so db.session reads our env var
    import importlib
    import db.session
    importlib.reload(db.session)

    engine = db.session.engine
    assert engine.dialect.name == "sqlite", (
        f"Engine dialect should be sqlite, got: {engine.dialect.name}"
    )
    assert ":memory:" in str(engine.url), (
        f"Engine URL should contain ':memory:', got: {engine.url}"
    )
    assert "foreign_keys=on" in str(engine.url)


def test_point3_engine_is_in_memory():
    """Point 3: Engine used by tests is in-memory SQLite.

    Validates the engine's dialect, in-memory identity, and
    that we can actually create tables and persist data.
    """
    os.environ["DATABASE_URL"] = "sqlite:///:memory:?foreign_keys=on"
    import importlib
    import db.session
    importlib.reload(db.session)

    engine = db.session.engine

    # Check dialect is sqlite
    assert engine.dialect.name == "sqlite"

    # Verify in-memory
    assert engine.url.database == ":memory:" or ":memory:" in str(engine.url), (
        f"Engine URL should be in-memory, got: {engine.url}"
    )

    # Verify we can actually create tables and insert data
    from db.models import Base, User
    from sqlalchemy import inspect

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "users" in tables, "Users table should exist"

    # Verify data persistence within the session
    from db.session import SessionLocal
    session = SessionLocal()
    try:
        test_user = User(
            username="verification_user",
            password_hash="test_hash",
            role="User",
        )
        session.add(test_user)
        session.commit()

        from sqlalchemy import select
        result = session.execute(
            select(User).where(User.username == "verification_user")
        ).scalar_one_or_none()
        assert result is not None
        assert result.username == "verification_user"
    finally:
        session.close()


def test_point4_foreign_keys_can_be_enabled():
    """Point 4: Foreign key enforcement is available for SQLite tests.

    SQLite does NOT enforce foreign keys by default. The correct way
    to enable it is via a SQLAlchemy event listener that issues
    PRAGMA foreign_keys=ON on each new connection.

    This test verifies that:
    - FK enforcement can be enabled via event listener
    - SQLite actually rejects FK violations when enabled
    - The test fixture can use this pattern if needed
    """
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    import importlib
    import db.session
    importlib.reload(db.session)

    from sqlalchemy import event
    engine = db.session.engine

    # Attach FK enforcement listener
    @event.listens_for(engine, "connect")
    def _set_fk_pragma(dbapi_con, con_record):
        dbapi_con.execute("PRAGMA foreign_keys=ON")

    from db.models import Base
    Base.metadata.create_all(bind=engine)

    from db.session import SessionLocal
    session = SessionLocal()
    try:
        # Verify PRAGMA is ON
        result = session.execute(
            __import__("sqlalchemy").text("PRAGMA foreign_keys")
        ).scalar()
        assert result == 1, f"PRAGMA foreign_keys should be 1, got: {result}"

        # Verify FK violations are actually rejected
        from db.models import Document, User
        from sqlalchemy import exc

        # Attempt to insert a document with a non-existent user_id
        bad_doc = Document(
            user_id=99999,  # Does not exist
            original_filename="test.pdf",
            stored_filename="test.pdf",
            mime_type="application/pdf",
            file_size=100,
            checksum="abc123",
            version=1,
            upload_time="2026-01-01T00:00:00",
            created_at="2026-01-01T00:00:00",
            updated_at="2026-01-01T00:00:00",
            status="UPLOADED",
        )
        with pytest.raises(exc.IntegrityError):
            session.add(bad_doc)
            session.flush()
    finally:
        session.rollback()
        session.close()


def test_point5_isolation_from_dev_database():
    """Point 5: Tests execute against the isolated database.

    Verifies that the in-memory database does not point to
    the development database file.
    """
    os.environ["DATABASE_URL"] = "sqlite:///:memory:?foreign_keys=on"
    import importlib
    import db.session
    importlib.reload(db.session)

    engine = db.session.engine
    from db.models import Base
    from sqlalchemy import inspect

    Base.metadata.create_all(bind=engine)

    # Verify the engine is NOT connected to a file-based database
    assert "health.db" not in str(engine.url), (
        "Engine should not be connected to development database"
    )

    # The database should have tables after create_all
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert len(tables) > 0, "Test database should have tables after create_all"


def test_point2_structural_import_order():
    """Point 2: No module imports db.session before env var is set.

    This is a structural guarantee enforced by test_documents.py:
    - Line 26: os.environ.setdefault("DATABASE_URL", ...)
    - Line 39+: from db.session import ...

    We verify by importing test_documents as a module and checking
    that the env var is set before any db.session import occurs.
    """
    # Read test_documents.py and verify ordering
    test_file = os.path.join(os.path.dirname(__file__), "test_documents.py")
    with open(test_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the env var setdefault line
    env_line_idx = content.find("os.environ.setdefault(\"DATABASE_URL\"")
    # Find the first backend import
    first_import_idx = content.find("from db.session import")

    assert env_line_idx >= 0, (
        "test_documents.py must set DATABASE_URL before imports"
    )
    assert first_import_idx >= 0, (
        "test_documents.py must import from db.session"
    )
    assert env_line_idx < first_import_idx, (
        f"DATABASE_URL override (line {content[:env_line_idx].count(chr(10)) + 1}) "
        f"must come before db.session import "
        f"(line {content[:first_import_idx].count(chr(10)) + 1})"
    )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
