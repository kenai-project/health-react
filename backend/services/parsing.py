from dateutil import parser as date_parser


def parse_date(value: str | None) -> str | None:
    if not value:
        return None
    value = str(value).strip()
    if not value:
        return None
    try:
        dt = date_parser.parse(value, dayfirst=True)
        return dt.date().isoformat()
    except Exception:
        return None

