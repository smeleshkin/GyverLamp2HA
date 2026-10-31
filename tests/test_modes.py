import asyncio
from datetime import datetime
from unittest.mock import AsyncMock

import pytest

from custom_components.gyverlamp2.mode_manager import ModeManager
from custom_components.gyverlamp2.modes import MODES, ModeBank
from custom_components.gyverlamp2.protocol import mode_bank


def test_independent_mode_settings_and_serialized_round_trip():
    bank = ModeBank().updated("particles", hue=240, speed=33, brightness=100)
    bank = bank.updated("color", hue=30, saturation=50, brightness=200)
    assert bank.current.brightness == 200
    assert bank.updated("particles").current.hue == 240
    assert bank.updated("particles").current.speed == 33
    assert ModeBank.load(bank.dump()).dump() == bank.dump()
    assert len(bank.records()) == 10
    assert all(row[8] != 1 for row in bank.records())  # No custom palette.


def test_mode_packet_round_trip_like_firmware_parser():
    bank = ModeBank().updated("color", hue=180, saturation=100)
    packet = mode_bank(bank.records(), bank.active, datetime(2026, 10, 31, 15, 16, 17))
    fields = packet.decode().split(",")
    assert fields[:3] == ["GL", "2", "10"]
    data = list(map(int, fields[1:]))
    # Include GL's atoi result exactly as the firmware does.
    data = [0] + data
    start = 13 * data[2] + 3
    assert start < 256
    assert data[start : start + 5] == [2, 6, 15, 16, 17]
    assert data[3 + 13 : 3 + 26] == list(bank.records()[1])
    assert len(packet) <= 1460 and len(data) <= 40 * 13 + 10


@pytest.mark.parametrize(
    "mode,changes",
    [
        ("color", {"speed": 1}),
        ("perlin", {"hue": 30}),
        ("cycle", {"scale": 1}),
        ("particles", {"from_center": True}),
        ("fire", {"saturation": 50}),
        ("color", {"hue": float("nan")}),
        ("color", {"brightness": 0}),
        ("particles", {"speed": 1.5}),
        ("color", {"scale": 100, "saturation": 50}),
        ("weather", {}),
        ("color", {"palette": 1}),
    ],
)
def test_rejects_unimplemented_parameters(mode, changes):
    with pytest.raises(ValueError):
        ModeBank().updated(mode, **changes)


def test_rejects_count_overflow_and_invalid_rows():
    rows = ModeBank().records()
    with pytest.raises(ValueError):
        mode_bank(rows * 2, 0, datetime.now())
    broken = list(rows)
    broken[0] = tuple([255] * 13)
    with pytest.raises(ValueError):
        mode_bank(tuple(broken), 0, datetime.now())
    with pytest.raises(ValueError):
        ModeBank.load({"active": "color", "modes": {}})


async def test_disk_failure_does_not_change_lamp_or_memory():
    lamp = AsyncMock()
    lamp.available = True
    lamp.notify = lambda: None
    store = AsyncMock()
    store.async_save.side_effect = OSError("disk full")
    manager = ModeManager(lamp, store)
    old = manager.bank.dump()
    with pytest.raises(OSError):
        await manager.update("fire", hue=60, turn_on=True)
    lamp.apply_modes.assert_not_called()
    assert manager.bank.dump() == old


async def test_failed_send_keeps_desired_settings_for_retry():
    lamp = AsyncMock()
    lamp.available = True
    lamp.notify = lambda: None
    lamp.apply_modes.side_effect = OSError("network error")
    store = AsyncMock()
    manager = ModeManager(lamp, store)
    with pytest.raises(OSError):
        await manager.update("particles", hue=90)
    assert manager.bank.mode.key == "particles" and manager.pending
    assert store.async_save.call_count == 1


async def test_concurrent_updates_and_steps_keep_all_settings():
    lamp = AsyncMock()
    lamp.available = True
    lamp.notify = lambda: None
    manager = ModeManager(lamp, AsyncMock())
    await asyncio.gather(manager.update("particles", speed=10), manager.update("color", hue=180))
    assert manager.bank.updated("particles").current.speed == 10
    assert manager.bank.updated("color").current.hue == 180
    active = manager.bank.active
    await asyncio.gather(manager.step(1), manager.step(1))
    assert manager.bank.active == (active + 2) % len(MODES)


def test_builtin_palette_indices_and_from_palette_flag():
    from custom_components.gyverlamp2.palettes import PALETTES, palette_id, palette_name

    assert len(PALETTES) == 31
    assert palette_id("heat") == 2
    assert palette_id("Rainbow") == 12
    assert palette_id("ocean") == 15
    assert palette_name(32) == "Aurora"
    bank = ModeBank().updated("fire2020", palette="ocean", scale=200)
    assert bank.records()[6][8] == 15
    assert bank.mode.key == "fire2020" and not bank.color_enabled
    bank = bank.updated("particles", hue=210).updated(palette="forest")
    assert bank.current.use_palette and bank.records()[4][12] == 1
    assert not bank.color_enabled
    bank = bank.updated(color_source="hue")
    assert bank.color_enabled and bank.current.hue == 210
    assert bank.records()[4][12] == 0
    assert ModeBank.load(bank.dump()).dump() == bank.dump()


def test_upgrade_saved_settings_preserves_every_existing_value():
    bank = ModeBank().updated("fire", hue=178, scale=26, speed=152)
    old = bank.dump()
    for values in old["modes"].values():
        values.pop("palette")
        values.pop("use_palette")
    restored = ModeBank.load(old)
    assert restored.mode.key == "fire"
    assert restored.current.hue == 178 and restored.current.scale == 26
    assert restored.current.speed == 152
    assert restored.current.palette == 2
    assert restored.updated("perlin").current.palette == 12


@pytest.mark.parametrize(
    "mode,palette",
    [
        ("fire", "ocean"),
        ("color", "forest"),
        ("clock", "rainbow"),
        ("fire2020", 1),
        ("perlin", 33),
        ("perlin", True),
    ],
)
def test_rejects_unsupported_and_custom_palettes(mode, palette):
    with pytest.raises(ValueError):
        ModeBank().updated(mode, palette=palette)


async def test_color_resolution_serialized_with_pending_mode_selection():
    lamp = AsyncMock()
    lamp.available = True
    lamp.notify = lambda: None
    entered, release = asyncio.Event(), asyncio.Event()
    calls = 0

    async def send(*args, **kwargs):
        nonlocal calls
        calls += 1
        if calls == 1:
            entered.set()
            await release.wait()

    lamp.apply_modes.side_effect = send
    manager = ModeManager(lamp, AsyncMock())
    busy = asyncio.create_task(manager.update("perlin"))
    await entered.wait()
    fire = asyncio.create_task(manager.update("fire"))
    await asyncio.sleep(0)
    color = asyncio.create_task(manager.update(hs_color=(240, 50)))
    release.set()
    await asyncio.gather(busy, fire, color)
    assert manager.bank.mode.key == "fire"
    assert manager.bank.current.hue == 240
    assert manager.bank.current.scale == 128


async def test_invalid_color_does_not_replace_palette_effect_or_save():
    lamp = AsyncMock()
    lamp.available = False
    lamp.notify = lambda: None
    store = AsyncMock()
    manager = ModeManager(lamp, store)
    await manager.update("fire2020", palette="ocean")
    before = manager.bank.dump()
    count = store.async_save.call_count
    with pytest.raises(ValueError):
        await manager.update(hs_color=(120, 100))
    assert manager.bank.dump() == before
    assert store.async_save.call_count == count
