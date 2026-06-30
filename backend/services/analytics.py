import pandas as pd
import plotly.express as px
from sqlalchemy import select, desc, func


from db.session import get_db_session
from db.models import HealthRecord, StaffAssignment, User



def get_user_scope_user_ids(user):
    role = user["role"]
    session = get_db_session()
    try:
        if role == "Admin":
            # Admin sees all users that have records OR at least themselves
            q = select(HealthRecord.user_id).distinct()
            ids = [r[0] for r in session.execute(q).all()]
            return ids or [user["id"]]
        if role == "Staff":
            q = select(StaffAssignment.user_id).where(StaffAssignment.staff_id == user["id"])
            ids = [r[0] for r in session.execute(q).all()]
            return ids or []
        return [user["id"]]
    finally:
        session.close()



def get_total_users(user):
    session = get_db_session()
    try:
        ids = get_user_scope_user_ids(user)
        if not ids:
            return 0
        return len(set(ids))
    finally:
        session.close()


def get_total_staff(user):
    session = get_db_session()
    try:
        # Admin: all staff users
        if user["role"] == "Admin":
            return session.scalar(
                select(func.count())
                .select_from(User)
                .where(User.role == "Staff")
            )


        # Staff: show number of staff members that manage any of the scoped users
        # (keeps it meaningful within staff's visibility)
        if user["role"] == "Staff":
            ids = get_user_scope_user_ids(user)
            if not ids:
                return 0
            q = (
                select(StaffAssignment.staff_id)
                .where(StaffAssignment.user_id.in_(ids))
                .distinct()
            )
            return len({r[0] for r in session.execute(q).all()})

        # Normal user: 0 staff in their view
        return 0
    finally:
        session.close()


def get_total_records(user):
    session = get_db_session()
    try:
        ids = get_user_scope_user_ids(user)
        if not ids:
            return 0
        q = select(HealthRecord.id).where(HealthRecord.user_id.in_(ids))
        return session.execute(q).all().__len__()
    finally:
        session.close()


def get_summary_cards(user):
    session = get_db_session()
    try:
        ids = get_user_scope_user_ids(user)
        if not ids:
            empty = px.line()
            return {
                "latest_bmi": "-",
                "latest_weight": "-",
                "avg_water": "-",
                "avg_sleep": "-",
                "weight_chart": empty,
                "bmi_chart": empty,
                "calories_chart": empty,
                "water_chart": empty,
            }


        q = select(HealthRecord).where(HealthRecord.user_id.in_(ids))
        rows = session.execute(q).scalars().all()
        df = pd.DataFrame([
            {
                "record_date": r.record_date,
                "weight_kg": r.weight_kg,
                "bmi": r.bmi,
                "calories": r.calories,
                "water_liters": r.water_liters,
                "sleep_hours": r.sleep_hours,
            }
            for r in rows
        ])

        if df.empty:
            empty = px.line()
            return {
                "latest_bmi": "-",
                "latest_weight": "-",
                "avg_water": "-",
                "avg_sleep": "-",
                "weight_chart": empty,
                "bmi_chart": empty,
                "calories_chart": empty,
                "water_chart": empty,
            }

        df["record_date"] = pd.to_datetime(df["record_date"], errors="coerce")
        df = df.dropna(subset=["record_date"]).sort_values("record_date")

        latest = df.dropna(subset=["weight_kg"], how="all").tail(1)
        latest_bmi = df.dropna(subset=["bmi"], how="all").tail(1)

        latest_weight = latest["weight_kg"].iloc[0] if not latest.empty else None
        latest_bmi_val = latest_bmi["bmi"].iloc[0] if not latest_bmi.empty else None

        avg_water = df["water_liters"].dropna().mean() if df["water_liters"].notna().any() else None
        avg_sleep = df["sleep_hours"].dropna().mean() if df["sleep_hours"].notna().any() else None

        weight_chart = px.line(df, x="record_date", y="weight_kg", markers=True, title="Weight Trend")
        bmi_chart = px.line(df, x="record_date", y="bmi", markers=True, title="BMI Trend")
        calories_chart = px.bar(df, x="record_date", y="calories", title="Calories Intake")
        water_chart = px.line(df, x="record_date", y="water_liters", markers=True, title="Water Intake")

        return {
            "latest_bmi": f"{latest_bmi_val}" if latest_bmi_val is not None else "-",
            "latest_weight": f"{latest_weight}" if latest_weight is not None else "-",
            "avg_water": f"{round(avg_water, 2)}" if avg_water is not None else "-",
            "avg_sleep": f"{round(avg_sleep, 2)}" if avg_sleep is not None else "-",
            "weight_chart": weight_chart,
            "bmi_chart": bmi_chart,
            "calories_chart": calories_chart,
            "water_chart": water_chart,
        }
    finally:
        session.close()

