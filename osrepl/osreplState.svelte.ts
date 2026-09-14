// osreplState.svelte.ts
// Mirrors the graphState pattern — instantiated once in the plugin, passed as prop.

import { exec } from 'child_process';
import type { OSCManager } from 'osc/osc'; // reuse your existing OSCManager

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Job {
	id: string;          // "{software}:{action}"
	description: string;
	timer: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;
}

export interface LogEntry {
	time: string;
	text: string;
	kind: 'input' | 'output' | 'error' | 'system';
}

// ── State class ───────────────────────────────────────────────────────────────

export class OSReplState {
	// Svelte 5 runes — reactive for the UI
	// log = $state<LogEntry[]>([]);
	// jobs = $state<Record<string, Job>>({});
	log = <LogEntry[]>([])
	jobs = <Record<string, Job>>({});
	// nuclearUnlocked = $state(false);
	oscManager: OSCManager;

	constructor(oscManager: OSCManager) {
		this.oscManager = oscManager;
	}

	// ── Logging ───────────────────────────────────────────────────────────────

	write(text: string, kind: LogEntry['kind'] = 'output') {
		this.log.push({
			time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
			text,
			kind
		});
		// Keep log bounded — TODO: make limit configurable
		if (this.log.length > 500) this.log.shift();
	}

	// –– AutoComplete –––––––––––
	async fetchProcesses(): Promise<string[]> {
		const res = await fetch('http://localhost:8765/processes');
		const procs = await res.json();
		return procs.map((p: any) => p.name);
	}
	// –– WS –––––––––––
	private trackerWS: WebSocket | null = null;

	private ensureTracker() {
		if (this.trackerWS?.readyState === WebSocket.OPEN) return;
		this.trackerWS = new WebSocket('ws://localhost:8765/ws');
		this.trackerWS.onmessage = (e) => {
			const { log } = JSON.parse(e.data);
			if (log) this.write(log);
		};
		this.trackerWS.onerror = () => this.write('tracker.py not running', 'error');
	}

	private trackerSend(msg: object) {
		this.ensureTracker();
		// Queue if not yet open
		if (this.trackerWS!.readyState === WebSocket.CONNECTING) {
			this.trackerWS!.addEventListener('open', () =>
				this.trackerWS!.send(JSON.stringify(msg)), { once: true });
		} else {
			this.trackerWS!.send(JSON.stringify(msg));
		}
	}
	// ── OS actions ────────────────────────────────────────────────────────────

	private osascript(script: string): Promise<string> {
		return new Promise((resolve, reject) => {
			exec(`osascript -e '${script.replace(/'/g, "\\'")}'`, (err, stdout) => {
				if (err) reject(err);
				else resolve(stdout.trim());
			});
		});
	}

	async doSave(software: string) {
		await this.osascript(
			`tell application "${software}" to activate`
		);
		await this.osascript(
			`tell application "System Events" to keystroke "s" using command down`
		);
		return `saved ${software}`;
	}

	async doOpen(software: string) {
		await this.osascript(`tell application "${software}" to activate`);
		return `opened ${software}`;
	}

	async doClose(software: string) {
		await this.osascript(`tell application "${software}" to close front window`);
		return `closed front window of ${software}`;
	}

	// async doKill(software: string) {
	// 	if (!this.nuclearUnlocked) return '⚠ nuclear tier locked';
	// 	await this.osascript(`tell application "${software}" to quit`);
	// 	return `killed ${software}`;
	// }

	// async doRm(target: string) {
	// 	if (!this.nuclearUnlocked) return '⚠ nuclear tier locked';
	// 	return new Promise<string>((resolve) => {
	// 		exec(`rm -rf "${target}"`, (err) => {
	// 			resolve(err ? `rm error: ${err.message}` : `rm ${target}`);
	// 		});
	// 	});
	// }

	// TODO: add doMove(src, dst), doType(software, text), doScreenshot(), ...

	// ── Process tracking (psutil equivalent) ─────────────────────────────────

	// doTrack(software: string, oscAddress = '/process') {
	// 	// Find PID, then poll CPU/mem and stream via OSC
	// 	exec(`pgrep -x "${software}"`, (err, stdout) => {
	// 		const pid = stdout.trim();
	// 		if (!pid) { this.write(`no PID for ${software}`, 'error'); return; }

	// 		const jobId = `${software}:track`;
	// 		const timer = setInterval(() => {
	// 			exec(`ps -p ${pid} -o %cpu=,%mem=`, (e, out) => {
	// 				if (e) return;
	// 				const [cpu, mem] = out.trim().split(/\s+/).map(Number);
	// 				// Reuse your existing OSCManager
	// 				this.oscManager?.send(oscAddress + '/cpu', cpu);
	// 				this.oscManager?.send(oscAddress + '/mem', mem);
	// 				// TODO: add more ps fields — threads, open files, etc.
	// 			});
	// 		}, 100); // 100ms poll — TODO: make configurable

	// 		this.registerJob(jobId, `track ${software} → osc ${oscAddress}`, timer);
	// 	});
	// }

