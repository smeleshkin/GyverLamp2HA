from homeassistant.components.select import SelectEntity
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .entity import GyverEntity
from .lamp import LampError
from .modes import MODE_NAMES
from .palettes import PALETTE_NAMES, palette_name
from .runtime import GyverConfigEntry


async def async_setup_entry(
    hass: HomeAssistant, entry: GyverConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    async_add_entities(
        [GyverModeSelect(entry), GyverPaletteSelect(entry), GyverColorSourceSelect(entry)]
    )


class GyverModeSelect(GyverEntity, SelectEntity):
    _attr_translation_key = "mode"
    _attr_options = list(MODE_NAMES)
    _attr_icon = "mdi:animation-play"

    def __init__(self, entry: GyverConfigEntry) -> None:
        super().__init__(entry, "mode")

    @property
    def available(self) -> bool:
        return True

    @property
    def current_option(self) -> str:
        return self.mode_manager.bank.mode.name

    async def async_select_option(self, option: str) -> None:
        try:
            await self.mode_manager.update(option)
        except (LampError, ValueError, OSError) as err:
            raise HomeAssistantError(str(err)) from err


class GyverPaletteSelect(GyverEntity, SelectEntity):
    _attr_translation_key = "palette"
    _attr_options = list(PALETTE_NAMES)
    _attr_icon = "mdi:palette"

    def __init__(self, entry: GyverConfigEntry) -> None:
        super().__init__(entry, "palette")

    @property
    def available(self) -> bool:
        return self.mode_manager.bank.mode.has_palette

    @property
    def current_option(self) -> str:
        return palette_name(self.mode_manager.bank.current.palette)

    async def async_select_option(self, option: str) -> None:
        try:
            await self.mode_manager.update(palette=option)
        except (LampError, ValueError, OSError) as err:
            raise HomeAssistantError(str(err)) from err


class GyverColorSourceSelect(GyverEntity, SelectEntity):
    _attr_translation_key = "color_source"
    _attr_options = ["hue", "palette"]
    _attr_icon = "mdi:palette-swatch"

    def __init__(self, entry: GyverConfigEntry) -> None:
        super().__init__(entry, "color_source")

    @property
    def available(self) -> bool:
        mode = self.mode_manager.bank.mode
        return mode.hue and mode.has_palette

    @property
    def current_option(self) -> str:
        return "palette" if self.mode_manager.bank.current.use_palette else "hue"

    async def async_select_option(self, option: str) -> None:
        try:
            await self.mode_manager.update(color_source=option)
        except (LampError, ValueError, OSError) as err:
            raise HomeAssistantError(str(err)) from err
