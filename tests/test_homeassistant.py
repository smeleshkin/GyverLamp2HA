from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.const import Platform
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import HomeAssistantError
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.gyverlamp2.const import DOMAIN

DATA = {
    "host": "192.0.2.107",
    "group": 1,
    "network_key": "GL",
    "slave_mode": False,
    "require_heartbeat": False,
}


def entry_for(hass, **overrides):
    entry = MockConfigEntry(
        domain=DOMAIN, version=2, unique_id=DATA["host"], title="GyverLamp2", data=DATA | overrides
    )
    entry.add_to_hass(hass)
    return entry


async def setup(hass):
    entry = entry_for(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry, hass.states.async_all(Platform.LIGHT)[0].entity_id


async def test_ui_flow_and_duplicate(hass, fake_udp):
    with patch("custom_components.gyverlamp2.async_setup_entry", return_value=True):
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
        assert result["type"] == FlowResultType.FORM
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], user_input={"name": "Лампа", **DATA, "group": "1"}
        )
        assert result["type"] == FlowResultType.CREATE_ENTRY and result["data"] == DATA
        duplicate = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": "user"}, data={"name": "Другая", **DATA, "group": "1"}
        )
        assert duplicate["type"] == FlowResultType.ABORT
        assert duplicate["reason"] == "already_configured"


async def test_flow_cannot_confirm_presence(hass, fake_udp):
    with patch(
        "custom_components.gyverlamp2.transport.Lamp.wait_seen", new=AsyncMock(return_value=False)
    ):
        result = await hass.config_entries.flow.async_init(
            DOMAIN,
            context={"source": "user"},
            data={"name": "Лампа", **DATA, "group": "1", "require_heartbeat": True},
        )
    assert result["errors"] == {"base": "no_heartbeat"}
    assert not hass.data[DOMAIN].buses


async def test_light_modes_color_services_and_unload(hass, fake_udp, monkeypatch):
    monkeypatch.setattr("custom_components.gyverlamp2.lamp.COMMAND_INTERVAL", 0)
    entry, light_id = await setup(hass)
    lamp = entry.runtime_data
    bus = lamp.bus
    assert hass.states.get(light_id).state == "unknown"
    await hass.services.async_call(
        "light",
        "turn_on",
        {"entity_id": light_id, "brightness": 128, "effect": "Цвет", "hs_color": [180, 60]},
        blocking=True,
    )
    light = hass.states.get(light_id)
    assert light.state == "on" and light.attributes["assumed_state"] is True
    assert light.attributes["brightness"] == 128 and light.attributes["mode_key"] == "color"
    assert light.attributes["hs_color"][0] == 180
    assert not light.attributes["presence_confirmed"]
    packets = [call.args[0] for call in bus.transport.sendto.call_args_list]
    assert packets[0].startswith(b"GL,0,1,") and packets[-1].startswith(b"GL,2,10,")
    assert b"GL,1," not in packets
    bus.datagram_received(b"GL_ONL1", (lamp.host, 61197))
    await hass.async_block_till_done()
    assert hass.states.get(light_id).attributes["slot_matches_request"]
    assert hass.states.async_all(Platform.SENSOR)[0].state == "2"
    await hass.services.async_call("light", "turn_off", {"entity_id": light_id}, blocking=True)
    assert hass.states.get(light_id).state == "off"
    await hass.config_entries.async_unload(entry.entry_id)
    bus.transport.close.assert_called_once()
    assert not hass.data[DOMAIN].buses


async def test_atomic_node_red_action_and_parameter_capabilities(hass, fake_udp, monkeypatch):
    monkeypatch.setattr("custom_components.gyverlamp2.lamp.COMMAND_INTERVAL", 0)
    entry, light_id = await setup(hass)
    await hass.services.async_call(
        DOMAIN,
        "set_mode",
        {
            "entity_id": light_id,
            "mode": "particles",
            "speed": 42,
            "scale": 100,
            "hue": 240,
            "brightness": 200,
            "turn_on": True,
        },
        blocking=True,
    )
    lamp = entry.runtime_data
    assert lamp.modes.bank.mode.key == "particles"
    assert lamp.modes.bank.current.speed == 42 and lamp.modes.bank.current.hue == 240
    assert hass.states.get(light_id).attributes["color_mode"] == "hs"
    numbers = {
        state.attributes["friendly_name"]: state for state in hass.states.async_all(Platform.NUMBER)
    }
    assert len(numbers) == 4
    switch = hass.states.async_all(Platform.SWITCH)[0]
    assert switch.state == "unavailable"  # Particles don't support from_center.
    previous = lamp.modes.bank.dump()
    count = lamp.bus.transport.sendto.call_count
    with pytest.raises(HomeAssistantError):
        await hass.services.async_call(
            DOMAIN,
            "set_mode",
            {"entity_id": light_id, "mode": "color", "speed": 20, "turn_on": True},
            blocking=True,
        )
    assert lamp.modes.bank.dump() == previous and lamp.bus.transport.sendto.call_count == count


