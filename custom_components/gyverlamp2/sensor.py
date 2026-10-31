from homeassistant.components.sensor import SensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .entity import GyverEntity
from .protocol import FIRMWARE_SLOT_OFFSET
from .runtime import GyverConfigEntry


async def async_setup_entry(
    hass: HomeAssistant, entry: GyverConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    async_add_entities([GyverPresetSensor(entry)])


class GyverPresetSensor(GyverEntity, SensorEntity):
    _attr_translation_key = "current_preset"
    _attr_icon = "mdi:palette"

    def __init__(self, entry: GyverConfigEntry) -> None:
        super().__init__(entry, "current_preset")

    @property
    def available(self) -> bool:
        return self.lamp.online and self.lamp.bus.connected

    @property
    def native_value(self) -> int | None:
        return None if self.lamp.preset is None else self.lamp.preset + FIRMWARE_SLOT_OFFSET
