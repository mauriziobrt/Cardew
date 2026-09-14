<script lang="ts">
	import type { GraphState } from "../graphState.svelte";
	import {
		createTable,
		getCoreRowModel,
		FlexRender,
	} from "@tanstack/svelte-table";

	interface Props {
		graphState: GraphState;
	}
	// Props are defined in main.ts
	let { graphState }: Props = $props();

	var fs = require("fs");
	let snapGraph;

	function saveGraph() {

		snapGraph = JSON.stringify(graphState.snapshot(), null, 2);
		fs.writeFile("/tmp/peppino.json", snapGraph, function (err) {
			if (err) {
				console.log(err);
			}
		});
		alert("peppino.json saved");
	}
</script>

<div class="info-panel">
	<h3>Paper Information</h3>

	{#if graphState.selectedNode}
		<div class="node-details">
			<p><strong>ID:</strong> {graphState.selectedNode.id}</p>
			<p>
				<strong>Description:</strong>
				{graphState.selectedNode.description}
			</p>
			<p>
				<strong>Open Access:</strong>
				{graphState.selectedNode.openacces}
			</p>
			<p>
				<strong>Degree:</strong>
				{graphState.degree[graphState.selectedNode.id]}
			</p>
			<p><strong>Author:</strong> {graphState.selectedNode.user}</p>
			<p><strong>Year:</strong> {graphState.selectedNode.year}</p>
		</div>
	{:else}
		<p class="no-selection">Click a node to see details</p>
	{/if}
	<h3>Last Osc Message</h3>
	<p>{graphState.lastOscMessage}</p>
	<h3>Dataset Information</h3>
	<p>{graphState.statsDataset}</p>
	<button style="cursor: pointer;" onclick={saveGraph}> Save</button>
</div>

<style>
	.info-panel {
		padding: 16px;
		height: 100%;
		overflow-y: auto;
	}

	h3 {
		margin-top: 0;
		margin-bottom: 16px;
	}

	.node-details {
		background: rgba(0, 0, 0, 0.05);
		padding: 12px;
		border-radius: 4px;
	}

	.node-details p {
		margin: 8px 0;
	}

	.no-selection {
		color: #888;
		font-style: italic;
	}
</style>
