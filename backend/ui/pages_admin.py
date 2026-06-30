import streamlit as st

from db.migrate import create_tables_if_needed
from services.admin import list_users, create_user, assign_staff_to_user
from ui.widgets import render_user_table


def page_admin():
    create_tables_if_needed()

    admin = st.session_state.user

    st.subheader("Admin - Users")

    col1, col2 = st.columns(2)
    with col1:
        st.write("### Create User")
        username = st.text_input("Username", key="admin_new_username")
        password = st.text_input("Password", type="password", key="admin_new_password")
        role = st.selectbox("Role", ["User", "Staff"], index=1, key="admin_new_role")
        if st.button("Create"):
            try:
                create_user(username=username, password=password, role=role)
                st.success("User created")
                st.rerun()
            except ValueError as e:
                st.error(str(e))

    users = list_users()

    st.write("### Assign Staff")
    staff_users = [u for u in users if u["role"] == "Staff"]
    normal_users = [u for u in users if u["role"] == "User"]

    staff_id = st.selectbox("Select Staff", [u["id"] for u in staff_users] if staff_users else [], index=0)
    target_user_id = st.selectbox(
        "Select User",
        [u["id"] for u in normal_users] if normal_users else [],
        index=0,
    )

    if st.button("Assign staff to user"):
        assign_staff_to_user(staff_id=staff_id, user_id=target_user_id)
        st.success("Assigned")
        st.rerun()

    st.markdown("---")
    render_user_table(users)

