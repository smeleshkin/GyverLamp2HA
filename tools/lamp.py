#!/usr/bin/env python3
"""Read-only listener by default; explicit commands for local hardware checks.

Requires only the Python standard library, not a Home Assistant installation.
"""

import argparse
import importlib.util
import select
import socket
import time
from datetime import datetime
from pathlib import Path

source = Path(__file__).resolve().parents[1] / "custom_components/gyverlamp2/protocol.py"
spec = importlib.util.spec_from_file_location("gyverlamp2_protocol", source)
assert spec and spec.loader
protocol = importlib.util.module_from_spec(spec)
spec.loader.exec_module(protocol)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("host", type=protocol.validate_host)
    parser.add_argument(
        "command",
        choices=("listen", "on", "off", "next", "previous", "brightness", "preset"),
        default="listen",
        nargs="?",
    )
    parser.add_argument("value", type=int, nargs="?")
    parser.add_argument("--group", type=int, default=1)
    parser.add_argument("--key", default="GL")
    parser.add_argument("--slave", action="store_true", help="Confirm the lamp's Slave role")
    parser.add_argument("--seconds", type=float, default=5)
    args = parser.parse_args()
    try:
        port = protocol.udp_port(args.group, args.key)
        if not 0 < args.seconds <= 300:
            raise ValueError("Listening duration must be 0–300 seconds")
        if args.command == "brightness":
            if not args.slave:
                raise ValueError("Confirm Slave mode with --slave")
            packet = protocol.slave_brightness(args.value)
        elif args.command == "preset":
            if not args.slave or args.value is None:
                raise ValueError("Provide a 1-based preset number and --slave")
            packet = protocol.slave_preset(args.value - 1)
        elif args.command != "listen":
            packet = protocol.control(
                {"on": 1, "off": 0, "next": 5, "previous": 4}[args.command],
                datetime.now().astimezone(),
            )
    except (ValueError, TypeError) as err:
        parser.error(str(err))
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        if args.command != "listen":
            sock.sendto(packet, (args.host, port))
            print(f"Sent {packet.decode()} to {args.host}:{port}; NOT acknowledged")
            return
        sock.bind(("0.0.0.0", port))
        print(f"Listening for {args.host}:{port}; no commands sent", flush=True)
        deadline = time.monotonic() + args.seconds
        count = 0
        while (remaining := deadline - time.monotonic()) > 0:
            if not select.select([sock], [], [], remaining)[0]:
                break
            data, address = sock.recvfrom(1024)
            if address == (args.host, port) and (index := protocol.heartbeat(data)) is not None:
                count += 1
                if count <= 5:
                    print(f"Heartbeat: current preset {index + 1}", flush=True)
        print(f"Received {count} valid heartbeats. No heartbeat does not prove power is off.")


if __name__ == "__main__":
    main()
