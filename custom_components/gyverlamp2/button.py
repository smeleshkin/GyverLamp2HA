from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import NEXT_MODE, PREVIOUS_MODE
from .entity import GyverEntity
from .lamp import LampError
from .runtime import GyverConfigEntry


async def async_setup_entry(
    hass: HomeAssistant, entry: GyverConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    async_add_entities(
        [GyverPresetButton(entry, PREVIOUS_MODE), GyverPresetButton(entry, NEXT_MODE)]
    )


class GyverPresetButton(GyverEntity, ButtonEntity):
    def __init__(self, entry: GyverConfigEntry, direction: int) -> None:
        key = "next_preset" if direction == NEXT_MODE else "previous_preset"
        super().__init__(entry, key)
        self._attr_translation_key = key
        self._attr_icon = "mdi:skip-next" if direction == NEXT_MODE else "mdi:skip-previous"
        self._direction = direction

    async def async_press(self) -> None:
        try:
            await self.mode_manager.step(self._direction)
        except (LampError, ValueError, OSError) as err:
            raise HomeAssistantError(str(err)) from err
