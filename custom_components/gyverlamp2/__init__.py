from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .frontend import async_setup_frontend
from .migrations import async_migrate_entry as async_migrate_entry
from .runtime import GyverConfigEntry, connect_lamp, get_manager, mode_store

PLATFORMS = [
    Platform.LIGHT,
    Platform.BUTTON,
    Platform.SENSOR,
    Platform.SELECT,
    Platform.NUMBER,
    Platform.SWITCH,
]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    await async_setup_frontend(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: GyverConfigEntry) -> bool:
    lamp = await connect_lamp(hass, entry)
    try:
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
        lamp.notify()
    except BaseException:
        await get_manager(hass).release(lamp)
        raise
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_options_updated(hass: HomeAssistant, entry: GyverConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: GyverConfigEntry) -> bool:
    if not await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        return False
    await get_manager(hass).release(entry.runtime_data)
    return True


async def async_remove_entry(hass: HomeAssistant, entry: GyverConfigEntry) -> None:
    await mode_store(hass, entry).async_remove()
