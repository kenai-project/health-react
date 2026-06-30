import streamlit as st

from db.migrate import create_tables_if_needed
from services.staff import list_assigned_users, ensure_staff_assignment
from services.records import list_records, create_record_from_form
from ui.widgets import render_record_form
from ui.widgets import render_user_selector
from ui.widgets import render_record_table


def page_staff():
    create_tables_if_needed()
    staff = st.session_state.user

    st.subheader("Staff - Manage Records")

    assigned_users = list_assigned_users(staff)
    if not assigned_users:
        st.info("No assigned users yet. Admin can assign users to this staff account.")
        return

    selected_user_id = render_user_selector(assigned_users)

    filters = {"from_date": st.date_input("From"), "to_date": st.date_input("To")}
    search = st.text_input("Search (food/exercise)")

    records = list_records(
        get_user_ids=[selected_user_id],
        search=search,
        sort="record_date desc",
        filters=filters,
    )

    render_record_form(staff, target_user_id=selected_user_id)
    st.markdown("---")
    render_record_table(records)

