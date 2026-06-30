from __future__ import annotations

import random
from datetime import date, timedelta
from typing import Iterable

from sqlalchemy import select

from auth.auth_service import hash_password
from db.models import HealthRecord, StaffAssignment, User
from db.session import get_db_session


def _daterange(start: date, end: date) -> Iterable[date]:
    cur = start
    while cur <= end:
        yield cur
        cur += timedelta(days=1)


def seed_dummy_data(
    *,
    admin_username: str = "admin",
    admin_password: str = "admin123",
    staff_count: int = 4,
    user_count: int = 8,
    records_per_user: int = 24,
    start_days_ago: int = 180,
    seed: int = 42,
) -> None:
    random.seed(seed)

    session = get_db_session()
    try:
        # Ensure schema exists.
        # (When this script is run without the app/server bootstrapping, tables might not be created.)
        from db.migrate import create_tables_if_needed
        create_tables_if_needed()

        # Guard: if there are already health records, don't duplicate.
        existing_records = session.scalar(select(HealthRecord.id).limit(1))
        if existing_records is not None:
            return


        # Ensure admin exists.
        admin = session.execute(select(User).where(User.username == admin_username)).scalar_one_or_none()
        if not admin:
            admin = User(
                username=admin_username,
                password_hash=hash_password(admin_password),
                role="Admin",
            )
            session.add(admin)
            session.commit()

        # Create staff users.
        staff_users: list[User] = []
        for i in range(1, staff_count + 1):
            username = f"staff{i}"
            u = session.execute(select(User).where(User.username == username)).scalar_one_or_none()
            if not u:
                u = User(
                    username=username,
                    password_hash=hash_password("staff123"),
                    role="Staff",
                )
                session.add(u)
            staff_users.append(u)
        session.commit()

        # Create normal users.
        normal_users: list[User] = []
        for i in range(1, user_count + 1):
            username = f"user{i}"
            u = session.execute(select(User).where(User.username == username)).scalar_one_or_none()
            if not u:
                u = User(
                    username=username,
                    password_hash=hash_password("user123"),
                    role="User",
                )
                session.add(u)
            normal_users.append(u)
        session.commit()

        # Staff assignments: each user assigned to 1-2 staff.
        # Ensure deterministic but varied assignments.
        assigned_pairs: set[tuple[int, int]] = set()
        for u in normal_users:
            k = 1 if random.random() < 0.65 else 2
            staff_choices = random.sample(staff_users, k=min(k, len(staff_users)))
            for s in staff_choices:
                assigned_pairs.add((s.id, u.id))

        for staff_id, user_id in sorted(assigned_pairs):
            # avoid duplicates
            exists = session.execute(
                select(StaffAssignment.id).where(
                    StaffAssignment.staff_id == staff_id,
                    StaffAssignment.user_id == user_id,
                )
            ).scalar_one_or_none()
            if exists is None:
                session.add(StaffAssignment(staff_id=staff_id, user_id=user_id))
        session.commit()

        # Health record dummy data.
        foods = [
            "Oats",
            "Greek yogurt",
            "Chicken salad",
            "Salmon",
            "Rice bowl",
            "Veggie wrap",
            "Fruit smoothie",
            "Turkey sandwich",
            "Quinoa",
            "Stir-fry",
        ]
        exercises = [
            "Walking",
            "Yoga",
            "Running",
            "Cycling",
            "Strength training",
            "Swimming",
            "HIIT",
        ]

        today = date.today()
        start = today - timedelta(days=start_days_ago)
        dates = list(_daterange(start, today))
        random.shuffle(dates)
        dates = sorted(dates[: min(records_per_user * max(1, user_count), len(dates))])

        # Distribute dates per user.
        idx = 0
        for u in normal_users:
            for _ in range(records_per_user):
                if idx >= len(dates):
                    break
                d = dates[idx]
                idx += 1

                height_cm = random.choice([165, 168, 170, 172, 175, 178]) + random.uniform(-2.0, 2.0)
                weight_kg = random.choice([58, 62, 66, 70, 74, 78]) + random.uniform(-3.0, 3.0)

                # quick BMI estimate; backend recalculates BMI on create, but we seed directly.
                bmi = round(weight_kg / ((height_cm / 100) ** 2), 1)
                calories = random.choice([1800, 1900, 2000, 2100, 2200, 2300]) + random.uniform(-250, 250)
                water = round(random.uniform(1.2, 3.2), 1)
                sleep = round(random.uniform(5.5, 8.0), 1)

                record = HealthRecord(
                    user_id=u.id,
                    record_date=d.isoformat(),
                    height_cm=round(height_cm, 1),
                    weight_kg=round(weight_kg, 1),
                    bmi=bmi,
                    food=random.choice(foods),
                    calories=round(calories, 0),
                    water_liters=water,
                    sleep_hours=sleep,
                    exercise=random.choice(exercises),
                    created_by_user_id=None,
                )
                session.add(record)
            session.commit()

    finally:
        session.close()


if __name__ == "__main__":
    # Safe default: only inserts if the DB has no health records.
    seed_dummy_data()
    print("Dummy data seeded (if DB was empty).")

