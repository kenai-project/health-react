from sqlalchemy import select, desc, asc, or_

from db.session import get_db_session
from db.models import HealthRecord, StaffAssignment
from services.bmi import calc_bmi
from services.parsing import parse_date


def list_records(get_user_ids, search: str = "", sort: str = "record_date desc", filters=None):
    session = get_db_session()
    try:
        filters = filters or {}
        from_date = filters.get("from_date")
        to_date = filters.get("to_date")

        q = select(HealthRecord).where(HealthRecord.user_id.in_(get_user_ids))

        if search:
            like = f"%{search}%"
            q = q.where(or_(HealthRecord.food.ilike(like), HealthRecord.exercise.ilike(like)))

        if from_date:
            q = q.where(HealthRecord.record_date >= str(from_date))
        if to_date:
            q = q.where(HealthRecord.record_date <= str(to_date))

        if sort == "record_date asc":
            q = q.order_by(asc(HealthRecord.record_date))
        else:
            q = q.order_by(desc(HealthRecord.record_date))

        rows = session.execute(q).scalars().all()
        return [
            {
                "id": r.id,
                "user_id": r.user_id,
                "record_date": r.record_date,
                "height_cm": r.height_cm,
                "weight_kg": r.weight_kg,
                "bmi": r.bmi,
                "food": r.food,
                "calories": r.calories,
                "water_liters": r.water_liters,
                "sleep_hours": r.sleep_hours,
                "exercise": r.exercise,
            }
            for r in rows
        ]
    finally:
        session.close()


def create_record_from_form(rec: dict):
    session = get_db_session()
    try:
        iso_date = parse_date(rec.get("record_date"))
        if not iso_date:
            raise ValueError("Invalid date. Use YYYY-MM-DD")

        bmi = calc_bmi(rec.get("height_cm"), rec.get("weight_kg"))

        record = HealthRecord(
            user_id=rec["target_user_id"],
            record_date=iso_date,
            height_cm=rec.get("height_cm"),
            weight_kg=rec.get("weight_kg"),
            bmi=bmi,
            food=rec.get("food"),
            calories=rec.get("calories"),
            water_liters=rec.get("water_liters"),
            sleep_hours=rec.get("sleep_hours"),
            exercise=rec.get("exercise"),
            created_by_user_id=rec.get("created_by_user_id"),
        )
        session.add(record)
        session.commit()
        return record.id
    finally:
        session.close()

