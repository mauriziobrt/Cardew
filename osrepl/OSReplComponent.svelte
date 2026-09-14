<script lang="ts">
// OSReplComponent.svelte
// Drop-in alongside ForceGraphComponent — same mount/unmount pattern.

import { onMount, onDestroy, tick } from 'svelte';
import type { OSReplState } from './osreplState.svelte';

interface Props {
	replState: OSReplState;
}

let { replState }: Props = $props();

let editorEl: HTMLTextAreaElement;
let logEl: HTMLDivElement;
let editorValue = $state('');
let isEvaluating = $state(false);
let suggestions = $state<string[]>([]);

// Auto-scroll log on new entries
$effect(() => {
	replState.log; // subscribe
	tick().then(() => {
		if (logEl) logEl.scrollTop = logEl.scrollHeight;
	});
});

// Shift+Enter → eval, Enter → newline (SuperCollider feel)
function onKeyDown(e: KeyboardEvent) {
	if (e.key === 'Enter' && e.shiftKey) {
		e.preventDefault();
		evaluate();
	}
	// Ctrl+. → stop all (SuperCollider convention)
	if (e.key === '.' && e.ctrlKey) {
		e.preventDefault();
		replState.stopAll();
	}
}

async function evaluate() {
	const code = editorValue.trim();
	if (!code || isEvaluating) return;
	isEvaluating = true;
	await replState.eval(code);
	isEvaluating = false;
	// TODO: decide whether to clear editor after eval — comment out to keep
	// editorValue = '';
}

// Colour per log kind
function kindClass(kind: string) {
	return {
		input:  'repl-input',
		output: 'repl-output',
		error:  'repl-error',
		system: 'repl-system',
	}[kind] ?? 'repl-output';
}

// onMount(async () => {
//     suggestions = await replState.fetchProcesses();
//     editorEl?.focus();
// });

onMount(() => editorEl?.focus());
</script>

<div class="osrepl-container">

	<!-- ── Log pane ─────────────────────────────────────────────────────── -->
	<div class="repl-log" bind:this={logEl}>
		{#if replState.log.length === 0}
			<div class="repl-hint">
				Shift+Enter to eval · Ctrl+. to stop all · <code>nuclear unlock</code> for rm/kill
			</div>
		{/if}
		{#each replState.log as entry (entry.time + entry.text)}
			<div class="repl-line {kindClass(entry.kind)}">
				<span class="repl-time">{entry.time}</span>
				<span class="repl-text">{entry.text}</span>
			</div>
		{/each}
	</div>

	<!-- ── Active jobs badge strip ───────────────────────────────────────── -->
	{#if Object.keys(replState.jobs).length > 0}
		<div class="repl-jobs">
			{#each Object.values(replState.jobs) as job}
				<button
					class="job-badge"
					onclick={() => replState.stopJob(job.id)}
					title="click to stop"
				>
					▶ {job.id}
				</button>
			{/each}
		</div>
	{/if}

	<!-- ── Editor pane ───────────────────────────────────────────────────── -->
	<div class="repl-editor-wrap">
		<textarea
			bind:this={editorEl}
			bind:value={editorValue}
			class="repl-editor"
			spellcheck={false}
			placeholder={"Max save every 5s\nFinder open in 10s\ntrack Max → osc 57120\nstop all"}
			onkeydown={onKeyDown}
			rows={15}
		></textarea>
		<div class="repl-toolbar">
			{#if replState.nuclearUnlocked}
				<span class="nuclear-badge">🔴 nuclear</span>
			{/if}
			<button class="eval-btn" onclick={evaluate} disabled={isEvaluating}>
				{isEvaluating ? '…' : 'eval'}
			</button>
		</div>
	</div>

</div>

<style>
/* Inherits Obsidian CSS vars so it fits any theme automatically */
.osrepl-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	background: var(--background-primary);
	font-family: var(--font-monospace);
	font-size: var(--font-smaller);
	color: var(--text-normal);
	overflow: hidden;
}

/* Log */
.repl-log {
	flex: 1;
	overflow-y: auto;
	padding: 8px 12px;
	border-bottom: 1px solid var(--background-modifier-border);
}

.repl-hint {
	color: var(--text-faint);
	padding: 4px 0;
}

.repl-line {
	display: flex;
	gap: 10px;
	padding: 1px 0;
	line-height: 1.5;
}

.repl-time { color: var(--text-faint); flex-shrink: 0; }
.repl-text  { white-space: pre-wrap; word-break: break-all; }

.repl-input  .repl-text { color: var(--color-cyan); }
.repl-output .repl-text { color: var(--text-normal); }
.repl-error  .repl-text { color: var(--color-red); }
.repl-system .repl-text { color: var(--text-faint); font-style: italic; }

/* Jobs strip */
.repl-jobs {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
	padding: 4px 12px;
	border-bottom: 1px solid var(--background-modifier-border);
}

.job-badge {
	background: var(--background-modifier-hover);
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	padding: 1px 7px;
	font-size: var(--font-smaller);
	color: var(--text-muted);
	cursor: pointer;
}
.job-badge:hover { color: var(--color-red); border-color: var(--color-red); }

/* Editor */
.repl-editor-wrap {
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
}

.repl-editor {
	width: 100%;
	background: var(--background-secondary);
	color: var(--text-normal);
	border: none;
	border-top: 1px solid var(--background-modifier-border);
	padding: 10px 12px;
	resize: none;
	font-family: var(--font-monospace);
	font-size: var(--font-smaller);
	outline: none;
	line-height: 1.6;
	box-sizing: border-box;
}

.repl-toolbar {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	padding: 4px 8px;
	background: var(--background-secondary);
	border-top: 1px solid var(--background-modifier-border);
}

.nuclear-badge {
	font-size: var(--font-smaller);
	color: var(--color-red);
}

.eval-btn {
	background: var(--interactive-accent);
	color: var(--text-on-accent);
	border: none;
	border-radius: 4px;
	padding: 2px 14px;
	font-family: var(--font-monospace);
	font-size: var(--font-smaller);
	cursor: pointer;
}
.eval-btn:disabled { opacity: 0.5; cursor: default; }
</style>
