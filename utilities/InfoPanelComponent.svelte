<script lang="ts">
	import type { GraphState } from "../graphState.svelte";
	// import {
	// 	createTable,
	// 	getCoreRowModel,
	// 	FlexRender,
	// } from "@tanstack/svelte-table";

	interface Props {
		graphState: GraphState;
	}
	// Props are defined in main.ts
	let { graphState }: Props = $props();

	let creativeEnabled = $state(true);
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

	function enableCreative() {
		if (creativeEnabled) {
			creativeEnabled = false;
			graphState.config.current.creative.modeEnabled = false;
		} else {
			creativeEnabled = true;
			graphState.config.current.creative.modeEnabled = true;
		}
	}
	function centerGraph() {
		graphState.graph?.centerAt(0,0);
	}
</script>

<div class="info-panel">
	<!-- <h3>Paper Information</h3>

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
	{/if} -->
	<!-- <h3>Last Osc Message</h3>
	<p>{graphState.lastOscMessage}</p> -->
	<!-- <h3>Dataset Information</h3> -->
	<!-- <p>{graphState.statsDataset}</p> -->
	<!-- <div class="setting-title">State</div> -->
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Toggle Creative Mode</div>
			<div class="setting-item-description">
				Enable node creation and editing
			</div>
		</div>
		<div class="setting-item-value">
			<div class:is-enabled={creativeEnabled} class="checkbox-container">
				<input type="checkbox" onchange={enableCreative} />
			</div>
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Save current graph</div>
			<div class="setting-item-description">
				Save graph state to a json file
			</div>
		</div>
		<div class="setting-item-value">
			<button style="cursor: pointer;" onclick={saveGraph}> Save</button>
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Center Graph</div>
			<div class="setting-item-description">
				Center Graph to Origin
			</div>
		</div>
		<div class="setting-item-value">
			<button style="cursor: pointer;" onclick={centerGraph}> Center</button>
		</div>
	</div>
</div>

