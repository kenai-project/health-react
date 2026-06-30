import streamlit as st

from db.migrate import create_tables_if_needed
from services.analytics import (
    get_summary_cards,
    get_total_records,
    get_total_staff,
    get_total_users,
)
from ui.widgets import render_suggestions


def _kpi_card(title: str, value, subtitle: str = ""):
    st.markdown(
        f"""
        <div class="glass card-hover" style="padding: 16px; height: 100%;">
          <div style="color: rgba(255,255,255,0.7); font-size: 13px;">{title}</div>
          <div style="margin-top: 10px; font-size: 28px; font-weight: 800;">{value}</div>
          {f'<div style="color: rgba(255,255,255,0.62); font-size: 12px; margin-top: 6px;">{subtitle}</div>' if subtitle else ''}
        </div>
        """,
        unsafe_allow_html=True,
    )


def page_dashboard():
    create_tables_if_needed()

    user = st.session_state.user
    summary = get_summary_cards(user)

    # HERO
    st.markdown(
        """
        <div class="glass fade-in" style="padding: 18px; margin-bottom: 14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 18px;">
            <div>
              <div style="font-size: 26px; font-weight: 900;">Welcome Back 👋</div>
              <div style="margin-top: 6px; color: rgba(255,255,255,0.7);">
                Manage users, staff assignments, records, and health analytics efficiently.
              </div>
            </div>
            <div style="text-align:right; color: rgba(255,255,255,0.65); font-size: 12px;">
              <div><b>Role:</b> {role}</div>
            </div>
          </div>
        </div>
        """.format(role=user.get("role", "")),
        unsafe_allow_html=True,
    )

    # KPI CARDS
    total_users = get_total_users(user)
    total_staff = get_total_staff(user)
    total_records = get_total_records(user)

    c1, c2, c3 = st.columns(3)
    with c1:
        _kpi_card("Total Users", f"{total_users:,}")
    with c2:
        _kpi_card("Total Staff", f"{total_staff:,}")
    with c3:
        _kpi_card("Total Records", f"{total_records:,}")

    # QUICK ACTIONS
    st.markdown("<div style='height:10px'></div>", unsafe_allow_html=True)
    a1, a2, a3, a4 = st.columns(4)
    with a1:
        if st.button("➕ Add User"):
            st.info("Navigate to Admin → Admin - Users to add users.")
    with a2:
        if st.button("👨‍⚕️ Add Staff"):
            st.info("Navigate to Admin → Admin - Users to add staff users.")
    with a3:
        if st.button("📝 New Record"):
            st.info("Open My Records / Manage Records to add a new health record.")
    with a4:
        if st.button("📊 Generate Report"):
            st.info("Reports UI is not wired yet; exporting can be added in a later phase.")

    st.markdown("---")

    # EXISTING METRICS + CHARTS (do not remove)
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Latest BMI", summary["latest_bmi"])
    c2.metric("Latest Weight (kg)", summary["latest_weight"])
    c3.metric("Avg Water (L)", summary["avg_water"])
    c4.metric("Avg Sleep (hrs)", summary["avg_sleep"])

    st.markdown("---")
    chart_col1, chart_col2 = st.columns(2)
    with chart_col1:
        st.plotly_chart(summary["weight_chart"], use_container_width=True)
    with chart_col2:
        st.plotly_chart(summary["bmi_chart"], use_container_width=True)

    st.markdown("---")
    chart_col3, chart_col4 = st.columns(2)
    with chart_col3:
        st.plotly_chart(summary["calories_chart"], use_container_width=True)
    with chart_col4:
        st.plotly_chart(summary["water_chart"], use_container_width=True)

    st.markdown("---")
    render_suggestions(user)


