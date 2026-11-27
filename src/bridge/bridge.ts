// Claude bloat code, need to check whether it is consistent
// Owns the WebSocket to FastAPI. Everything else in the plugin only calls
// bridge.send(...) and bridge.onCommand(...).

type Handler = (msg: any) => void;

// this I should change with a top level reserved block
const D3_FIELDS = [
	"x",
	"y",
	"vx",
	"vy",
	"fx",
	"fy",
	"index",
	"__indexColor",
	"__initialDragPos",
	"__dragged",
];

export class Bridge {
	private ws: WebSocket | null = null;
	private retry = 0;
	private handlers: Handler[] = [];
	private closed = false;
	connected = false; // wire this to a status indicator in the UI

	constructor(
		private url = "ws://127.0.0.1:8000/ws",
		// called on every (re)connect so both graphs agree
		private getSnapshot: () => { nodes: any[]; links: any[] } | null = () =>
			null,
	) {}

	connect() {
		this.closed = false;
		this.ws = new WebSocket(this.url);

		this.ws.onopen = () => {
			this.connected = true;
			this.retry = 0;
			this.sendSnapshot();
		};

		this.ws.onmessage = (e) => {
			try {
				const msg = JSON.parse(e.data);
				this.handlers.forEach((h) => h(msg));
			} catch (err) {
				console.warn("bridge: bad message", err);
			}
		};

		this.ws.onclose = () => {
			this.connected = false;
			if (this.closed) return;
			// exponential backoff, capped at 5s
			const delay = Math.min(500 * 2 ** this.retry++, 5000);
			setTimeout(() => this.connect(), delay);
		};

		this.ws.onerror = () => this.ws?.close();
	}

	// Fail soft: if disconnected, drop the event. The plugin keeps working.
	send(event: Record<string, any>) {
		if (this.ws?.readyState !== WebSocket.OPEN) return;
		this.ws.send(JSON.stringify({ v: 1, ...event }));
	}

	sendSnapshot() {
		const g = this.getSnapshot();
		if (!g) return;
		this.send({
			type: "snapshot",
			nodes: g.nodes.map(toWireNode),
			links: g.links.map((l) => ({
				source: String(l.source?.id ?? l.source),
				target: String(l.target?.id ?? l.target),
				...(l.type ? { type: l.type } : {}),
			})),
		});
	}

	// Commands coming back from the API (originally from SC/Max)
	onCommand(h: Handler) {
		this.handlers.push(h);
	}

	close() {
		this.closed = true;
		this.ws?.close();
	}
}

// Strip d3 internals, force string ids. Add x/y back as explicit fields if they carry meaning.
export function toWireNode(n: any) {
	const out: Record<string, any> = { id: String(n.id) };
	for (const k in n) {
		if (k === "id" || D3_FIELDS.includes(k)) continue;
		out[k] = n[k];
	}
	out.pos = { x: n.fx ?? n.x, y: n.fy ?? n.y };
	return out;
}
