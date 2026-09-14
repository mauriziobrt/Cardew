#!/usr/bin/env python3
"""
tracker.py — self-contained process tracking + OSC server.
Svelte sends commands over WebSocket, gets back log strings.
OSC is handled entirely here.

Run: python tracker.py

WS:  ws://localhost:8765/ws          ← single command channel
GET: http://localhost:8765/processes ← process list for REPL autocomplete
"""

import asyncio, json, psutil, time
from abc import ABC, abstractmethod
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pythonosc import udp_client
import uvicorn

# ── OSC setup ─────────────────────────────────────────────────────────────────
# TODO: make host/port configurable (read from same config Obsidian plugin uses)

OSC_HOST = "127.0.0.1"
OSC_PORT = 57120       # SuperCollider default — change to 57122 for Max etc.
osc = udp_client.SimpleUDPClient(OSC_HOST, OSC_PORT)

def osc_send(address: str, *values):
    """Thin wrapper — swap implementation here if you change OSC library."""
    osc.send_message(address, list(values) if len(values) > 1 else values[0])

# ── Base handler ──────────────────────────────────────────────────────────────

class ProcessHandler(ABC):
    """
    Subclass this for each software you want to track.
    Override reason() to add ad-hoc logic and OSC mapping.
    """
    name: str          # process name as it appears in Activity Monitor
    interval: float = 0.1

    def __init__(self, proc: psutil.Process, log):
        self.proc = proc
        self.log = log  # async callable → sends string back to Svelte

    def collect(self) -> dict:
        """
        Base metrics — available to all handlers.
        TODO: extend with io_counters, connections, children, etc.
        """
        with self.proc.oneshot():
            return {
                "cpu":     self.proc.cpu_percent(),
                "mem":     self.proc.memory_percent(),
                "mem_rss": self.proc.memory_info().rss,
                "threads": self.proc.num_threads(),
                "status":  self.proc.status(),
                "ts":      time.time(),
            }

    @abstractmethod
    async def reason(self, metrics: dict):
        """
        Ad-hoc reasoning + OSC sends for this specific software.
        Called every self.interval seconds with fresh metrics.
        """
        ...

    async def run(self):
        self.proc.cpu_percent()  # prime
        await asyncio.sleep(self.interval)
        while True:
            try:
                m = self.collect()
                await self.reason(m)
                await asyncio.sleep(self.interval)
            except psutil.NoSuchProcess:
                await self.log(f"{self.name} exited")
                break

# ── Per-software handlers ─────────────────────────────────────────────────────
# Add a new class here for each process you want to track.
# Register it in HANDLERS at the bottom of this section.

class MaxHandler(ProcessHandler):
    name = "Max"

    async def reason(self, m: dict):
        # TODO: your Max-specific reasoning here
        # e.g. correlate CPU spikes with patch complexity
        osc_send("/max/cpu",     m["cpu"])
        osc_send("/max/mem",     m["mem"])
        osc_send("/max/threads", m["threads"])
        # TODO: map m["status"] changes (sleeping→running) to gate signals

class FinderHandler(ProcessHandler):
    name = "Finder"

    async def reason(self, m: dict):
        # TODO: Finder-specific — open files count, directory events, etc.
        osc_send("/finder/cpu", m["cpu"])
        osc_send("/finder/mem", m["mem"])

class SafariHandler(ProcessHandler):
    name = "Safari"
    interval = 0.5  # slower poll — browser is noisy

    async def reason(self, m: dict):
        # TODO: network connections count → texture density
        osc_send("/safari/cpu",     m["cpu"])
        osc_send("/safari/threads", m["threads"])

# TODO: add more handlers — Logic, Ableton, Terminal, etc.
# Each gets its own OSC namespace and reasoning logic.

# ── Handler registry ──────────────────────────────────────────────────────────

HANDLERS: dict[str, type[ProcessHandler]] = {
    "max":     MaxHandler,
    "finder":  FinderHandler,
    "safari":  SafariHandler,
    # "logic":  LogicHandler,
    # "ableton": AbletonHandler,
}

def resolve_handler(name_or_pid: str) -> tuple[psutil.Process, type[ProcessHandler]] | None:
    """Find process + matching handler. Falls back to base if no handler registered."""
    # Resolve process
    proc = None
    if name_or_pid.isdigit():
        try:
            proc = psutil.Process(int(name_or_pid))
        except psutil.NoSuchProcess:
            return None
    else:
        for p in psutil.process_iter(['name', 'pid']):
            if p.info['name'].lower() == name_or_pid.lower():
                proc = psutil.Process(p.info['pid'])
                break

    if not proc:
        return None

    # Match handler
    key = name_or_pid.lower().split()[0]
    handler_cls = HANDLERS.get(key, None)

    # TODO: if no handler found, use a generic fallback handler
    # that just streams all base metrics without ad-hoc reasoning
    if not handler_cls:
        return None

    return proc, handler_cls

# ── FastAPI + WebSocket ───────────────────────────────────────────────────────

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Active tracking tasks — so Svelte can stop them by name
active_tasks: dict[str, asyncio.Task] = {}

@app.websocket("/ws")
async def command_channel(websocket: WebSocket):
    """
    Single command channel. Svelte sends:
      {"cmd": "track",  "target": "Max"}
      {"cmd": "stop",   "target": "Max"}
      {"cmd": "stop_all"}
      {"cmd": "list"}          ← returns active trackers

    Responses are {"log": "..."} strings.
    """
    await websocket.accept()

    async def log(msg: str):
        await websocket.send_text(json.dumps({"log": msg}))

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            cmd = msg.get("cmd")
            target = msg.get("target", "")

            if cmd == "track":
                result = resolve_handler(target)
                if not result:
                    await log(f"no handler for: {target} — add {target.capitalize()}Handler to tracker.py")
                    continue
                proc, handler_cls = result
                if target.lower() in active_tasks:
                    await log(f"already tracking {target}")
                    continue
                handler = handler_cls(proc, log)
                task = asyncio.create_task(handler.run())
                active_tasks[target.lower()] = task
                await log(f"▶ tracking {target} (pid {proc.pid}) → osc {OSC_HOST}:{OSC_PORT}")

            elif cmd == "stop":
                task = active_tasks.pop(target.lower(), None)
                if task:
                    task.cancel()
                    await log(f"■ stopped {target}")
                else:
                    await log(f"not tracking: {target}")

            elif cmd == "stop_all":
                for task in active_tasks.values():
                    task.cancel()
                active_tasks.clear()
                await log("■ all trackers stopped")

            elif cmd == "list":
                names = list(active_tasks.keys()) or ["none"]
                await log("active: " + ", ".join(names))

            # TODO: cmd "interval" → adjust poll rate of a running tracker
            # TODO: cmd "osc_target" → switch OSC host:port at runtime

    except WebSocketDisconnect:
        for task in active_tasks.values():
            task.cancel()
        active_tasks.clear()

@app.get("/processes")
def list_processes():
    """Process list for REPL autocomplete."""
    out = []
    for p in psutil.process_iter(['pid', 'name']):
        try:
            out.append({"pid": p.info['pid'], "name": p.info['name']})
        except psutil.NoSuchProcess:
            pass
    return sorted(out, key=lambda p: p['name'].lower())

if __name__ == "__main__":
    print(f"tracker → OSC {OSC_HOST}:{OSC_PORT}")
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")