	doTrack(software: string) {
		this.trackerSend({ cmd: 'track', target: software });
		// Job entry is log-only — stopping is also via WS
		this.jobs[`${software}:track`] = {
			id: `${software}:track`,
			description: `track ${software} → python`,
			timer: null as any
		};
	}

	// ── Job management ────────────────────────────────────────────────────────

	registerJob(id: string, description: string, timer: Job['timer']) {
		// Cancel existing if same id (replace_existing)
		this.stopJob(id);
		this.jobs[id] = { id, description, timer };
		this.write(`▶ ${id} — ${description}`, 'system');
	}

	// stopJob(id: string) {
	// 	const job = this.jobs[id];
	// 	if (!job) return false;
	// 	clearInterval(job.timer as any);
	// 	clearTimeout(job.timer as any);
	// 	delete this.jobs[id];
	// 	this.write(`■ stopped ${id}`, 'system');
	// 	return true;
	// }

	stopJob(id: string) {
		const job = this.jobs[id];
		if (!job) return false;

		if (id.endsWith(':track')) {
			const software = id.replace(':track', '');
			this.trackerSend({ cmd: 'stop', target: software });
		} else {
			clearInterval(job.timer as any);
			clearTimeout(job.timer as any);
		}

		delete this.jobs[id];
		this.write(`■ stopped ${id}`, 'system');
		return true;
	}

	stopAll() {
		Object.keys(this.jobs).forEach(id => this.stopJob(id));
		this.write('■ all jobs stopped', 'system');
	}

	// ── Eval entry point (called by the Svelte component) ────────────────────

	async eval(input: string) {
		const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
		for (const line of lines) {
			if (line.startsWith('#')) continue;
			this.write(`» ${line}`, 'input');
			const result = await this.parseLine(line);
			if (result) this.write(result);
		}
	}

	// ── Parser ────────────────────────────────────────────────────────────────
	// Hand-rolled for now — TODO: replace with a proper PEG grammar (nearley/ohm-js)
	// Grammar: {software} {action} every {n} {unit}
	//          {software} {action} in {n} {unit}
	//          track {software} → osc {port}
	//          stop {software} {action} | stop all
	//          nuclear unlock

	private async parseLine(line: string): Promise<string> {
		const units: Record<string, number> = {
			s: 1, sec: 1, seconds: 1,
			m: 60, min: 60, minutes: 60,
			h: 3600, hours: 3600
		};

		const actions: Record<string, (sw: string) => Promise<string>> = {
			save: sw => this.doSave(sw),
			open: sw => this.doOpen(sw),
			close: sw => this.doClose(sw),
			// kill:  sw => this.doKill(sw),
		};

		if (line === 'nuclear unlock') {
			this.nuclearUnlocked = true;
			return '🔴 nuclear tier unlocked';
		}

		if (line === 'stop all') { this.stopAll(); return ''; }

		// stop {software} {action}
		let m = line.match(/^stop (\w+) (\w+)$/);
		if (m) {
			const ok = this.stopJob(`${m[1]}:${m[2]}`);
			return ok ? '' : `no job: ${m[1]}:${m[2]}`;
		}

		// track {software} [→ osc {port}]
		m = line.match(/^track (\w+)(?:\s*[→>]\s*osc\s*(\d+))?$/);
		if (m) {
			const addr = m[2] ? `/${m[1]}` : '/process';
			// TODO: use port m[2] to instantiate a separate OSC client if needed
			this.doTrack(m[1], addr);
			return '';
		}

		// {software} {action} every {n} {unit}
		m = line.match(/^(\w+)\s+(\w+)\s+every\s+(\d+)\s*(\w+)$/);
		if (m) {
			const [, sw, action, n, unit] = m;
			const fn = actions[action];
			if (!fn) return `unknown action: ${action}`;
			const ms = parseInt(n) * (units[unit] ?? 1) * 1000;
			const timer = setInterval(async () => {
				const r = await fn(sw);
				this.write(`[${new Date().toLocaleTimeString('en-GB', { hour12: false })}] ${r}`);
			}, ms);
			this.registerJob(`${sw}:${action}`, `${action} ${sw} every ${n}${unit}`, timer);
			return '';
		}

		// {software} {action} in {n} {unit}  (one-shot)
		m = line.match(/^(\w+)\s+(\w+)\s+in\s+(\d+)\s*(\w+)$/);
		if (m) {
			const [, sw, action, n, unit] = m;
			const fn = actions[action];
			if (!fn) return `unknown action: ${action}`;
			const ms = parseInt(n) * (units[unit] ?? 1) * 1000;
			const timer = setTimeout(async () => {
				const r = await fn(sw);
				this.write(`${r}`);
				delete this.jobs[`${sw}:${action}:once`];
			}, ms);
			this.registerJob(`${sw}:${action}:once`, `${action} ${sw} in ${n}${unit}`, timer);
			return '';
		}

		// TODO: {software} {action} when cpu > {n}  — conditional polling branch

		return `parse error: ${line}`;
	}

	close() {
		this.stopAll();
		this.trackerWS?.close();
	}
}

export function createOSReplState(oscManager: OSCManager): OSReplState {
	return new OSReplState(oscManager);
}
