import re
from datetime import datetime
from enum import IntEnum
from ipaddress import IPv4Address, IPv4Network

from .const import (
    BRIGHTNESS_MIN,
    BYTE_MAX,
    BYTE_MIN,
    DEFAULT_GROUP,
    DEFAULT_NETWORK_KEY,
    MAX_GROUP,
    MAX_NETWORK_KEY_LENGTH,
    MIN_GROUP,
)


class PacketType(IntEnum):
    CONTROL = 0
    MODE_BANK = 2
    SLAVE = 4


class ControlCommand(IntEnum):
    OFF = 0
    ON = 1
    PREVIOUS = 4
    NEXT = 5


class SlaveCommand(IntEnum):
    PRESET = 1
    BRIGHTNESS = 2


class FirmwareEffect(IntEnum):
    PERLIN = 1
    COLOR = 2
    CYCLE = 3
    GRADIENT = 4
    PARTICLES = 5
    FIRE = 6
    FIRE_2020 = 7
    CONFETTI = 8
    TORNADO = 9
    CLOCK = 10


class ModeField(IntEnum):
    EFFECT = 0
    INDIVIDUAL_BRIGHTNESS = 1
    BRIGHTNESS = 2
    ADVANCED_MODE = 3
    SOUND_REACTION = 4
    REACTION_MINIMUM = 5
    REACTION_MAXIMUM = 6
    SPEED = 7
    PALETTE = 8
    SCALE = 9
    FROM_CENTER = 10
    HUE = 11
    USE_PALETTE = 12


PACKET_PREFIX = "GL"
PACKET_ENCODING = "ascii"
MAX_PRESETS = 40
MAX_MODE_RECORDS = 19
MAX_UDP_PAYLOAD_BYTES = 1460
FIRMWARE_SLOT_OFFSET = 1
DAYS_PER_WEEK = 7
PYTHON_WEEKDAY_OFFSET = 1

PORT_HASH_INITIAL_VALUE = 17
PORT_HASH_MASK = 0xFFFF
UDP_PORT_BASE = 50000
UDP_PORT_RANGE = 15000
PRINTABLE_ASCII_MIN = 33
PRINTABLE_ASCII_MAX = 126

BUILTIN_PALETTE_FIRST_ID = 2
BUILTIN_PALETTE_LAST_ID = 32
HEAT_PALETTE_ID = BUILTIN_PALETTE_FIRST_ID
RAINBOW_PALETTE_ID = 12
INDIVIDUAL_BRIGHTNESS_ENABLED = 1
ADVANCED_MODE_EFFECT_ONLY = 1
ADVANCED_MODE_MIN = 1
ADVANCED_MODE_MAX = 5
DEFAULT_SOUND_REACTION = 1
SOUND_REACTION_MIN = 1
SOUND_REACTION_MAX = 3

RESERVED_IPV4_NETWORKS = (IPv4Network("0.0.0.0/8"), IPv4Network("240.0.0.0/4"))
_HEARTBEAT = re.compile(rb"GL_ONL([0-9]{1,2})")


def validate_host(value: str) -> str:
    address = IPv4Address(value.strip())
    invalid_address = (
        address.is_multicast
        or address.is_unspecified
        or address.is_loopback
        or address.is_link_local
        or any(address in network for network in RESERVED_IPV4_NETWORKS)
        or address.packed[-1] in (BYTE_MIN, BYTE_MAX)
    )

    if invalid_address:
        raise ValueError("A unicast IPv4 address is required")

    return str(address)


def udp_port(group: int = DEFAULT_GROUP, key: str = DEFAULT_NETWORK_KEY) -> int:
    if type(group) is not int or not MIN_GROUP <= group <= MAX_GROUP:
        raise ValueError(f"Group must be {MIN_GROUP}–{MAX_GROUP}")

    valid_key = (
        isinstance(key, str)
        and 1 <= len(key) <= MAX_NETWORK_KEY_LENGTH
        and all(PRINTABLE_ASCII_MIN <= ord(char) <= PRINTABLE_ASCII_MAX for char in key)
    )
    if not valid_key:
        raise ValueError(f"Key must contain 1–{MAX_NETWORK_KEY_LENGTH} printable ASCII characters")

    port_hash = PORT_HASH_INITIAL_VALUE
    for char in key:
        port_hash = (port_hash * ord(char)) & PORT_HASH_MASK

    return UDP_PORT_BASE + port_hash % UDP_PORT_RANGE + group


