import streamlit as st

from auth.auth_service import authenticate_user
from auth.bootstrap import bootstrap_admin_if_needed


def render_login():
    from db.session import get_db_session

    bootstrap_admin_if_needed(get_db_session)

    st.subheader("Login")
    username = st.text_input("Username")
    password = st.text_input("Password", type="password")

    if st.button("Sign in", type="primary"):
        user = authenticate_user(get_db_session, username=username, password=password)
        if user:
            st.session_state.user = user
            st.rerun()
        else:
            st.error("Invalid credentials")

    st.caption("Default admin will be created on first run with username: admin, password: admin123")

