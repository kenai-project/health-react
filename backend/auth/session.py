import streamlit as st

from auth.views import render_login


def require_login():
    if "user" not in st.session_state:
        render_login()
        st.stop()

