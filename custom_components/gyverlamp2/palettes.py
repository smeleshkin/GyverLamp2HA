from .protocol import BUILTIN_PALETTE_FIRST_ID

PALETTES = (
    ("heat", "Heat"),
    ("fire", "Fire"),
    ("wood_fire", "Wood Fire"),
    ("normal_fire", "Normal Fire"),
    ("lithium_fire", "Lithium Fire"),
    ("sodium_fire", "Sodium Fire"),
    ("copper_fire", "Copper Fire"),
    ("alcohol_fire", "Alcohol Fire"),
    ("lava", "Lava"),
    ("party", "Party"),
    ("rainbow", "Rainbow"),
    ("rainbow_stripe", "Rainbow Stripe"),
    ("cloud", "Cloud"),
    ("ocean", "Ocean"),
    ("forest", "Forest"),
    ("sunset", "Sunset"),
    ("blue_red", "Blue Red"),
    ("optimus_prime", "Optimus Prime"),
    ("warm", "Warm"),
    ("cold", "Cold"),
    ("hot", "Hot"),
    ("pink", "Pink"),
    ("comfy", "Comfy"),
    ("cyberpunk", "Cyberpunk"),
    ("girl", "Girl"),
    ("christmas", "Christmas"),
    ("acid", "Acid"),
    ("blue_smoke", "Blue Smoke"),
    ("gummy", "Gummy"),
    ("leo", "Leo"),
    ("aurora", "Aurora"),
)
PALETTE_NAMES = tuple(name for _, name in PALETTES)


def palette_id(value: str | int) -> int:
    if type(value) is int and BUILTIN_PALETTE_FIRST_ID <= value < BUILTIN_PALETTE_FIRST_ID + len(
        PALETTES
    ):
        return value
    for index, (key, name) in enumerate(PALETTES, BUILTIN_PALETTE_FIRST_ID):
        if value == key or value == name:
            return index
    raise ValueError("Choose a built-in palette (2–32), by key or displayed name")


def palette_name(value: int) -> str:
    return PALETTE_NAMES[palette_id(value) - BUILTIN_PALETTE_FIRST_ID]
