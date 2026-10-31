"""Use real HA 2026.10 entities/flows with an in-memory UDP adapter."""

from unittest.mock import MagicMock

import pytest

from custom_components.gyverlamp2.transport import Bus


@pytest.fixture(autouse=True)
def custom_integrations(enable_custom_integrations):
    yield


@pytest.fixture
def fake_udp(monkeypatch):
    async def start(bus):
        bus.transport = MagicMock()
        bus.transport.is_closing.return_value = False

    monkeypatch.setattr(Bus, "start", start)
