import streamlit as st

from db.migrate import create_tables_if_needed
from services.records import list_records, create_record_from_form
from ui.widgets import render_record_form
from ui.widgets import render_record_table


def page_records(scope: str):
    create_tables_if_needed()

    user = st.session_state.user

    st.subheader("Records")

    if scope == "self":
        user_ids = [user["id"]]
    else:
        user_ids = [user["id"]]

    filters = {
        "from_date": st.date_input("From", value=None),
        "to_date": st.date_input("To", value=None),
    }

    search = st.text_input("Search (food/exercise)")

    record_type = st.selectbox("Sort by", ["record_date desc", "record_date asc"], index=0)

    records = list_records(get_user_ids=user_ids, search=search, sort=record_type, filters=filters)

    render_record_form(user)
    st.markdown("---")
    render_record_table(records)

