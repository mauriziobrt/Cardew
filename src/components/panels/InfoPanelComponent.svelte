<script lang="ts">
	import { Notice } from "obsidian";
	import type { GraphState } from "../../state/graphState.svelte";

	interface Props {
		graphState: GraphState;
	}
	// Props are defined in main.ts
	let { graphState }: Props = $props();

	let creativeEnabled = $state(true);
	let centerAtNode = $state(true);
	let snapGraph;

	function saveGraph() {
		const json = JSON.stringify(graphState.snapshot(), null, 2);
		const blob = new Blob([json], {
			type: "application/json",
		});

		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		link.href = url;
		link.download = "peppino.json";
		link.click();

		URL.revokeObjectURL(url);
	}

	function loadGraph() {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json,application/json";

		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const graphData = JSON.parse(text);

				// Replace this with your GraphState restore/import method.
				graphState.updateData(graphData);

				new Notice(`Graph loaded: ${file.name}`);
			} catch (error) {
				console.error("Failed to load graph:", error);
				new Notice(
					"Failed to load graph. Check the JSON file and import method.",
				);
			}
		};

		input.click();
	}

	// function saveGraph() {
	// 	const fs = require("fs");

	// 	snapGraph = JSON.stringify(graphState.snapshot(), null, 2);
	// 	fs.writeFile("/tmp/peppino.json", snapGraph, function (err) {
	// 		if (err) {
	// 			console.log(err);
	// 		}
	// 	});
	// 	alert("peppino.json saved");
	// }

	function enableCreative() {
		if (creativeEnabled) {
			creativeEnabled = false;
			graphState.config.current.creative.modeEnabled = false;
		} else {
			creativeEnabled = true;
			graphState.config.current.creative.modeEnabled = true;
		}
	}

	function enableCenterAtNode() {
		if (centerAtNode) {
			centerAtNode = false;
			//no it should just change a variable at graphState level.
			graphState.config.current.centerAtNode.modeEnabled = false;
			// this.graph.centerAt(this.selectedNode.x, this.selectedNode.y, 300);
		} else {
			centerAtNode = true;
			graphState.config.current.centerAtNode.modeEnabled = true;
			// this.graph.centerAt(this.selectedNode.x, this.selectedNode.y, 300);
		}
	}
	function centerGraph() {
		graphState.graph?.centerAt(0, 0);
	}
</script>

<div class="info-panel">
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
			<div class="setting-item-name">Load a graph</div>
			<div class="setting-item-description">
				Load a graph from a json file
			</div>
		</div>
		<div class="setting-item-value">
			<button style="cursor: pointer;" onclick={loadGraph}> Load </button>
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Center Graph</div>
			<div class="setting-item-description">Center Graph to Origin</div>
		</div>
		<div class="setting-item-value">
			<button style="cursor: pointer;" onclick={centerGraph}>
				Center</button
			>
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Center at Node</div>
			<div class="setting-item-description">
				Center position at Selected Node
			</div>
		</div>
		<div class="setting-item-value">
			<div class:is-enabled={centerAtNode} class="checkbox-container">
				<input type="checkbox" onchange={enableCenterAtNode} />
			</div>
		</div>
	</div>
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
</div>
