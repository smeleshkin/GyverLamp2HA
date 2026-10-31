import asyncio
import logging
from typing import cast

from .lamp import Lamp, LampError
from .protocol import heartbeat, validate_host

_LOGGER = logging.getLogger(__name__)


class Bus(asyncio.DatagramProtocol):
    def __init__(self, port: int) -> None:
        self.port = port
        self.transport: asyncio.DatagramTransport | None = None
        self.lamps: dict[str, Lamp] = {}

    @property
    def connected(self) -> bool:
        return self.transport is not None and not self.transport.is_closing()

    async def start(self) -> None:
        await asyncio.get_running_loop().create_datagram_endpoint(
            lambda: self, local_addr=("0.0.0.0", self.port), allow_broadcast=True
        )

    def connection_made(self, transport: asyncio.BaseTransport) -> None:
        self.transport = cast(asyncio.DatagramTransport, transport)

    def datagram_received(self, data: bytes, addr: tuple[str, int]) -> None:
        if addr[1] != self.port or (lamp := self.lamps.get(addr[0])) is None:
            return
        if (index := heartbeat(data)) is not None:
            lamp.receive(index)

    def send(self, data: bytes, host: str) -> None:
        if not self.connected:
            raise LampError("UDP listener is closed")
        try:
            assert self.transport is not None
            self.transport.sendto(data, (host, self.port))
        except OSError as err:
            raise LampError("UDP send failed") from err

    def error_received(self, exc: Exception) -> None:
        _LOGGER.debug("GyverLamp2 UDP error on port %s: %s", self.port, exc)
        for lamp in self.lamps.values():
            lamp.mark_unavailable()

    def connection_lost(self, exc: Exception | None) -> None:
        self.transport = None
        for lamp in self.lamps.values():
            lamp.mark_unavailable()

    def close(self) -> None:
        for lamp in self.lamps.values():
            lamp.close()
        self.lamps.clear()
        if self.transport:
            self.transport.close()


class Manager:
    def __init__(self) -> None:
        self.buses: dict[int, Bus] = {}
        self._lock = asyncio.Lock()

    async def acquire(
        self, host: str, port: int, *, slave: bool = False, require_heartbeat: bool = True
    ) -> Lamp:
        host = validate_host(host)
        async with self._lock:
            if (bus := self.buses.get(port)) is None:
                bus = Bus(port)
                await bus.start()
                self.buses[port] = bus
            if host in bus.lamps:
                raise LampError("This IP/group is already in use")
            lamp = Lamp(bus, host, slave=slave, require_heartbeat=require_heartbeat)
            bus.lamps[host] = lamp
            return lamp

    async def release(self, lamp: Lamp) -> None:
        async with self._lock:
            bus = lamp.bus
            lamp.close()
            bus.lamps.pop(lamp.host, None)
            if not bus.lamps:
                bus.close()
                self.buses.pop(bus.port, None)

    def close(self) -> None:
        for bus in self.buses.values():
            bus.close()
        self.buses.clear()
