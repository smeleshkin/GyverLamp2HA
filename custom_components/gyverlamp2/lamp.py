import asyncio
from collections.abc import Callable
from datetime import datetime
from typing import TYPE_CHECKING

from .const import (
    BYTE_MAX,
    COMMAND_INTERVAL,
    HEARTBEAT_TIMEOUT,
    MAX_PENDING,
    NEXT_MODE,
    PRESENCE_PROBE_TIMEOUT,
    PREVIOUS_MODE,
)
from .protocol import (
    ControlCommand,
    ModeField,
    control,
    mode_bank,
    slave_brightness,
    slave_preset,
    validate_host,
)

if TYPE_CHECKING:
    from .mode_manager import ModeManager
    from .transport import Bus


class LampError(Exception):
    pass


class Lamp:
    def __init__(
        self, bus: Bus, host: str, *, slave: bool = False, require_heartbeat: bool = True
    ) -> None:
        self.bus = bus
        self.host = validate_host(host)
        self.slave = slave
        self.require_heartbeat = require_heartbeat
        self.power: bool | None = None
        self.brightness: int | None = None
        self.preset: int | None = None
        self.requested_preset: int | None = None
        self.online = False
        self.last_seen: datetime | None = None
        self._closed = False
        self._listeners: set[Callable[[], None]] = set()
        self._expiry: asyncio.TimerHandle | None = None
        self._lock = asyncio.Lock()
        self._pending = 0
        self._last_sent = float("-inf")
        self._seen = asyncio.Event()
        self.modes: ModeManager | None = None

    @property
    def available(self) -> bool:
        return (
            not self._closed and self.bus.connected and (self.online or not self.require_heartbeat)
        )

    def subscribe(self, callback: Callable[[], None]) -> Callable[[], None]:
        self._listeners.add(callback)
        return lambda: self._listeners.discard(callback)

    def notify(self) -> None:
        for callback in tuple(self._listeners):
            callback()

    def receive(self, index: int) -> None:
        changed = not self.online or self.preset != index
        self.online = True
        self.preset = index
        self.last_seen = datetime.now().astimezone()
        self._seen.set()
        if self._expiry:
            self._expiry.cancel()
        self._expiry = asyncio.get_running_loop().call_later(
            HEARTBEAT_TIMEOUT, self.mark_unavailable
        )
        if self.requested_preset == index:
            self.requested_preset = None
            changed = True
        if changed:
            self.notify()

    def mark_unavailable(self) -> None:
        if self._expiry:
            self._expiry.cancel()
        self._expiry = None
        self.online = False

        self.power = self.brightness = None
        self.requested_preset = None
        self.notify()

    async def wait_seen(self, wait_seconds: float = PRESENCE_PROBE_TIMEOUT) -> bool:
        try:
            await asyncio.wait_for(self._seen.wait(), wait_seconds)
        except TimeoutError:
            return False
        return self.online

    async def _send(self, data: bytes) -> None:
        loop = asyncio.get_running_loop()
        await asyncio.sleep(max(0, self._last_sent + COMMAND_INTERVAL - loop.time()))
        if not self.available:
            raise LampError("Lamp unavailable; check heartbeat, group and network")
        self.bus.send(data, self.host)
        self._last_sent = loop.time()

    async def set_light(
        self, *, on: bool, now: datetime, brightness: int | None = None, preset: int | None = None
    ) -> None:
        power_packet = control(ControlCommand.ON if on else ControlCommand.OFF, now)
        bright_packet = slave_brightness(brightness) if brightness is not None else None
        preset_packet = slave_preset(preset) if preset is not None else None
        if (bright_packet or preset_packet) and not self.slave:
            raise LampError("Brightness/preset require confirmed Slave mode")
        if not on and (bright_packet or preset_packet):
            raise LampError("Cannot apply brightness/preset in a power-off call")
        if self._pending >= MAX_PENDING:
            raise LampError("Too many pending lamp commands")
        self._pending += 1
        try:
            async with self._lock:
                await self._send(power_packet)
                self.power = on
                self.notify()
                if bright_packet:
                    await self._send(bright_packet)
                    self.brightness = brightness
                    self.notify()
                if preset_packet:
                    await self._send(preset_packet)
                    self.requested_preset = preset
                    self.notify()
        finally:
            self._pending -= 1

    async def step_preset(self, direction: int, now: datetime) -> None:
        if type(direction) is not int or direction not in (PREVIOUS_MODE, NEXT_MODE):
            raise ValueError("Direction must be -1 or 1")
        if self._pending >= MAX_PENDING:
            raise LampError("Too many pending lamp commands")
        self._pending += 1
        try:
            async with self._lock:
                await self._send(
                    control(
                        ControlCommand.NEXT if direction == NEXT_MODE else ControlCommand.PREVIOUS,
                        now,
                    )
                )
        finally:
            self._pending -= 1

    async def apply_modes(
        self,
        records: tuple[tuple[int, ...], ...],
        selected: int,
        now: datetime,
        *,
        turn_on: bool = False,
    ) -> None:
        packet = mode_bank(records, selected, now)
        if self._pending >= MAX_PENDING:
            raise LampError("Too many pending lamp commands")
        self._pending += 1
        try:
            async with self._lock:
                if turn_on:
                    await self._send(control(ControlCommand.ON, now))
                    self.power = True
                    self.notify()

                if self.slave and turn_on:
                    await self._send(slave_brightness(BYTE_MAX))
                await self._send(packet)
                self.requested_preset = selected
                self.brightness = records[selected][ModeField.BRIGHTNESS]
                self.notify()
        finally:
            self._pending -= 1

    def close(self) -> None:
        self._closed = True
        if self._expiry:
            self._expiry.cancel()
        self._listeners.clear()
