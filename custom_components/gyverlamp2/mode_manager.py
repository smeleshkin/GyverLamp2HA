import asyncio
from typing import Any

from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import MAX_PENDING
from .lamp import Lamp, LampError
from .modes import MODES, ModeBank


class ModeManager:
    def __init__(self, lamp: Lamp, store: Store) -> None:
        self.lamp = lamp
        self.store = store
        self.bank = ModeBank()
        self.pending = True
        self._lock = asyncio.Lock()
        self._waiting = 0

    async def load(self) -> None:
        self.bank = ModeBank.load(await self.store.async_load())

    async def update(
        self,
        mode: str | None = None,
        *,
        turn_on: bool = False,
        direction: int = 0,
        hs_color: tuple[float, float] | None = None,
        **changes: Any,
    ) -> None:
        if self._waiting >= MAX_PENDING:
            raise LampError("Too many pending mode updates")
        self._waiting += 1
        try:
            async with self._lock:
                candidate = self._prepare_update(mode, direction, hs_color, changes)
                await self.store.async_save(candidate.dump())
                self.bank = candidate
                self.pending = True
                self.lamp.notify()
                if not self.lamp.available:
                    if turn_on:
                        raise LampError("Settings saved; lamp unavailable, command not sent")
                    return
                await self.lamp.apply_modes(
                    candidate.records(), candidate.active, dt_util.now(), turn_on=turn_on
                )
                self.pending = False
                self.lamp.notify()
        finally:
            self._waiting -= 1

    def _prepare_update(
        self,
        mode: str | None,
        direction: int,
        hs_color: tuple[float, float] | None,
        changes: dict[str, Any],
    ) -> ModeBank:
        if direction:
            mode = MODES[(self.bank.active + direction) % len(MODES)].key
        candidate = self.bank.updated(mode)
        if hs_color is not None:
            if not candidate.color_enabled:
                raise ValueError("Selected mode uses a palette, not an individual color")
            changes = {**changes, "hue": hs_color[0]}
            if candidate.mode.key == "color":
                changes["saturation"] = hs_color[1]
        return candidate.updated(**changes)

    async def step(self, direction: int) -> None:
        await self.update(direction=direction)
