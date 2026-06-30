import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import date

from services.suggestions import get_latest_suggestions
from services.bmi import calc_bmi
from services.parsing import parse_date
from services.records import create_record_from_form


def _glass_container_start():
    # Use the existing `.glass` class defined in ui/pages.py (via global CSS injection)
    st.markdown(
        """
        <div class="glass" style="padding: 16px; margin: 8px 0;">
        """,
        unsafe_allow_html=True,
    )


def _glass_container_end():
    st.markdown("</div>", unsafe_allow_html=True)


def _get_avatar(username: str):
    try:
        if username and isinstance(username, str):
            initial = username.strip()[0].upper()
            return f"👤 {initial}"
    except Exception:
        pass
    return "👤 ?"


def _status_for_role(role: str):
    if role == "Staff":
        return "🟢 Active"
    if role == "User":
        return "🟡 User"
    return "🔴 Unknown"


def _bmi_category(bmi_value):
    try:
        if bmi_value is None or (isinstance(bmi_value, float) and pd.isna(bmi_value)):
            return None
        bmi = float(bmi_value)
        if bmi < 18.5:
            return "Underweight"
        if 18.5 <= bmi < 25:
            return "Normal"
        if 25 <= bmi < 30:
            return "Overweight"
        return "Obese"
    except Exception:
        return None


def render_suggestions(user):
    st.subheader("AI-based Suggestions")
    suggestions = get_latest_suggestions(user)

    for s in suggestions:
        st.info(f"{s['title']}: {s['message']}")


def render_record_form(current_user, target_user_id=None):
    with st.expander("➕ Add Record", expanded=False):
        _glass_container_start()

        try:
            if target_user_id is None:
                user_id = current_user["id"]
            else:
                user_id = target_user_id

            record_date = st.date_input("Date", value=date.today())
            record_date = record_date.isoformat()

            st.markdown("### Vital Stats")
            height_cm = st.number_input(
                "Height (cm)", min_value=0.0, step=0.1, value=0.0, format="%.1f"
            )
            weight_kg = st.number_input(
                "Weight (kg)", min_value=0.0, step=0.1, value=0.0, format="%.1f"
            )

            st.markdown("### Lifestyle")
            food = st.text_input("Food / Diet")
            calories = st.number_input("Calories", min_value=0.0, step=1.0, value=0.0)
            water_liters = st.number_input(
                "Water (liters)", min_value=0.0, step=0.1, value=0.0, format="%.1f"
            )
            sleep_hours = st.number_input(
                "Sleep (hours)", min_value=0.0, step=0.1, value=0.0, format="%.1f"
            )
            exercise = st.text_input("Exercise")

            if st.button("Save Record", type="primary"):
                rec = {
                    "record_date": record_date,
                    "height_cm": height_cm if height_cm > 0 else None,
                    "weight_kg": weight_kg if weight_kg > 0 else None,
                    "food": food or None,
                    "calories": calories if calories > 0 else None,
                    "water_liters": water_liters if water_liters > 0 else None,
                    "sleep_hours": sleep_hours if sleep_hours > 0 else None,
                    "exercise": exercise or None,
                    "target_user_id": user_id,
                    "created_by_user_id": current_user["id"],
                }
                create_record_from_form(rec)
                st.success("Record saved")
                st.rerun()
        finally:
            _glass_container_end()


def render_record_table(records):
    _glass_container_start()
    try:
        if not records:
            st.info("No records found")
            return

        df = pd.DataFrame(records)

        st.markdown("### Records")

        search = st.text_input("🔍 Search records", value="")

        from_date = st.date_input("📅 From Date", value=None)
        to_date = st.date_input("📅 To Date", value=None)

        bmi_filter = st.selectbox(
            "BMI Category",
            ["All", "Underweight", "Normal", "Overweight", "Obese"],
        )

        # Optional: try to filter by user_id if present
        user_id_options = None
        if "user_id" in df.columns and not df["user_id"].isna().all():
            user_id_options = sorted([x for x in df["user_id"].dropna().unique().tolist()])

        selected_user_id = None
        if user_id_options:
            selected_user_id = st.selectbox(
                "User ID (optional)", ["All"] + user_id_options
            )

        # Local filtering (do not alter backend behavior)
        filtered = df.copy()

        if search:
            s = search.strip()
            if "food" in filtered.columns:
                filtered = filtered[
                    filtered["food"].astype(str).str.contains(s, case=False, na=False)
                    | (
                        filtered["exercise"].astype(str).str.contains(s, case=False, na=False)
                        if "exercise" in filtered.columns
                        else False
                    )
                ]
            elif "exercise" in filtered.columns:
                filtered = filtered[
                    filtered["exercise"].astype(str).str.contains(s, case=False, na=False)
                ]

        if from_date:
            from_iso = from_date.isoformat()
            if "record_date" in filtered.columns:
                filtered = filtered[filtered["record_date"] >= from_iso]

        if to_date:
            to_iso = to_date.isoformat()
            if "record_date" in filtered.columns:
                filtered = filtered[filtered["record_date"] <= to_iso]

        if bmi_filter != "All":
            if "bmi" in filtered.columns:
                filtered = filtered[
                    filtered["bmi"].apply(_bmi_category) == bmi_filter
                ]

        if selected_user_id is not None and selected_user_id != "All":
            if "user_id" in filtered.columns:
                filtered = filtered[filtered["user_id"] == selected_user_id]

        if filtered.empty:
            st.info("No records match your filters")
            return

        # Styling: st.data_editor can be risky; keep dataframe for stability.
        st.dataframe(filtered, use_container_width=True, hide_index=True)
    finally:
        _glass_container_end()


def render_user_selector(assigned_users):
    options = {u["id"]: f"{u['username']} (id={u['id']})" for u in assigned_users}
    selected = st.selectbox("Select user", list(options.keys()), format_func=lambda x: options[x])
    return selected


def render_user_table(users):
    _glass_container_start()
    try:
        if not users:
            st.info("No users found")
            return

        search = st.text_input("🔍 Search users", value="")

        df = pd.DataFrame(users)
        if search:
            s = search.strip()
            if "username" in df.columns:
                df = df[df["username"].astype(str).str.contains(s, case=False, na=False)]

        if df.empty:
            st.info("No users found")
            return

        # Modern display columns
        display = pd.DataFrame(
            {
                "Avatar": df["username"].apply(_get_avatar) if "username" in df.columns else None,
                "Username": df["username"] if "username" in df.columns else None,
                "Role": df["role"] if "role" in df.columns else None,
                "Status": df["role"].apply(_status_for_role) if "role" in df.columns else None,
            }
        )

        st.markdown("### Users")
        st.dataframe(display, use_container_width=True, hide_index=True)
    finally:
        _glass_container_end()


