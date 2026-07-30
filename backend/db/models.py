from sqlalchemy.orm import declarative_base, Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, Date, Float, ForeignKey, UniqueConstraint, Text, Boolean, Index

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # Admin/Staff/User

    records = relationship("HealthRecord", back_populates="user", cascade="all, delete-orphan")


class StaffAssignment(Base):
    __tablename__ = "staff_assignments"
    __table_args__ = (UniqueConstraint("staff_id", "user_id", name="uq_staff_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    staff_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)


class HealthRecord(Base):
    __tablename__ = "health_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    record_date: Mapped[str] = mapped_column(String(30), nullable=False, index=True)  # store as ISO string

    height_cm: Mapped[float] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=True)
    bmi: Mapped[float] = mapped_column(Float, nullable=True)

    food: Mapped[str] = mapped_column(String(200), nullable=True)
    calories: Mapped[float] = mapped_column(Float, nullable=True)
    water_liters: Mapped[float] = mapped_column(Float, nullable=True)
    sleep_hours: Mapped[float] = mapped_column(Float, nullable=True)
    exercise: Mapped[str] = mapped_column(String(200), nullable=True)

    created_by_user_id: Mapped[int] = mapped_column(Integer, nullable=True)

    user = relationship("User", back_populates="records")


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("idx_documents_user_status", "user_id", "status"),
        Index("idx_documents_checksum", "checksum"),
        Index("idx_documents_updated", "updated_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # File identity
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256
    version: Mapped[int] = mapped_column(Integer, default=1)

    # Timestamps
    upload_time: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[str] = mapped_column(String(30), nullable=False)
    updated_at: Mapped[str] = mapped_column(String(30), nullable=False)
    last_accessed: Mapped[str] = mapped_column(String(30), nullable=True)

    # Parsing
    parser_used: Mapped[str] = mapped_column(String(50), nullable=True)
    processing_time_ms: Mapped[float] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="UPLOADED")

    # Content
    extracted_text: Mapped[str] = mapped_column(Text, nullable=True)
    text_chunks: Mapped[str] = mapped_column(Text, nullable=True)
    doc_metadata: Mapped[str] = mapped_column(Text, nullable=True)

    # Error
    error_code: Mapped[str] = mapped_column(String(50), nullable=True)
    error_message: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    user = relationship("User", backref="documents")
    analyses = relationship("DocumentAnalysis", back_populates="document", cascade="all, delete-orphan")


class DocumentAnalysis(Base):
    __tablename__ = "document_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # AnalysisType enum value
    content: Mapped[str] = mapped_column(Text, nullable=False)
    llm_model: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_hash: Mapped[str] = mapped_column(String(64), nullable=True)
    citations: Mapped[str] = mapped_column(Text, nullable=True)
    generated_at: Mapped[str] = mapped_column(String(30), nullable=False)

    document = relationship("Document", back_populates="analyses")