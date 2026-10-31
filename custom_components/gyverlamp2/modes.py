from dataclasses import asdict, dataclass, replace
from math import isfinite

from .const import (
    BRIGHTNESS_MIN,
    BYTE_MAX,
    BYTE_MIN,
    BYTE_VALUE_COUNT,
    FULL_CIRCLE_DEGREES,
    PERCENT_MAX,
)
from .palettes import palette_id
from .protocol import (
    ADVANCED_MODE_EFFECT_ONLY,
    DEFAULT_SOUND_REACTION,
    HEAT_PALETTE_ID,
    INDIVIDUAL_BRIGHTNESS_ENABLED,
    RAINBOW_PALETTE_ID,
    FirmwareEffect,
    ModeField,
)

DEFAULT_PARAMETER_VALUE = 128
DEFAULT_MODE_INDEX = 1


@dataclass(frozen=True)
class ModeSpec:
    key: str
    name: str
    effect: int
    speed: bool = True
    scale: bool = True
    hue: bool = False
    center: bool = False
    palette: int = RAINBOW_PALETTE_ID
    has_palette: bool = False


MODES = (
    ModeSpec("perlin", "Перлин", FirmwareEffect.PERLIN, has_palette=True),
    ModeSpec("color", "Цвет", FirmwareEffect.COLOR, speed=False, hue=True, center=True),
    ModeSpec(
        "cycle", "Смена цвета", FirmwareEffect.CYCLE, scale=False, center=True, has_palette=True
    ),
    ModeSpec("gradient", "Градиент", FirmwareEffect.GRADIENT, center=True, has_palette=True),
    ModeSpec("particles", "Частицы", FirmwareEffect.PARTICLES, hue=True, has_palette=True),
    ModeSpec("fire", "Огонь", FirmwareEffect.FIRE, hue=True, center=True, palette=HEAT_PALETTE_ID),
    ModeSpec(
        "fire2020",
        "Огонь 2020",
        FirmwareEffect.FIRE_2020,
        speed=False,
        center=True,
        palette=HEAT_PALETTE_ID,
        has_palette=True,
    ),
    ModeSpec("confetti", "Конфетти", FirmwareEffect.CONFETTI, hue=True, has_palette=True),
    ModeSpec("tornado", "Смерч", FirmwareEffect.TORNADO, has_palette=True),
    ModeSpec("clock", "Часы", FirmwareEffect.CLOCK, hue=True),
)
MODE_KEYS = tuple(mode.key for mode in MODES)
MODE_NAMES = tuple(mode.name for mode in MODES)


def mode_index(value: str) -> int:
    if value in MODE_KEYS:
        return MODE_KEYS.index(value)
    if value in MODE_NAMES:
        return MODE_NAMES.index(value)
    raise ValueError("Unknown mode; use the light effect_list or a documented mode key")


