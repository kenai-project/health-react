import streamlit as st

from ui.pages_dashboard import page_dashboard
from ui.pages_records import page_records
from ui.pages_admin import page_admin
from ui.pages_staff import page_staff


def render_sidebar():
    """Render ONLY sidebar UI.

    This function must not call page_* renderers; those should be rendered in the main page area.
    """
    user = st.session_state.user
    role = user["role"]

    with st.sidebar:
        st.markdown(
            """
            <div class="glass" style="padding: 16px; margin-bottom: 14px;">
              <div style="font-size: 20px; font-weight: 700;">🏥 Health Dashboard</div>
              <div style="color: rgba(255,255,255,0.65); font-size: 13px; margin-top: 4px;">
                Modern healthcare admin panel
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.markdown(
            """
            <div style="margin: 6px 0 12px 0; color: rgba(255,255,255,0.75);">
              Signed in as <b>{username}</b>
            </div>
            """.format(username=user["username"]),
            unsafe_allow_html=True,
        )

        if st.button("Logout"):
            st.session_state.pop("user", None)
            st.rerun()

        # Icon-based navigation (store selection, don't render pages here)
        if role == "Admin":
            st.session_state.sidebar_page = st.radio(
                "Menu",
                ["📊 Dashboard", "🧾 My Records", "🛠️ Admin - Users"],
                index=0,
            )
        elif role == "Staff":
            st.session_state.sidebar_page = st.radio(
                "Menu",
                ["📊 Dashboard", "👩‍⚕️ Manage Records"],
                index=0,
            )
        else:
            st.session_state.sidebar_page = st.radio(
                "Menu",
                ["📊 Dashboard", "🧾 My Records"],
                index=1,
            )

        # Keep only sidebar-related UI elements in this function.


def render_page_for_sidebar_selection():
    """Render the selected page in the main content area."""
    user = st.session_state.user
    role = user["role"]
    page = st.session_state.get("sidebar_page", "📊 Dashboard")

    if role == "Admin":
        if page.startswith("📊"):
            page_dashboard()
        elif page.startswith("🧾"):
            page_records(scope="self")
        else:
            page_admin()
    elif role == "Staff":
        if page.startswith("📊"):
            page_dashboard()
        else:
            page_staff()
    else:
        if page.startswith("📊"):
            page_dashboard()
        else:
            page_records(scope="self")


