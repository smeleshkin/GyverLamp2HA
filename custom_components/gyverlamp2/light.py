from typing import Any

import voluptuous as vol
from homeassistant.components.light import (
    ATTR_BRIGHTNESS,
    ATTR_EFFECT,
    ATTR_HS_COLOR,
    ColorMode,
    LightEntity,
    LightEntityFeature,
)
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_platform
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import (
    BRIGHTNESS_MIN,
    BRIGHTNESS_OFF,
    BYTE_MAX,
    BYTE_MIN,
    FULL_CIRCLE_DEGREES,
    PERCENT_MAX,
)
from .entity import GyverEntity
from .frontend import control_bindings
from .lamp import LampError
from .modes import MODE_NAMES, ModeBank
from .protocol import BUILTIN_PALETTE_FIRST_ID, BUILTIN_PALETTE_LAST_ID, FIRMWARE_SLOT_OFFSET
from .runtime import GyverConfigEntry

MODE_SERVICE_SCHEMA = {
    vol.Optional("mode"): str,
    vol.Optional("turn_on", default=False): cv.boolean,
    vol.Optional("brightness"): vol.All(
        vol.Coerce(int), vol.Range(min=BRIGHTNESS_MIN, max=BYTE_MAX)
    ),
    vol.Optional("speed"): vol.All(vol.Coerce(int), vol.Range(min=BYTE_MIN, max=BYTE_MAX)),
    vol.Optional("scale"): vol.All(vol.Coerce(int), vol.Range(min=BYTE_MIN, max=BYTE_MAX)),
    vol.Optional("hue"): vol.All(vol.Coerce(float), vol.Range(min=0, max=FULL_CIRCLE_DEGREES)),
    vol.Optional("saturation"): vol.All(vol.Coerce(float), vol.Range(min=0, max=PERCENT_MAX)),
    vol.Optional("from_center"): cv.boolean,
    vol.Optional("palette"): vol.Any(
        str, vol.All(int, vol.Range(min=BUILTIN_PALETTE_FIRST_ID, max=BUILTIN_PALETTE_LAST_ID))
    ),
    vol.Optional("color_source"): vol.In(("hue", "palette")),
}


async def async_setup_entry(
    hass: HomeAssistant, entry: GyverConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    async_add_entities([GyverLight(entry)])
    entity_platform.async_get_current_platform().async_register_entity_service(
        "set_mode", MODE_SERVICE_SCHEMA, "async_set_mode"
    )


class GyverLight(GyverEntity, LightEntity):
    _attr_name = None
    _attr_assumed_state = True
    _attr_supported_features = LightEntityFeature.EFFECT
    _attr_effect_list = list(MODE_NAMES)

    def __init__(self, entry: GyverConfigEntry) -> None:
        super().__init__(entry, "light")
        self._entry_id = entry.entry_id

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()

        @callback
        def registry_updated(event: Event) -> None:
            self.async_write_ha_state()

        self.async_on_remove(
            self.hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, registry_updated)
        )

    @property
    def bank(self) -> ModeBank:
        return self.mode_manager.bank

    @property
    def color_mode(self) -> ColorMode:
        return ColorMode.HS if self.bank.color_enabled else ColorMode.BRIGHTNESS

    @property
    def supported_color_modes(self) -> set[ColorMode]:
        return {self.color_mode}

    @property
    def is_on(self) -> bool | None:
        return self.lamp.power

    @property
    def brightness(self) -> int:
        return self.bank.current.brightness

    @property
    def hs_color(self) -> tuple[float, float] | None:
        if self.bank.color_enabled:
            saturation = (
                self.bank.current.scale * PERCENT_MAX / BYTE_MAX
                if self.bank.mode.key == "color"
                else PERCENT_MAX
            )
            return self.bank.current.hue, saturation
        return None

    @property
    def effect(self) -> str:
        return self.bank.mode.name

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        observed = self.lamp.preset
        return {
            "gyverlamp2_ui": control_bindings(self.hass, self._entry_id),
            "presence_confirmed": self.lamp.online,
            "power_feedback": "assumed",
            "settings_feedback": "assumed",
            "mode_key": self.bank.mode.key,
            "mode_parameters": {
                "speed": self.bank.mode.speed,
                "scale": self.bank.mode.scale,
                "hue": self.bank.color_enabled,
                "palette": self.bank.mode.has_palette,
                "saturation": self.bank.mode.key == "color",
                "from_center": self.bank.mode.center,
            },
            "settings_pending": self.mode_manager.pending,
            "observed_slot": None if observed is None else observed + FIRMWARE_SLOT_OFFSET,
            "requested_slot": self.bank.active + FIRMWARE_SLOT_OFFSET,
            "slot_matches_request": self.lamp.online and observed == self.bank.active,
        }

    async def async_set_mode(self, **kwargs: Any) -> None:
        try:
            await self.mode_manager.update(**kwargs)
        except (LampError, ValueError, OSError) as err:
            raise HomeAssistantError(str(err)) from err

    async def async_turn_on(self, **kwargs: Any) -> None:
        if kwargs.get(ATTR_BRIGHTNESS) == BRIGHTNESS_OFF:
            await self.async_turn_off()
            return
        changes = {}
        effect = kwargs.get(ATTR_EFFECT)
        if (brightness := kwargs.get(ATTR_BRIGHTNESS)) is not None:
            changes["brightness"] = brightness
        await self.async_set_mode(
            mode=effect, turn_on=True, hs_color=kwargs.get(ATTR_HS_COLOR), **changes
        )

    async def async_turn_off(self, **kwargs: Any) -> None:
        try:
            await self.lamp.set_light(on=False, now=dt_util.now())
        except LampError as err:
            raise HomeAssistantError(str(err)) from err