async def test_number_select_restore_and_offline_editing(hass, fake_udp, monkeypatch):
    monkeypatch.setattr("custom_components.gyverlamp2.lamp.COMMAND_INTERVAL", 0)
    entry, light_id = await setup(hass)
    select = hass.states.async_all(Platform.SELECT)[0]
    await hass.services.async_call(
        "select",
        "select_option",
        {"entity_id": select.entity_id, "option": "Частицы"},
        blocking=True,
    )
    speed = next(
        s
        for s in hass.states.async_all(Platform.NUMBER)
        if s.attributes.get("max") == 255 and "speed" in s.entity_id
    )
    await hass.services.async_call(
        "number", "set_value", {"entity_id": speed.entity_id, "value": 77}, blocking=True
    )
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    lamp = entry.runtime_data
    assert lamp.modes.bank.mode.key == "particles" and lamp.modes.bank.current.speed == 77
    assert lamp.modes.pending
    assert lamp.bus.transport.sendto.call_count == 0  # Reload never overwrites the lamp.
    lamp.require_heartbeat = True
    await hass.services.async_call(
        "number", "set_value", {"entity_id": speed.entity_id, "value": 88}, blocking=True
    )
    assert lamp.modes.bank.current.speed == 88 and lamp.modes.pending
    assert lamp.bus.transport.sendto.call_count == 0


async def test_options_reload_settings(hass, fake_udp):
    entry, light_id = await setup(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], user_input=DATA | {"group": "2"}
    )
    assert result["type"] == FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert entry.runtime_data.bus.port == 61198 and 61197 not in hass.data[DOMAIN].buses


