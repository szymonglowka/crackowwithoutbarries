"""Single source of truth for accessibility parameters, reliability statuses and
profile presets. The frontend reads all of this from /api/meta/ - never hardcode
labels or rules on the client.

To add a parameter: add an entry to PARAMETERS (and a rule in matching.py if it
should be compared against the user's profile). No migration needed - facts store
the parameter key as a string.
"""

GROUPS = [
    {"key": "entrance", "label": "Dojście i wejście"},
    {"key": "interior", "label": "Wnętrze"},
    {"key": "toilet", "label": "Toaleta"},
    {"key": "amenities", "label": "Odpoczynek i udogodnienia"},
]

# type: "int" | "number" | "bool" | "enum"
PARAMETERS = [
    {"key": "entrance_steps", "group": "entrance", "label": "Stopnie przy wejściu głównym", "type": "int", "unit": "szt."},
    {"key": "step_free_entrance", "group": "entrance", "label": "Wejście bez stopni (główne lub alternatywne)", "type": "bool"},
    {"key": "ramp", "group": "entrance", "label": "Podjazd", "type": "bool"},
    {"key": "threshold_cm", "group": "entrance", "label": "Wysokość progu", "type": "number", "unit": "cm"},
    {"key": "door_width_cm", "group": "entrance", "label": "Szerokość drzwi", "type": "number", "unit": "cm"},
    {"key": "automatic_door", "group": "entrance", "label": "Drzwi automatyczne", "type": "bool"},
    {
        "key": "approach_surface", "group": "entrance", "label": "Nawierzchnia dojścia", "type": "enum",
        "choices": {
            "asphalt": "asfalt", "paving_stones": "płyty chodnikowe", "concrete": "beton",
            "sett": "kostka brukowa", "cobblestone": "bruk (kocie łby)", "gravel": "żwir",
        },
    },
    {"key": "elevator", "group": "interior", "label": "Winda", "type": "bool"},
    {"key": "multiple_levels", "group": "interior", "label": "Kilka poziomów", "type": "bool"},
    {"key": "corridor_width_cm", "group": "interior", "label": "Szerokość przejść", "type": "number", "unit": "cm"},
    {"key": "accessible_toilet", "group": "toilet", "label": "Toaleta dostosowana", "type": "bool"},
    {"key": "changing_table", "group": "toilet", "label": "Przewijak", "type": "bool"},
    {"key": "seating", "group": "amenities", "label": "Miejsca do odpoczynku", "type": "bool"},
    {"key": "stroller_parking", "group": "amenities", "label": "Miejsce na wózek dziecięcy", "type": "bool"},
]
PARAMETERS_BY_KEY = {p["key"]: p for p in PARAMETERS}

CATEGORIES = {
    "museum": "Muzea",
    "food": "Gastronomia",
    "lodging": "Noclegi",
    "toilet": "Toalety",
    "office": "Urzędy",
    "culture": "Kultura",
    "transport": "Transport",
    "other": "Inne",
}

# Displayed reliability statuses. Stored facts only ever carry the first three;
# conflicting / outdated / missing are computed when a place is evaluated.
RELIABILITY = [
    {"key": "confirmed", "label": "Potwierdzone", "description": "Potwierdzone przez właściciela obiektu lub weryfikację na miejscu."},
    {"key": "open_data", "label": "Z otwartych danych", "description": "Pochodzi z OpenStreetMap lub otwartych danych miejskich. Nie zostało potwierdzone na miejscu."},
    {"key": "user_report", "label": "Zgłoszenie użytkownika", "description": "Zgłoszone przez użytkownika, jeszcze niezweryfikowane."},
    {"key": "conflicting", "label": "Sprzeczne", "description": "Źródła podają różne wartości. Pokazujemy wszystkie."},
    {"key": "outdated", "label": "Może być nieaktualne", "description": "Ostatnie potwierdzenie jest starsze niż 2 lata."},
    {"key": "missing", "label": "Brak danych", "description": "Nie mamy tej informacji. Brak danych nie oznacza, że miejsce jest dostępne."},
]
STORED_RELIABILITY = ("confirmed", "open_data", "user_report")
RELIABILITY_RANK = {"confirmed": 3, "open_data": 2, "user_report": 1}
OUTDATED_AFTER_DAYS = 730

# Match statuses of a single parameter against the user's profile.
MATCH = [
    {"key": "match", "label": "Pasuje"},
    {"key": "barrier", "label": "Bariera"},
    {"key": "unknown", "label": "Brak danych"},
    {"key": "info", "label": "Informacja"},  # profile doesn't constrain this parameter
]

# Profile fields - passed by the client as query params (profile is stored only
# on the user's device; we never ask about disability).
PROFILE_FIELDS = [
    {"key": "max_steps", "label": "Maksymalna liczba stopni", "type": "int", "unit": "szt."},
    {"key": "max_threshold_cm", "label": "Maksymalna wysokość progu", "type": "number", "unit": "cm"},
    {"key": "min_door_width_cm", "label": "Minimalna szerokość drzwi", "type": "number", "unit": "cm"},
    {"key": "max_incline_pct", "label": "Maksymalne nachylenie", "type": "number", "unit": "%"},
    {"key": "needs_elevator", "label": "Potrzebuję windy", "type": "bool"},
    {"key": "needs_accessible_toilet", "label": "Potrzebuję dostosowanej toalety", "type": "bool"},
    {"key": "needs_changing_table", "label": "Potrzebuję przewijaka", "type": "bool"},
    {"key": "needs_seating", "label": "Potrzebuję miejsc do odpoczynku", "type": "bool"},
    {"key": "avoid_cobblestone", "label": "Unikam kostki brukowej", "type": "bool"},
]

PROFILE_PRESETS = {
    "wheelchair": {
        "label": "Wózek inwalidzki",
        "values": {
            "max_steps": 0, "max_threshold_cm": 2, "min_door_width_cm": 80, "max_incline_pct": 6,
            "needs_elevator": True, "needs_accessible_toilet": True, "needs_changing_table": False,
            "needs_seating": False, "avoid_cobblestone": True,
        },
    },
    "stroller": {
        "label": "Wózek dziecięcy",
        "values": {
            "max_steps": 0, "max_threshold_cm": 5, "min_door_width_cm": 70, "max_incline_pct": 8,
            "needs_elevator": True, "needs_accessible_toilet": False, "needs_changing_table": True,
            "needs_seating": False, "avoid_cobblestone": False,
        },
    },
}
