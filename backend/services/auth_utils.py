def ensure_valid_role(role: str):
    if role not in {"Admin", "Staff", "User"}:
        raise ValueError("Invalid role")

