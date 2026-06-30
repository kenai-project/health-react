from sqlalchemy import select, desc

from db.session import get_db_session
from db.models import HealthRecord, StaffAssignment


def _get_scope_user_ids(user):
    session = get_db_session()
    try:
        if user["role"] == "Admin":
            q = select(HealthRecord.user_id).distinct()
            ids = [r[0] for r in session.execute(q).all()]
            return ids or [user["id"]]
        if user["role"] == "Staff":
            q = select(StaffAssignment.user_id).where(StaffAssignment.staff_id == user["id"])
            ids = [r[0] for r in session.execute(q).all()]
            return ids or []
        return [user["id"]]
    finally:
        session.close()


def get_latest_suggestions(user):
    session = get_db_session()
    try:
        ids = _get_scope_user_ids(user)
        if not ids:
            return []

        q = select(HealthRecord).where(HealthRecord.user_id.in_(ids)).order_by(desc(HealthRecord.record_date))
        rows = session.execute(q).scalars().all()
        if not rows:
            return []

        latest = rows[0]
        suggestions = []

        bmi = latest.bmi
        water = latest.water_liters
        sleep = latest.sleep_hours
        calories = latest.calories

        if bmi is not None:
            if bmi < 18.5:
                suggestions.append({"title": "Underweight", "message": "Consider increasing protein and calorie intake along with strength training."})
            elif bmi < 25:
                suggestions.append({"title": "Healthy BMI", "message": "Maintain balanced diet, regular exercise, and consistent sleep."})
            else:
                suggestions.append({"title": "Overweight/Obesity", "message": "Aim for a calorie deficit, increase walking, and monitor portion sizes."})

        if water is not None and water < 2.0:
            suggestions.append({"title": "Low water intake", "message": "Increase water intake toward ~2.5–3.0 liters/day."})

        if sleep is not None and sleep < 7:
            suggestions.append({"title": "Poor sleep", "message": "Try to reach 7–8 hours sleep for better recovery and appetite regulation."})

        if calories is not None and calories > 0:
            if bmi is not None and bmi >= 25 and calories > 2500:
                suggestions.append({"title": "High intake for goals", "message": "If weight loss is your goal, reduce calories and choose nutrient-dense foods."})

        return suggestions[:6]
    finally:
        session.close()

