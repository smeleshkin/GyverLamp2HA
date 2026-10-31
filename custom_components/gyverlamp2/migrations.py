from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from .const import (
    CONFIG_ENTRY_MINOR_VERSION,
    CONFIG_ENTRY_VERSION,
    DOMAIN,
    LEGACY_CONFIG_ENTRY_VERSION,
)
from .runtime import GyverConfigEntry


async def async_migrate_entry(hass: HomeAssistant, entry: GyverConfigEntry) -> bool:
    if entry.version == LEGACY_CONFIG_ENTRY_VERSION:
        data, options = dict(entry.data), dict(entry.options)
        data.pop("preset_names", None)
        options.pop("preset_names", None)
        hass.config_entries.async_update_entry(
            entry, data=data, options=options, version=CONFIG_ENTRY_VERSION
        )

    if entry.version == CONFIG_ENTRY_VERSION and entry.minor_version < CONFIG_ENTRY_MINOR_VERSION:
        registry = er.async_get(hass)
        for key in ("hue", "saturation"):
            entity_id = registry.async_get_entity_id("number", DOMAIN, f"{entry.entry_id}_{key}")
            if entity_id and registry.async_get(entity_id).hidden_by is None:
                registry.async_update_entity(entity_id, hidden_by=er.RegistryEntryHider.INTEGRATION)
        hass.config_entries.async_update_entry(entry, minor_version=CONFIG_ENTRY_MINOR_VERSION)

    return entry.version == CONFIG_ENTRY_VERSION