async def test_migrates_unpublished_names_to_ha_modes(hass, fake_udp):
    entry = MockConfigEntry(
        domain=DOMAIN,
        version=1,
        unique_id=DATA["host"],
        title="GyverLamp2",
        data=DATA | {"preset_names": "Old name"},
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.version == 2 and "preset_names" not in entry.data
    assert entry.runtime_data.modes.bank.mode.key == "color"


@pytest.mark.parametrize("mode", ["fire", "particles", "confetti", "clock"])
async def test_wheel_keeps_hue_effect_and_its_other_settings(hass, fake_udp, monkeypatch, mode):
    monkeypatch.setattr("custom_components.gyverlamp2.lamp.COMMAND_INTERVAL", 0)
    entry, light_id = await setup(hass)
    await hass.services.async_call(
        DOMAIN,
        "set_mode",
        {
            "entity_id": light_id,
            "mode": mode,
            "hue": 30,
            "speed": 80,
            "scale": 26,
            "brightness": 130,
            "turn_on": True,
        },
        blocking=True,
    )
    await hass.services.async_call(
        "light",
        "turn_on",
        {
            "entity_id": light_id,
            "hs_color": [210, 40],
        },
        blocking=True,
    )
    current = entry.runtime_data.modes.bank.current
    assert entry.runtime_data.modes.bank.mode.key == mode
    assert current.hue == 210 and current.scale == 26
    assert current.speed == 80 and current.brightness == 130
    state = hass.states.get(light_id)
    assert state.attributes["color_mode"] == "hs"
    assert state.attributes["hs_color"] == (210, 100)
    assert state.attributes["mode_parameters"]["saturation"] is False
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.runtime_data.modes.bank.mode.key == mode
    assert entry.runtime_data.modes.bank.current.hue == 210


async def test_rgb_wheel_keeps_fire_and_palette_modes_do_not_pretend_color(
    hass, fake_udp, monkeypatch
):
    monkeypatch.setattr("custom_components.gyverlamp2.lamp.COMMAND_INTERVAL", 0)
    entry, light_id = await setup(hass)
    await hass.services.async_call(
        DOMAIN,
        "set_mode",
        {
            "entity_id": light_id,
            "mode": "fire",
            "turn_on": True,
        },
        blocking=True,
    )
    await hass.services.async_call(
        "light",
        "turn_on",
        {
            "entity_id": light_id,
            "rgb_color": [0, 0, 255],
        },
        blocking=True,
    )
    assert entry.runtime_data.modes.bank.mode.key == "fire"
    assert round(entry.runtime_data.modes.bank.current.hue) == 240
    await hass.services.async_call(
        DOMAIN,
        "set_mode",
        {
            "entity_id": light_id,
            "mode": "perlin",
        },
        blocking=True,
    )
    assert hass.states.get(light_id).attributes["color_mode"] == "brightness"


async def test_upgrade_hides_raw_color_numbers_but_keeps_them_usable(hass, fake_udp):
    from homeassistant.helpers import entity_registry as er

    entry = entry_for(hass)
    registry = er.async_get(hass)
    hue = registry.async_get_or_create(
        "number", DOMAIN, f"{entry.entry_id}_hue", config_entry=entry, suggested_object_id="old_hue"
    )
    assert hue.hidden_by is None
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.minor_version == 2
    assert registry.async_get(hue.entity_id).hidden_by == er.RegistryEntryHider.INTEGRATION
    assert hass.states.get(hue.entity_id) is not None


async def test_palette_selection_capabilities_and_restore(hass, fake_udp, monkeypatch):
    monkeypatch.setattr("custom_components.gyverlamp2.lamp.COMMAND_INTERVAL", 0)
    entry, light_id = await setup(hass)
    await hass.services.async_call(
        DOMAIN,
        "set_mode",
        {
            "entity_id": light_id,
            "mode": "fire2020",
            "palette": "ocean",
            "turn_on": True,
        },
        blocking=True,
    )
    state = hass.states.get(light_id)
    assert state.attributes["supported_color_modes"] == ["brightness"]
    assert state.attributes["mode_key"] == "fire2020"
    palette = next(
        s for s in hass.states.async_all(Platform.SELECT) if s.entity_id.endswith("_palette")
    )
    assert palette.state == "Ocean"
    await hass.services.async_call(
        "select",
        "select_option",
        {
            "entity_id": palette.entity_id,
            "option": "Forest",
        },
        blocking=True,
    )
    assert entry.runtime_data.modes.bank.current.palette == 16
    assert entry.runtime_data.modes.bank.mode.key == "fire2020"
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.runtime_data.modes.bank.current.palette == 16
    assert hass.states.get(palette.entity_id).state == "Forest"


async def test_color_source_switch_updates_color_wheel_capability(hass, fake_udp, monkeypatch):
    monkeypatch.setattr("custom_components.gyverlamp2.lamp.COMMAND_INTERVAL", 0)
    entry, light_id = await setup(hass)
    await hass.services.async_call(
        DOMAIN,
        "set_mode",
        {
            "entity_id": light_id,
            "mode": "particles",
            "hue": 200,
            "turn_on": True,
        },
        blocking=True,
    )
    assert hass.states.get(light_id).attributes["supported_color_modes"] == ["hs"]
    palette = next(
        s for s in hass.states.async_all(Platform.SELECT) if s.entity_id.endswith("_palette")
    )
    await hass.services.async_call(
        "select",
        "select_option",
        {
            "entity_id": palette.entity_id,
            "option": "Aurora",
        },
        blocking=True,
    )
    assert hass.states.get(light_id).attributes["supported_color_modes"] == ["brightness"]
    assert entry.runtime_data.modes.bank.current.use_palette
    source = next(
        s for s in hass.states.async_all(Platform.SELECT) if s.entity_id.endswith("_color_source")
    )
    await hass.services.async_call(
        "select",
        "select_option",
        {
            "entity_id": source.entity_id,
            "option": "hue",
        },
        blocking=True,
    )
    assert hass.states.get(light_id).attributes["supported_color_modes"] == ["hs"]
    assert entry.runtime_data.modes.bank.current.hue == 200
    assert entry.runtime_data.modes.bank.mode.key == "particles"
