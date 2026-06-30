from sqlalchemy import text


def coalesce_none(v):
    return v if v is not None else None

