from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST, EVENT_HOMEASSISTANT_STOP
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers.storage import Store

from .const import (
    CONF_GROUP,
    CONF_KEY,
    CONF_REQUIRE_HEARTBEAT,
    CONF_SLAVE,
    DOMAIN,
    MODE_STORAGE_VERSION,
)
from .lamp import Lamp, LampError
from .mode_manager import ModeManager
from .protocol import udp_port
from .transport import Manager

type GyverConfigEntry = ConfigEntry[Lamp]


@callback
def get_manager(hass: HomeAssistant) -> Manager:
    if DOMAIN not in hass.data:
        manager = hass.data[DOMAIN] = Manager()
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, lambda _: manager.close())
    return hass.data[DOMAIN]


def mode_store(hass: HomeAssistant, entry: GyverConfigEntry) -> Store:
    return Store(hass, MODE_STORAGE_VERSION, f"{DOMAIN}.{entry.entry_id}.modes")


async def connect_lamp(hass: HomeAssistant, entry: GyverConfigEntry) -> Lamp:
    settings = entry.data | entry.options
    manager = get_manager(hass)
    try:
        lamp = await manager.acquire(
            settings[CONF_HOST],
            udp_port(settings[CONF_GROUP], settings[CONF_KEY]),
            slave=settings[CONF_SLAVE],
            require_heartbeat=settings[CONF_REQUIRE_HEARTBEAT],
        )
    except (OSError, LampError) as error:
        raise ConfigEntryNotReady(f"Cannot open GyverLamp2 UDP listener: {error}") from error
    try:
        lamp.modes = ModeManager(lamp, mode_store(hass, entry))
        await lamp.modes.load()
    except BaseException:
        await manager.release(lamp)
        raise
    entry.runtime_data = lamp
    return lamp