@dataclass(frozen=True)
class ModeSettings:
    brightness: int = BYTE_MAX
    speed: int = DEFAULT_PARAMETER_VALUE
    scale: int = DEFAULT_PARAMETER_VALUE
    hue: float = 0.0
    from_center: bool = False
    palette: int = RAINBOW_PALETTE_ID
    use_palette: bool = False

    def updated(self, mode: ModeSpec, changes: dict) -> ModeSettings:
        changes = dict(changes)

        if "color_source" in changes:
            source = changes.pop("color_source")
            if not (mode.hue and mode.has_palette) or source not in ("hue", "palette"):
                raise ValueError("Only Particles/Confetti offer hue or palette color sources")
            changes["use_palette"] = source == "palette"

        for key, value in changes.items():
            if key not in (
                "brightness",
                "speed",
                "scale",
                "hue",
                "from_center",
                "saturation",
                "palette",
                "use_palette",
            ):
                raise ValueError(f"Unknown setting: {key}")
            if key == "palette":
                if not mode.has_palette:
                    raise ValueError("This mode does not use palettes")
                palette_id(value)
            elif key == "use_palette":
                if not (mode.hue and mode.has_palette) or type(value) is not bool:
                    raise ValueError("This mode does not offer a color-source switch")
            elif key == "from_center":
                if not mode.center or type(value) is not bool:
                    raise ValueError("This mode does not support from_center")
            elif key == "hue":
                if (
                    not mode.hue
                    or type(value) not in (int, float)
                    or not isfinite(value)
                    or not 0 <= value <= FULL_CIRCLE_DEGREES
                ):
                    raise ValueError(f"This mode needs a hue between 0 and {FULL_CIRCLE_DEGREES}")
            elif key == "saturation":
                if (
                    mode.key != "color"
                    or type(value) not in (int, float)
                    or not isfinite(value)
                    or not 0 <= value <= PERCENT_MAX
                ):
                    raise ValueError(
                        f"Saturation is supported only by Color mode (0–{PERCENT_MAX})"
                    )
            else:
                if key == "speed" and not mode.speed or key == "scale" and not mode.scale:
                    raise ValueError(f"This mode does not support {key}")
                if (
                    type(value) is not int
                    or not (BRIGHTNESS_MIN if key == "brightness" else BYTE_MIN)
                    <= value
                    <= BYTE_MAX
                ):
                    raise ValueError(f"{key} must be an integer in its 0/1–255 range")

        values = dict(changes)

        if "palette" in values:
            values["palette"] = palette_id(values["palette"])
            if mode.hue and mode.has_palette:
                if values.get("use_palette") is False or "hue" in values:
                    raise ValueError("Choose either a palette or an individual hue")
                values["use_palette"] = True

        if "hue" in values and mode.hue and mode.has_palette:
            if values.get("use_palette"):
                raise ValueError("A palette color source cannot use an individual hue")
            values["use_palette"] = False

        if "saturation" in values:
            if "scale" in values:
                raise ValueError("Use either scale or saturation, not both")
            values["scale"] = round(values.pop("saturation") * BYTE_MAX / PERCENT_MAX)

        return replace(self, **values)

    def wire(self, mode: ModeSpec) -> tuple[int, ...]:
        hue_byte = (
            round((self.hue % FULL_CIRCLE_DEGREES) * BYTE_VALUE_COUNT / FULL_CIRCLE_DEGREES)
            % BYTE_VALUE_COUNT
        )
        fields = {
            ModeField.EFFECT: int(mode.effect),
            ModeField.INDIVIDUAL_BRIGHTNESS: INDIVIDUAL_BRIGHTNESS_ENABLED,
            ModeField.BRIGHTNESS: self.brightness,
            ModeField.ADVANCED_MODE: ADVANCED_MODE_EFFECT_ONLY,
            ModeField.SOUND_REACTION: DEFAULT_SOUND_REACTION,
            ModeField.REACTION_MINIMUM: BYTE_MIN,
            ModeField.REACTION_MAXIMUM: BYTE_MAX,
            ModeField.SPEED: self.speed,
            ModeField.PALETTE: self.palette,
            ModeField.SCALE: self.scale,
            ModeField.FROM_CENTER: int(self.from_center),
            ModeField.HUE: hue_byte,
            ModeField.USE_PALETTE: int(self.use_palette),
        }

        return tuple(fields[field] for field in ModeField)


class ModeBank:
    def __init__(
        self, active: int = DEFAULT_MODE_INDEX, settings: tuple[ModeSettings, ...] | None = None
    ):
        self.active = active
        self.settings = settings or tuple(ModeSettings(palette=mode.palette) for mode in MODES)

    @property
    def mode(self) -> ModeSpec:
        return MODES[self.active]

    @property
    def current(self) -> ModeSettings:
        return self.settings[self.active]

    @property
    def color_enabled(self) -> bool:
        return self.mode.hue and not (self.mode.has_palette and self.current.use_palette)

    def updated(self, mode: str | None = None, **changes) -> ModeBank:
        index = self.active if mode is None else mode_index(mode)
        settings = list(self.settings)
        settings[index] = settings[index].updated(MODES[index], changes)
        return ModeBank(index, tuple(settings))

    def records(self) -> tuple[tuple[int, ...], ...]:
        return tuple(
            settings.wire(mode) for mode, settings in zip(MODES, self.settings, strict=True)
        )

    def dump(self) -> dict:
        return {
            "active": self.mode.key,
            "modes": {
                mode.key: asdict(settings)
                for mode, settings in zip(MODES, self.settings, strict=True)
            },
        }

    @classmethod
    def load(cls, data: dict | None) -> ModeBank:
        if data is None:
            return cls()
        if not isinstance(data, dict) or set(data.get("modes", {})) != set(MODE_KEYS):
            raise ValueError("Invalid stored mode bank; refusing to silently overwrite it")
        defaults = cls()
        settings = []
        for mode in MODES:
            raw = data["modes"][mode.key]
            all_fields = set(asdict(ModeSettings()))
            old_fields = all_fields - {"palette", "use_palette"}
            if not isinstance(raw, dict) or set(raw) not in (all_fields, old_fields):
                raise ValueError("Invalid stored mode settings")
            raw = {"palette": mode.palette, "use_palette": False, **raw}
            if type(raw["palette"]) is not int:
                raise ValueError("Stored palette must be its numeric firmware ID")

            generic = ModeSpec(
                "validation", "", mode.effect, hue=True, center=True, has_palette=True
            )
            for key, value in raw.items():
                ModeSettings().updated(generic, {key: value})
            if raw["use_palette"] and not (mode.hue and mode.has_palette):
                raise ValueError("Unexpected palette color source in stored mode")
            validated = ModeSettings(**raw)
            settings.append(validated)
        defaults.active = mode_index(data["active"])
        defaults.settings = tuple(settings)
        return defaults
