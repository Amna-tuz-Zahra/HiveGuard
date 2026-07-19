# HiveGuard Backend — Climate-Season Temperature Rules
# Enforces Rule 2: Climate-Season Locking (preventing impossible weather)
# Max realistic temperatures per US climate zone per quarter

# Climate zones mapped by state
# Zone 1: Northern (cold winters, mild summers)
# Zone 2: Central (moderate)
# Zone 3: Southern (mild winters, hot summers)
# Zone 4: Southwest/Desert (hot year-round)

STATE_CLIMATE_ZONES = {
    "Alabama": 3, "Alaska": 1, "Arizona": 4, "Arkansas": 3,
    "California": 4, "Colorado": 2, "Connecticut": 1, "Delaware": 2,
    "Florida": 3, "Georgia": 3, "Hawaii": 3, "Idaho": 1,
    "Illinois": 2, "Indiana": 2, "Iowa": 2, "Kansas": 2,
    "Kentucky": 2, "Louisiana": 3, "Maine": 1, "Maryland": 2,
    "Massachusetts": 1, "Michigan": 1, "Minnesota": 1, "Mississippi": 3,
    "Missouri": 2, "Montana": 1, "Nebraska": 2, "Nevada": 4,
    "New Hampshire": 1, "New Jersey": 2, "New Mexico": 4, "New York": 1,
    "North Carolina": 2, "North Dakota": 1, "Ohio": 2, "Oklahoma": 3,
    "Oregon": 2, "Pennsylvania": 2, "Rhode Island": 1, "South Carolina": 3,
    "South Dakota": 1, "Tennessee": 2, "Texas": 3, "Utah": 2,
    "Vermont": 1, "Virginia": 2, "Washington": 2, "West Virginia": 2,
    "Wisconsin": 1, "Wyoming": 1,
}

# Max temperature (°F) by climate zone per quarter
# Q1 = Jan-Mar, Q2 = Apr-Jun, Q3 = Jul-Sep, Q4 = Oct-Dec
ZONE_TEMP_CAPS = {
    1: {"Q1": 45, "Q2": 75, "Q3": 88, "Q4": 55},   # Northern
    2: {"Q1": 60, "Q2": 85, "Q3": 95, "Q4": 70},   # Central
    3: {"Q1": 75, "Q2": 95, "Q3": 105, "Q4": 80},  # Southern
    4: {"Q1": 80, "Q2": 105, "Q3": 115, "Q4": 85},  # Desert/SW
}

# Min temperature (°F) by climate zone per quarter
ZONE_TEMP_MINS = {
    1: {"Q1": -10, "Q2": 30, "Q3": 50, "Q4": 10},
    2: {"Q1": 10, "Q2": 40, "Q3": 60, "Q4": 25},
    3: {"Q1": 25, "Q2": 55, "Q3": 70, "Q4": 35},
    4: {"Q1": 30, "Q2": 60, "Q3": 75, "Q4": 40},
}


def get_temp_range(state_name: str, quarter: int) -> dict:
    """
    Returns the valid temperature range (°F) for a given US state and quarter.
    Enforces Rule 2: Climate-Season Locking.
    
    Returns:
        {"min_f": int, "max_f": int, "zone": int, "quarter_label": str}
    """
    zone = STATE_CLIMATE_ZONES.get(state_name)
    if zone is None:
        raise ValueError(f"Unknown state: {state_name}")
    
    if quarter not in [1, 2, 3, 4]:
        raise ValueError(f"Quarter must be 1-4, got: {quarter}")
    
    q_key = f"Q{quarter}"
    quarter_labels = {1: "Jan–Mar", 2: "Apr–Jun", 3: "Jul–Sep", 4: "Oct–Dec"}
    
    return {
        "min_f": ZONE_TEMP_MINS[zone][q_key],
        "max_f": ZONE_TEMP_CAPS[zone][q_key],
        "zone": zone,
        "quarter_label": quarter_labels[quarter],
    }


def validate_temperature(state_name: str, quarter: int, temp_f: float) -> dict:
    """
    Validates whether a temperature is realistic for the given state and quarter.
    
    Returns:
        {"valid": bool, "clamped_temp": float, "range": dict, "warning": str|None}
    """
    temp_range = get_temp_range(state_name, quarter)
    
    warning = None
    clamped = temp_f
    
    if temp_f > temp_range["max_f"]:
        clamped = temp_range["max_f"]
        warning = (
            f"Temperature {temp_f}°F exceeds realistic maximum of {temp_range['max_f']}°F "
            f"for {state_name} in {temp_range['quarter_label']}. "
            f"Clamped to {clamped}°F to protect AI prediction accuracy."
        )
    elif temp_f < temp_range["min_f"]:
        clamped = temp_range["min_f"]
        warning = (
            f"Temperature {temp_f}°F below realistic minimum of {temp_range['min_f']}°F "
            f"for {state_name} in {temp_range['quarter_label']}. "
            f"Clamped to {clamped}°F to protect AI prediction accuracy."
        )
    
    return {
        "valid": warning is None,
        "clamped_temp": clamped,
        "range": temp_range,
        "warning": warning,
    }
