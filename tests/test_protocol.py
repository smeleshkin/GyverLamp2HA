from datetime import datetime

import pytest

from custom_components.gyverlamp2.protocol import (
    control,
    heartbeat,
    slave_brightness,
    slave_preset,
    udp_port,
    validate_host,
)


def test_port_matches_firmware_uint16_and_app():
    assert udp_port(1, "GL") == 61197
    assert udp_port(10, "GL") == 61206
    assert udp_port(1, "GL") != 50000 + (17 * 71 * 76) % 15000 + 1


@pytest.mark.parametrize(
    "group,key",
    [(0, "GL"), (11, "GL"), (True, "GL"), (1, ""), (1, "АБ"), (1, "a" * 17), (1, "GL\n")],
)
def test_invalid_group_key(group, key):
    with pytest.raises(ValueError):
        udp_port(group, key)


@pytest.mark.parametrize(
    "data",
    [
        b"",
        b"GL_ONL",
        b"GL_ONL40",
        b"GL_ONL255",
        b"GL_ONL-1",
        b"GL_ONL1\n",
        b"GL_ONL1\0",
        b"GL,4,0,1",
        b"GL_ONL" + b"1" * 5000,
    ],
)
def test_heartbeat_does_not_trust_other_or_unbounded_packets(data):
    assert heartbeat(data) is None


def test_heartbeat_and_zero_based_index():
    assert heartbeat(b"GL_ONL0") == 0
    assert heartbeat(b"GL_ONL39") == 39


def test_commands_do_not_include_full_config_or_bad_weekday():
    now = datetime(2026, 11, 1, 13, 14, 15)  # Sunday
    assert control(1, now) == b"GL,0,1,0,13,14,15"
    assert control(5, now) == b"GL,0,5,0,13,14,15"
    assert slave_preset(39) == b"GL,4,1,39"
    assert slave_brightness(128) == b"GL,4,2,128"
    for command in (2, 3, 6, 7, 8, 9, 10, 11, 12, 13):
        with pytest.raises(ValueError):
            control(command, now)


@pytest.mark.parametrize("value", [-1, 0, 256, 1.5, True, "64,0"])
def test_brightness_validation(value):
    with pytest.raises(ValueError):
        slave_brightness(value)


@pytest.mark.parametrize("value", [-1, 40, True, 1.5, "1"])
def test_preset_validation(value):
    with pytest.raises(ValueError):
        slave_preset(value)


@pytest.mark.parametrize(
    "host",
    [
        "0.0.0.0",
        "127.0.0.1",
        "192.0.2.255",
        "224.0.0.1",
        "255.255.255.255",
        "169.254.1.1",
        "example.com",
    ],
)
def test_no_broadcast_or_hostname_controls(host):
    with pytest.raises(ValueError):
        validate_host(host)
