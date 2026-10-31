from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity import Entity

from .const import DOMAIN
from .mode_manager import ModeManager
from .runtime import GyverConfigEntry


class GyverEntity(Entity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, entry: GyverConfigEntry, suffix: str) -> None:
        self.lamp = entry.runtime_data
        self._attr_unique_id = f"{entry.entry_id}_{suffix}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            manufacturer="AlexGyver",
            model="GyverLamp2",
        )

    @property
    def mode_manager(self) -> ModeManager:
        assert self.lamp.modes is not None
        return self.lamp.modes

    @property
    def available(self) -> bool:
        return self.lamp.available

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(self.lamp.subscribe(self.async_write_ha_state))
