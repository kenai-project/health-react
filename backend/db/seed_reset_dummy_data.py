from __future__ import annotations

import random
from datetime import date, timedelta

from sqlalchemy import select, func

from auth.auth_service import hash_password



from db.migrate import create_tables_if_needed
from db.session import get_db_session
from db.models import HealthRecord, StaffAssignment, User


def reset_and_seed_dummy_data(
    *,
    staff_count: int = 4,
    user_count: int = 8,
    records_per_user: int = 24,
    start_days_ago: int = 180,
    seed: int = 42,
) -> None:
    random.seed(seed)

    create_tables_if_needed()

    session = get_db_session()
    try:
        # Reset existing content
        session.execute(HealthRecord.__table__.delete())
        session.execute(StaffAssignment.__table__.delete())
        session.execute(User.__table__.delete())
        session.commit()

        # Admin
        admin = User(username="admin", password_hash=hash_password("admin123"), role="Admin")
        session.add(admin)
        session.commit()

        # Staff
        staff_users: list[User] = []
        for i in range(1, staff_count + 1):
            u = User(username=f"staff{i}", password_hash=hash_password("staff123"), role="Staff")
            session.add(u)
            staff_users.append(u)
        session.commit()

        # Normal users
        normal_users: list[User] = []
        for i in range(1, user_count + 1):
            u = User(username=f"user{i}", password_hash=hash_password("user123"), role="User")
            session.add(u)
            normal_users.append(u)
        session.commit()

        # Assignments
        assigned_pairs: set[tuple[int, int]] = set()
        for u in normal_users:
            k = 1 if random.random() < 0.65 else 2
            staff_choices = random.sample(staff_users, k=min(k, len(staff_users)))
            for s in staff_choices:
                assigned_pairs.add((s.id, u.id))

        for staff_id, user_id in sorted(assigned_pairs):
            session.add(StaffAssignment(staff_id=staff_id, user_id=user_id))
        session.commit()

        # Records
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
        dates = [start + timedelta(days=i) for i in range((today - start).days + 1)]
        random.shuffle(dates)

        # cap total records to available days
        total_needed = records_per_user * max(1, user_count)
        dates = sorted(dates[: min(total_needed, len(dates))])

        idx = 0
        for u in normal_users:
            for _ in range(records_per_user):
                if idx >= len(dates):
                    break
                d = dates[idx]
                idx += 1

                height_cm = random.choice([165, 168, 170, 172, 175, 178]) + random.uniform(-2.0, 2.0)
                weight_kg = random.choice([58, 62, 66, 70, 74, 78]) + random.uniform(-3.0, 3.0)

                bmi = round(weight_kg / ((height_cm / 100) ** 2), 1)
                calories = random.choice([1800, 1900, 2000, 2100, 2200, 2300]) + random.uniform(-250, 250)
                water = round(random.uniform(1.2, 3.2), 1)
                sleep = round(random.uniform(5.5, 8.0), 1)

                session.add(
                    HealthRecord(
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
                )
            session.commit()

    finally:
        session.close()


if __name__ == "__main__":
    reset_and_seed_dummy_data()
    print("Reset + seeded dummy data.")

