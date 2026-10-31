import hashlib
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from .const import ASSET_HASH_LENGTH, DOMAIN, UI_BINDINGS_SCHEMA_VERSION

DATA_FRONTEND = "gyverlamp2_frontend"
ASSET_DIR = Path(__file__).parent / "frontend"


CONTROL_ENTITIES = {
    "mode": "select",
    "palette": "select",
    "color_source": "select",
    "speed": "number",
    "scale": "number",
    "hue": "number",
    "saturation": "number",
}


def _asset_version() -> str:
    digest = hashlib.sha256()
    for asset in sorted(ASSET_DIR.glob("*.js")):
        digest.update(asset.name.encode())
        digest.update(asset.read_bytes())
    return digest.hexdigest()[:ASSET_HASH_LENGTH]


async def async_setup_frontend(hass: HomeAssistant) -> None:
    if DATA_FRONTEND in hass.data:
        return

    version = await hass.async_add_executor_job(_asset_version)
    base = f"/gyverlamp2_frontend/{version}"
    await hass.http.async_register_static_paths([StaticPathConfig(base, str(ASSET_DIR), True)])

    url = f"{base}/gyverlamp2.js"
    add_extra_js_url(hass, url)
    hass.data[DATA_FRONTEND] = url


def control_bindings(hass: HomeAssistant, entry_id: str) -> dict[str, int | str | None]:
    registry = er.async_get(hass)
    return {
        "schema": UI_BINDINGS_SCHEMA_VERSION,
        **{
            f"{key}_entity": registry.async_get_entity_id(domain, DOMAIN, f"{entry_id}_{key}")
            for key, domain in CONTROL_ENTITIES.items()
        },
    }
