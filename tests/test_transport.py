import asyncio
from datetime import datetime
from unittest.mock import MagicMock

import pytest

from custom_components.gyverlamp2 import lamp as lamp_module
from custom_components.gyverlamp2.lamp import Lamp, LampError
from custom_components.gyverlamp2.transport import Bus, Manager


@pytest.fixture
def lamp():
    bus = Bus(61197)
    bus.transport = MagicMock()
    bus.transport.is_closing.return_value = False
    lamp = Lamp(bus, "192.0.2.107", slave=True)
    bus.lamps[lamp.host] = lamp
    yield lamp
    lamp.close()


async def test_only_target_source_ip_and_port_can_mark_available(lamp):
    bus = lamp.bus
    bus.datagram_received(b"GL_ONL2", ("192.0.2.108", 61197))
    bus.datagram_received(b"GL_ONL2", (lamp.host, 8888))
    bus.datagram_received(b"GL,4,0,1", (lamp.host, 61197))
    assert not lamp.available
    bus.datagram_received(b"GL_ONL2", (lamp.host, 61197))
    assert lamp.available and lamp.preset == 2
    assert lamp.power is None and lamp.brightness is None
    assert await lamp.wait_seen(0.01)


async def test_presence_expiry_clears_assumptions(lamp, monkeypatch):
    monkeypatch.setattr(lamp_module, "HEARTBEAT_TIMEOUT", 0.01)
    lamp.receive(0)
    lamp.power, lamp.brightness = True, 128
    await asyncio.sleep(0.03)
    assert not lamp.online and not lamp.available
    assert lamp.power is None and lamp.brightness is None


async def test_rate_limit_and_unicast_whole_service_calls(lamp, monkeypatch):
    monkeypatch.setattr(lamp_module, "COMMAND_INTERVAL", 0.025)
    times, packets = [], []

    def sendto(data, address):
        times.append(asyncio.get_running_loop().time())
        packets.append((data, address))

    lamp.bus.transport.sendto.side_effect = sendto
    lamp.receive(0)
    now = datetime(2026, 10, 31)
    await asyncio.gather(
        lamp.set_light(on=True, now=now, brightness=100, preset=1),
        lamp.set_light(on=False, now=now),
    )
    assert [x[0] for x in packets] == [
        b"GL,0,1,6,0,0,0",
        b"GL,4,2,100",
        b"GL,4,1,1",
        b"GL,0,0,6,0,0,0",
    ]
    assert all(address == (lamp.host, 61197) for _, address in packets)
    assert all(b - a >= 0.024 for a, b in zip(times, times[1:], strict=False))
    assert lamp.power is False
    assert lamp.preset == 0 and lamp.requested_preset == 1
    lamp.receive(1)
    assert lamp.preset == 1 and lamp.requested_preset is None


async def test_role_and_value_validated_before_any_side_effect(lamp):
    lamp.slave = False
    with pytest.raises(LampError):
        await lamp.set_light(on=True, now=datetime.now(), brightness=100)
    lamp.slave = True
    with pytest.raises(ValueError):
        await lamp.set_light(on=True, now=datetime.now(), preset=40)
    lamp.bus.transport.sendto.assert_not_called()


async def test_presence_required_and_no_false_ack(lamp):
    with pytest.raises(LampError):
        await lamp.set_light(on=True, now=datetime.now())
    assert lamp.power is None
    lamp.require_heartbeat = False
    await lamp.set_light(on=True, now=datetime.now())
    assert lamp.power is True and not lamp.online
    assert lamp.preset is None


async def test_relative_preset_not_retried(lamp):
    lamp.receive(0)
    await lamp.step_preset(1, datetime.now())
    assert lamp.bus.transport.sendto.call_count == 1
    assert lamp.preset == 0  # Never invent a confirmed new preset.


async def test_pending_queue_is_bounded(lamp):
    lamp._pending = lamp_module.MAX_PENDING
    with pytest.raises(LampError, match="Too many"):
        await lamp.set_light(on=True, now=datetime.now())
    lamp.bus.transport.sendto.assert_not_called()


async def test_shared_group_listener_and_clean_release(fake_udp):
    manager = Manager()
    first = await manager.acquire("192.0.2.107", 61197)
    second = await manager.acquire("192.0.2.108", 61197)
    assert first.bus is second.bus and len(manager.buses) == 1
    with pytest.raises(LampError):
        await manager.acquire("192.0.2.107", 61197)
    bus = first.bus
    await manager.release(first)
    assert bus.connected
    await manager.release(second)
    bus.transport.close.assert_called_once()
    assert not manager.buses
