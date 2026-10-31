from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import (
    BYTE_MAX,
    BYTE_MIN,
    DISPLAY_DECIMAL_PLACES,
    FULL_CIRCLE_DEGREES,
    PARAMETER_STEP,
    PERCENT_MAX,
)
from .entity import GyverEntity
from .lamp import LampError
from .runtime import GyverConfigEntry


async def async_setup_entry(
    hass: HomeAssistant, entry: GyverConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    async_add_entities(
        [GyverModeNumber(entry, key) for key in ("speed", "scale", "hue", "saturation")]
    )


class GyverModeNumber(GyverEntity, NumberEntity):
    _attr_native_min_value = BYTE_MIN
    _attr_native_step = PARAMETER_STEP
    _attr_mode = NumberMode.SLIDER

    def __init__(self, entry: GyverConfigEntry, key: str) -> None:
        super().__init__(entry, key)
        self.key = key

        self._attr_entity_registry_visible_default = key not in ("hue", "saturation")
        self._attr_translation_key = key
        self._attr_native_max_value = (
            FULL_CIRCLE_DEGREES
            if key == "hue"
            else PERCENT_MAX
            if key == "saturation"
            else BYTE_MAX
        )
        self._attr_native_unit_of_measurement = (
            "°" if key == "hue" else "%" if key == "saturation" else None
        )

    @property
    def available(self) -> bool:
        mode = self.mode_manager.bank.mode
        if self.key == "saturation":
            return mode.key == "color"
        if self.key == "scale":
            return mode.scale and mode.key != "color"
        if self.key == "hue":
            return self.mode_manager.bank.color_enabled
        return getattr(mode, self.key)

    @property
    def native_value(self) -> int | float:
        settings = self.mode_manager.bank.current
        if self.key == "saturation":
            return round(settings.scale * PERCENT_MAX / BYTE_MAX, DISPLAY_DECIMAL_PLACES)
        return getattr(settings, self.key)

    async def async_set_native_value(self, value: float) -> None:
        if not self.available:
            raise HomeAssistantError("Parameter is not supported by the selected mode")
        if self.key in ("speed", "scale"):
            if value != int(value):
                raise HomeAssistantError("Speed and scale require integer byte values")
            value = int(value)
        try:
            await self.mode_manager.update(**{self.key: value})
        except (LampError, ValueError, OSError) as err:
            raise HomeAssistantError(str(err)) from err
