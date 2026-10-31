"""Bundled UI loading, cache invalidation and actual registry bindings."""

from pathlib import Path
from unittest.mock import patch

from homeassistant.components.frontend import DATA_EXTRA_MODULE_URL
from homeassistant.helpers import entity_registry as er
from test_homeassistant import entry_for, setup

from custom_components.gyverlamp2.frontend import (
    DATA_FRONTEND,
    _asset_version,
    async_setup_frontend,
)


async def test_bundled_assets_are_served_and_registered_once(hass, fake_udp, hass_client):
    entry, light_id = await setup(hass)
    url = hass.data[DATA_FRONTEND]
    assert url.startswith("/gyverlamp2_frontend/")
    assert url in hass.data[DATA_EXTRA_MODULE_URL].urls
    client = await hass_client()
    response = await client.get(url)
    assert response.status == 200
    assert url.endswith("/gyverlamp2.js")
    body = await response.text()
    assert "gyverlamp2-card" in body
    assert "gyverlamp2-control-dialog" in body
    await async_setup_frontend(hass)
    assert await hass.config_entries.async_reload(entry.entry_id)
    assert hass.data[DATA_FRONTEND] == url
    assert sum("gyverlamp2_frontend" in item for item in hass.data[DATA_EXTRA_MODULE_URL].urls) == 1


def test_asset_hash_changes_when_either_module_changes(tmp_path: Path):
    card = tmp_path / "gyverlamp2-card.js"
    popup = tmp_path / "gyverlamp2-popup.js"
    card.write_text("card v1")
    popup.write_text("popup v1")
    with patch("custom_components.gyverlamp2.frontend.ASSET_DIR", tmp_path):
        first = _asset_version()
        card.write_text("card v2")
        second = _asset_version()
        assert first != second
        popup.write_text("popup v2")
        assert second != _asset_version()


async def test_ui_bindings_follow_renames_and_are_isolated_per_lamp(hass, fake_udp):
    first, light_id = await setup(hass)
    registry = er.async_get(hass)
    controls = hass.states.get(light_id).attributes["gyverlamp2_ui"]
    assert controls["schema"] == 1
    old_speed = controls["speed_entity"]
    assert registry.async_get(old_speed).unique_id == f"{first.entry_id}_speed"
    registry.async_update_entity(old_speed, new_entity_id="number.renamed_speed")
    await hass.async_block_till_done()
    assert (
        hass.states.get(light_id).attributes["gyverlamp2_ui"]["speed_entity"]
        == "number.renamed_speed"
    )
    registry.async_update_entity(light_id, new_entity_id="light.renamed_lamp")
    await hass.async_block_till_done()
    second = entry_for(hass, host="192.0.2.108")
    # A different title/host should not bind to the first lamp's controls.
    hass.config_entries.async_update_entry(second, unique_id="192.0.2.108")
    assert await hass.config_entries.async_setup(second.entry_id)
    await hass.async_block_till_done()
    second_light = registry.async_get_entity_id("light", "gyverlamp2", f"{second.entry_id}_light")
    second_controls = hass.states.get(second_light).attributes["gyverlamp2_ui"]
    assert second_controls["speed_entity"] != "number.renamed_speed"
    assert registry.async_get(second_controls["speed_entity"]).config_entry_id == second.entry_id
    assert (
        hass.states.get("light.renamed_lamp").attributes["gyverlamp2_ui"]["speed_entity"]
        == "number.renamed_speed"
    )


def test_group_uses_dropdown_and_preserves_integer_storage():
    from homeassistant.helpers.selector import SelectSelector

    from custom_components.gyverlamp2.config_flow import (
        connection_schema,
        validate_connection_settings,
    )

    for defaults, include_name in [({}, True), ({"group": 7}, False)]:
        schema = connection_schema(defaults, name=include_name)
        group = next(value for key, value in schema.schema.items() if key.schema == "group")
        assert isinstance(group, SelectSelector)
        assert group.config["mode"] == "dropdown"
        assert group.config["options"] == [str(number) for number in range(1, 11)]
        key = next(key for key in schema.schema if key.schema == "group")
        assert key.default() == str(defaults.get("group", 1))
        for choice in ("1", "10"):
            data = validate_connection_settings(
                {"host": "192.0.2.107", "group": group(choice), "network_key": "GL"}
            )
            assert data["group"] == int(choice)
