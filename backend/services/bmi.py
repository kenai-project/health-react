def calc_bmi(height_cm: float | None, weight_kg: float | None) -> float | None:
    if not height_cm or not weight_kg:
        return None
    h_m = height_cm / 100.0
    if h_m <= 0:
        return None
    return round(weight_kg / (h_m * h_m), 2)

