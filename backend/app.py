import streamlit as st

from ui.pages import render_app

st.set_page_config(
    page_title="Health Dashboard",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded",
)

render_app()

