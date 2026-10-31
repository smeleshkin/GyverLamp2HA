from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .entity import GyverEntity
from .lamp import LampError
from .runtime import GyverConfigEntry


async def async_setup_entry(
    hass: HomeAssistant, entry: GyverConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    async_add_entities([GyverFromCenterSwitch(entry)])


class GyverFromCenterSwitch(GyverEntity, SwitchEntity):
    _attr_translation_key = "from_center"
    _attr_icon = "mdi:arrow-expand-horizontal"

    def __init__(self, entry: GyverConfigEntry) -> None:
        super().__init__(entry, "from_center")

    @property
    def available(self) -> bool:
        return self.mode_manager.bank.mode.center

    @property
    def is_on(self) -> bool:
        return self.mode_manager.bank.current.from_center

    async def _set(self, value: bool):
        try:
            await self.mode_manager.update(from_center=value)
        except (LampError, ValueError, OSError) as err:
            raise HomeAssistantError(str(err)) from err

    async def async_turn_on(self, **kwargs):
        await self._set(True)

    async def async_turn_off(self, **kwargs):
        await self._set(False)
