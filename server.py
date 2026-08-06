#!/usr/bin/env python3
"""Static server + POST /api/save-print → writes into ./Prints/."""

from __future__ import annotations

import argparse
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parent
PRINTS = ROOT / "Prints"
SAFE_NAME = re.compile(r"^[A-Za-z0-9._-]{1,120}$")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/save-print":
            self.send_error(404, "Not found")
            return

        qs = parse_qs(parsed.query)
        name = unquote((qs.get("name") or [""])[0]).strip()
        if not SAFE_NAME.match(name):
            self.send_error(400, "Invalid file name")
            return

        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0 or length > 40_000_000:
            self.send_error(400, "Invalid body size")
            return

        body = self.rfile.read(length)
        PRINTS.mkdir(parents=True, exist_ok=True)
        out = PRINTS / name
        out.write_bytes(body)

        payload = f'{{"ok":true,"path":"Prints/{name}","bytes":{len(body)}}}\n'.encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt, *args):
        sys_stderr = __import__("sys").stderr
        sys_stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main():
    parser = argparse.ArgumentParser(description="Serve cards + save PNGs into Prints/")
    parser.add_argument("--port", type=int, default=5173)
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()
    PRINTS.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"Serving {ROOT} at http://{args.host}:{args.port}")
    print(f"POST /api/save-print?name=file.png → {PRINTS}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