def heartbeat(data: bytes) -> int | None:
    match = _HEARTBEAT.fullmatch(data)
    if match and (index := int(match[1])) < MAX_PRESETS:
        return index

    return None


def firmware_weekday(now: datetime) -> int:
    return (now.weekday() + PYTHON_WEEKDAY_OFFSET) % DAYS_PER_WEEK


def control(command: int, now: datetime) -> bytes:
    if type(command) is not int and not isinstance(command, ControlCommand):
        raise ValueError("Unsupported control command")
    if command not in ControlCommand:
        raise ValueError("Unsupported control command")

    fields = (
        PACKET_PREFIX,
        PacketType.CONTROL,
        command,
        firmware_weekday(now),
        now.hour,
        now.minute,
        now.second,
    )
    return ",".join(map(str, fields)).encode(PACKET_ENCODING)


def slave_brightness(value: int) -> bytes:
    if type(value) is not int or not BRIGHTNESS_MIN <= value <= BYTE_MAX:
        raise ValueError(f"Brightness must be {BRIGHTNESS_MIN}–{BYTE_MAX}; use power off for zero")

    return f"{PACKET_PREFIX},{PacketType.SLAVE},{SlaveCommand.BRIGHTNESS},{value}".encode(
        PACKET_ENCODING
    )


def slave_preset(index: int) -> bytes:
    if type(index) is not int or not 0 <= index < MAX_PRESETS:
        raise ValueError(f"Preset index must be 0–{MAX_PRESETS - 1}")

    return f"{PACKET_PREFIX},{PacketType.SLAVE},{SlaveCommand.PRESET},{index}".encode(
        PACKET_ENCODING
    )


def validate_mode_record(row: tuple[int, ...]) -> None:
    if len(row) != len(ModeField) or any(
        type(value) is not int or not BYTE_MIN <= value <= BYTE_MAX for value in row
    ):
        raise ValueError(f"Each mode must have exactly {len(ModeField)} byte fields")

    valid_fields = (
        FirmwareEffect.PERLIN <= row[ModeField.EFFECT] <= FirmwareEffect.CLOCK
        and row[ModeField.INDIVIDUAL_BRIGHTNESS] in (0, 1)
        and ADVANCED_MODE_MIN <= row[ModeField.ADVANCED_MODE] <= ADVANCED_MODE_MAX
        and SOUND_REACTION_MIN <= row[ModeField.SOUND_REACTION] <= SOUND_REACTION_MAX
        and row[ModeField.REACTION_MINIMUM] <= row[ModeField.REACTION_MAXIMUM]
        and BUILTIN_PALETTE_FIRST_ID <= row[ModeField.PALETTE] <= BUILTIN_PALETTE_LAST_ID
        and row[ModeField.FROM_CENTER] in (0, 1)
        and row[ModeField.USE_PALETTE] in (0, 1)
    )
    if not valid_fields:
        raise ValueError("Invalid mode field range")


def mode_bank(records: tuple[tuple[int, ...], ...], selected: int, now: datetime) -> bytes:
    if (
        not 1 <= len(records) <= MAX_MODE_RECORDS
        or type(selected) is not int
        or not 0 <= selected < len(records)
    ):
        raise ValueError("Invalid mode bank size or active mode")

    values = []
    for row in records:
        validate_mode_record(row)
        values.extend(row)

    fields = [
        PACKET_PREFIX,
        PacketType.MODE_BANK,
        len(records),
        *values,
        selected + FIRMWARE_SLOT_OFFSET,
        firmware_weekday(now),
        now.hour,
        now.minute,
        now.second,
    ]
    packet = ",".join(map(str, fields)).encode(PACKET_ENCODING)
    if len(packet) > MAX_UDP_PAYLOAD_BYTES:
        raise ValueError("Mode bank packet would exceed a single UDP payload budget")

    return packet
