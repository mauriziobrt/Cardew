<!-- FileListModal.svelte -->
<script lang="ts">
	import * as fs from "fs";
	import * as path from "path";
	import type { FileInfo } from "../main";
	import type { GraphState } from "../graphState.svelte";

	interface Props {
		dirPath: string;
		graphState: GraphState;
		onClose: () => void;
	}

	let { dirPath, graphState, onClose }: Props = $props();
	let files = $state<FileInfo[]>([]);
	// svelte-ignore state_referenced_locally
	let currentPath = $state(dirPath);
	let loading = $state(false);
	let error = $state("");

	function loadFiles(dir: string) {
		loading = true;
		error = "";

		try {
			if (!fs.existsSync(dir)) {
				throw new Error("Directory does not exist");
			}

			const items = fs.readdirSync(dir);

			files = items
				.map((item) => {
					const fullPath = path.join(dir, item);
					const stats = fs.statSync(fullPath);

					return {
						name: item,
						path: fullPath,
						size: stats.size,
						modified: stats.mtime,
						isDirectory: stats.isDirectory(),
					};
				})
				.sort((a, b) => {
					if (a.isDirectory && !b.isDirectory) return -1;
					if (!a.isDirectory && b.isDirectory) return 1;
					return a.name.localeCompare(b.name);
				});
		} catch (err: any) {
			error = err.message;
			files = [];
		} finally {
			loading = false;
		}
	}

	function navigateToDirectory(dir: string) {
		currentPath = dir;
		loadFiles(dir);
	}

	function goUp() {
		const parent = path.dirname(currentPath);
		navigateToDirectory(parent);
	}

	function formatSize(bytes: number): string {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return (
			Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
		);
	}

	function handleFileClick(file: FileInfo) {
		if (file.isDirectory) {
			navigateToDirectory(file.path);
		} else {
			// console.log(file.path);
			var obj;
			fs.readFile(file.path, "utf8", (err, data) => {
				if (err) {
					console.error(err);
					return;
				}
				obj = JSON.parse(data);
				graphState.updateData(obj);
				// graphState.graphData = data;
				// console.log(graphState.graph.graphData);
				// graphState.graph.graphData(data);
				// console.log("INSIDE", graphState.graphData);
			});
			// console.log("Inside filemodal", graphState.graphData);
			// close();
		}
	}

	function handleKeyPress(event: KeyboardEvent, file: FileInfo) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleFileClick(file);
		}
	}

	$effect(() => {
		loadFiles(currentPath);
	});
</script>

<div class="file-explorer">
	<div class="header">
		<button onclick={goUp}>↑ Up</button>
		<span class="current-path">{currentPath}</span>
	</div>

	{#if loading}
		<div class="loading">Loading...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else}
		<div class="file-list">
			{#each files as file}
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					class="file-item"
					class:directory={file.isDirectory}
					role={file.isDirectory ? "button" : "listitem"}
					tabindex={file.isDirectory ? 0 : -1}
					onclick={() => handleFileClick(file)}
					onkeypress={(e) => handleKeyPress(e, file)}
				>
					<span class="file-icon">
						{file.isDirectory ? "📁" : "📄"}
					</span>
					<span class="file-name">{file.name}</span>
					{#if !file.isDirectory}
						<span class="file-size">{formatSize(file.size)}</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<button class="close-btn" onclick={onClose}>Close</button>
</div>

<style>
	.file-explorer {
		padding: 1rem;
		min-height: 400px;
		display: flex;
		flex-direction: column;
	}

	.header {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.current-path {
		flex: 1;
		font-family: monospace;
		font-size: 0.9em;
		opacity: 0.7;
	}

	.file-list {
		flex: 1;
		overflow-y: auto;
	}

	.file-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 4px;
		cursor: default;
	}

	.file-item.directory {
		cursor: pointer;
	}

	.file-item.directory:focus {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
	}

	.file-item:hover {
		background: var(--background-modifier-hover);
	}

	.file-name {
		flex: 1;
	}

	.file-size {
		opacity: 0.6;
		font-size: 0.9em;
	}

	.close-btn {
		margin-top: 1rem;
	}

	.error {
		color: var(--text-error);
		padding: 1rem;
	}

	.loading {
		padding: 1rem;
		text-align: center;
		opacity: 0.7;
	}
</style>
