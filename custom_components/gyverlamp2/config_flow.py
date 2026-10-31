from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_HOST, CONF_NAME
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    CONF_GROUP,
    CONF_KEY,
    CONF_REQUIRE_HEARTBEAT,
    CONF_SLAVE,
    CONFIG_ENTRY_MINOR_VERSION,
    CONFIG_ENTRY_VERSION,
    DEFAULT_GROUP,
    DEFAULT_NETWORK_KEY,
    DOMAIN,
    MAX_GROUP,
    MIN_GROUP,
)
from .lamp import LampError
from .protocol import udp_port, validate_host
from .runtime import get_manager


def connection_schema(defaults: dict[str, Any], *, name: bool = False) -> vol.Schema:
    fields = {}
    if name:
        fields[vol.Required(CONF_NAME, default=defaults.get(CONF_NAME, "GyverLamp2"))] = str
    fields.update(
        {
            vol.Required(CONF_HOST, default=defaults.get(CONF_HOST, "")): str,
            vol.Required(
                CONF_GROUP, default=str(defaults.get(CONF_GROUP, DEFAULT_GROUP))
            ): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=[str(group) for group in range(MIN_GROUP, MAX_GROUP + 1)],
                    mode=selector.SelectSelectorMode.DROPDOWN,
                )
            ),
            vol.Required(CONF_KEY, default=defaults.get(CONF_KEY, DEFAULT_NETWORK_KEY)): str,
            vol.Required(CONF_SLAVE, default=defaults.get(CONF_SLAVE, False)): bool,
            vol.Required(
                CONF_REQUIRE_HEARTBEAT, default=defaults.get(CONF_REQUIRE_HEARTBEAT, True)
            ): bool,
        }
    )
    return vol.Schema(fields)


def validate_connection_settings(data: dict[str, Any]) -> dict[str, Any]:
    data = dict(data)
    data[CONF_HOST] = validate_host(data[CONF_HOST])
    data[CONF_GROUP] = int(data[CONF_GROUP])
    udp_port(data[CONF_GROUP], data[CONF_KEY])
    return data


class GyverLamp2ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = CONFIG_ENTRY_VERSION
    MINOR_VERSION = CONFIG_ENTRY_MINOR_VERSION

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        errors = {}
        if user_input is not None:
            try:
                data = validate_connection_settings(user_input)
                await self.async_set_unique_id(data[CONF_HOST])
                self._abort_if_unique_id_configured()
                if any(
                    (entry.data | entry.options)[CONF_HOST] == data[CONF_HOST]
                    for entry in self._async_current_entries()
                ):
                    return self.async_abort(reason="already_configured")
                if data[CONF_REQUIRE_HEARTBEAT]:
                    manager = get_manager(self.hass)
                    lamp = await manager.acquire(
                        data[CONF_HOST], udp_port(data[CONF_GROUP], data[CONF_KEY])
                    )
                    try:
                        seen = await lamp.wait_seen()
                    finally:
                        await manager.release(lamp)
                    if not seen:
                        errors["base"] = "no_heartbeat"
                if not errors:
                    title = data.pop(CONF_NAME).strip() or "GyverLamp2"
                    return self.async_create_entry(title=title, data=data)
            except ValueError:
                errors["base"] = "invalid_settings"
            except OSError, LampError:
                errors["base"] = "cannot_listen"
        return self.async_show_form(
            step_id="user",
            data_schema=connection_schema(user_input or {}, name=True),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: config_entries.ConfigEntry):
        return GyverLamp2OptionsFlow()


class GyverLamp2OptionsFlow(config_entries.OptionsFlow):
    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        errors = {}
        if user_input is not None:
            try:
                data = validate_connection_settings(user_input)
                if any(
                    entry.entry_id != self.config_entry.entry_id
                    and (entry.data | entry.options)[CONF_HOST] == data[CONF_HOST]
                    for entry in self.hass.config_entries.async_entries(DOMAIN)
                ):
                    errors["base"] = "already_configured"
                else:
                    self.hass.config_entries.async_update_entry(
                        self.config_entry, unique_id=data[CONF_HOST]
                    )
                    return self.async_create_entry(title="", data=data)
            except ValueError:
                errors["base"] = "invalid_settings"
        defaults = user_input or (self.config_entry.data | self.config_entry.options)
        return self.async_show_form(
            step_id="init", data_schema=connection_schema(defaults), errors=errors
        )
