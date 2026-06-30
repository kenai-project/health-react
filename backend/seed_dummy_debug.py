from sqlalchemy import select, func

from db.session import get_db_session
from db.models import User, StaffAssignment


def main():
    s = get_db_session()
    try:
        print('before users:', s.scalar(select(func.count()).select_from(User)))
        print('before assignments:', s.scalar(select(func.count()).select_from(StaffAssignment)))

        # insert a staff + user assignment directly
        staff = s.execute(select(User).where(User.role == 'Staff').limit(1)).scalar_one_or_none()
        user = s.execute(select(User).where(User.role == 'User').limit(1)).scalar_one_or_none()
        print('staff:', getattr(staff,'id',None), getattr(staff,'username',None))
        print('user:', getattr(user,'id',None), getattr(user,'username',None))

        if staff and user:
            existing = s.execute(
                select(StaffAssignment.id).where(
                    StaffAssignment.staff_id == staff.id,
                    StaffAssignment.user_id == user.id,
                )
            ).scalar_one_or_none()
            print('existing assignment id:', existing)
            if existing is None:
                s.add(StaffAssignment(staff_id=staff.id, user_id=user.id))
                s.commit()

        print('after assignments:', s.scalar(select(func.count()).select_from(StaffAssignment)))
    finally:
        s.close()


if __name__ == '__main__':
    main()

