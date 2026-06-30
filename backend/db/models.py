from sqlalchemy.orm import declarative_base, Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, Date, Float, ForeignKey, UniqueConstraint

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

