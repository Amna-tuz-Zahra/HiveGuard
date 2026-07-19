# HiveGuard Backend — US State Data & Encoding
# Historical colony loss rates used as state_encoded feature for TabPFN model
# Source: USDA NASS Honey Bee Colonies survey (US-based dataset)

US_STATES = {
    "Alabama": {"code": "AL", "state_encoded": 0.38},
    "Alaska": {"code": "AK", "state_encoded": 0.25},
    "Arizona": {"code": "AZ", "state_encoded": 0.42},
    "Arkansas": {"code": "AR", "state_encoded": 0.35},
    "California": {"code": "CA", "state_encoded": 0.48},
    "Colorado": {"code": "CO", "state_encoded": 0.40},
    "Connecticut": {"code": "CT", "state_encoded": 0.44},
    "Delaware": {"code": "DE", "state_encoded": 0.39},
    "Florida": {"code": "FL", "state_encoded": 0.46},
    "Georgia": {"code": "GA", "state_encoded": 0.41},
    "Hawaii": {"code": "HI", "state_encoded": 0.30},
    "Idaho": {"code": "ID", "state_encoded": 0.36},
    "Illinois": {"code": "IL", "state_encoded": 0.50},
    "Indiana": {"code": "IN", "state_encoded": 0.47},
    "Iowa": {"code": "IA", "state_encoded": 0.43},
    "Kansas": {"code": "KS", "state_encoded": 0.37},
    "Kentucky": {"code": "KY", "state_encoded": 0.42},
    "Louisiana": {"code": "LA", "state_encoded": 0.39},
    "Maine": {"code": "ME", "state_encoded": 0.52},
    "Maryland": {"code": "MD", "state_encoded": 0.46},
    "Massachusetts": {"code": "MA", "state_encoded": 0.49},
    "Michigan": {"code": "MI", "state_encoded": 0.45},
    "Minnesota": {"code": "MN", "state_encoded": 0.41},
    "Mississippi": {"code": "MS", "state_encoded": 0.36},
    "Missouri": {"code": "MO", "state_encoded": 0.43},
    "Montana": {"code": "MT", "state_encoded": 0.34},
    "Nebraska": {"code": "NE", "state_encoded": 0.38},
    "Nevada": {"code": "NV", "state_encoded": 0.40},
    "New Hampshire": {"code": "NH", "state_encoded": 0.51},
    "New Jersey": {"code": "NJ", "state_encoded": 0.47},
    "New Mexico": {"code": "NM", "state_encoded": 0.35},
    "New York": {"code": "NY", "state_encoded": 0.53},
    "North Carolina": {"code": "NC", "state_encoded": 0.44},
    "North Dakota": {"code": "ND", "state_encoded": 0.32},
    "Ohio": {"code": "OH", "state_encoded": 0.48},
    "Oklahoma": {"code": "OK", "state_encoded": 0.41},
    "Oregon": {"code": "OR", "state_encoded": 0.43},
    "Pennsylvania": {"code": "PA", "state_encoded": 0.50},
    "Rhode Island": {"code": "RI", "state_encoded": 0.45},
    "South Carolina": {"code": "SC", "state_encoded": 0.40},
    "South Dakota": {"code": "SD", "state_encoded": 0.33},
    "Tennessee": {"code": "TN", "state_encoded": 0.42},
    "Texas": {"code": "TX", "state_encoded": 0.44},
    "Utah": {"code": "UT", "state_encoded": 0.37},
    "Vermont": {"code": "VT", "state_encoded": 0.54},
    "Virginia": {"code": "VA", "state_encoded": 0.46},
    "Washington": {"code": "WA", "state_encoded": 0.42},
    "West Virginia": {"code": "WV", "state_encoded": 0.48},
    "Wisconsin": {"code": "WI", "state_encoded": 0.44},
    "Wyoming": {"code": "WY", "state_encoded": 0.35},
}


def get_state_names():
    """Returns sorted list of all US state names."""
    return sorted(US_STATES.keys())


def get_state_encoded(state_name: str) -> float:
    """Returns the historical loss rate encoding for a US state."""
    state = US_STATES.get(state_name)
    if state is None:
        raise ValueError(f"Unknown state: {state_name}. Must be a valid US state.")
    return state["state_encoded"]


def get_state_code(state_name: str) -> str:
    """Returns the 2-letter state abbreviation."""
    state = US_STATES.get(state_name)
    if state is None:
        raise ValueError(f"Unknown state: {state_name}")
    return state["code"]
