<script lang="ts">
	import { Notice } from "obsidian";
	import type { GraphState } from "../../state/graphState.svelte";
	import MetadataPlus from "./PanelMetadataPlus.svelte";
	import PanelEditInputProperty from "./PanelEditInputProperty.svelte";

	interface Props {
		graphState: GraphState;
	}
	// Props are defined in main.ts
	let { graphState }: Props = $props();

	// let creativeEnabled = $state(true);

	// let centerAtNode = $state(true);

	function save() {
		// So it should load the graph with something else
		saveGraph();
		saveConfig();
	}

	function saveGraph() {
		const json = JSON.stringify(graphState.snapshot(), null, 2);
		const blob = new Blob([json], {
			type: "application/json",
		});

		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		link.href = url;
		link.download = "filename.json";
		link.click();

		URL.revokeObjectURL(url);
	}

	function saveConfig() {
		const json = JSON.stringify(
			$state.snapshot(graphState.config.current),
			null,
			2,
		);

		const blob = new Blob([json], {
			type: "application/json",
		});

		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		link.href = url;
		link.download = "filename.json";
		link.click();

		URL.revokeObjectURL(url);
	}

	function loadConfig() {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json,application/json";

		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const configData = JSON.parse(text);

				// Replace this with your GraphState restore/import method.
				// graphState.updateConfig(configData);
				graphState.config.update(configData);
				graphState.physicsOn(graphState.config.current.physicsOn);

				new Notice(`Config loaded: ${file.name}`);
			} catch (error) {
				console.error("Failed to load config:", error);
				new Notice(
					"Failed to config graph. Check the JSON file and import method.",
				);
			}
		};

		input.click();
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
		// if (creativeEnabled) {
		// 	creativeEnabled = false;
		// 	graphState.config.current.creative.modeEnabled = false;
		// } else {
		// 	creativeEnabled = true;
		// 	graphState.config.current.creative.modeEnabled = true;
		// }
	}

	function enableDirection() {
		if (graphState.config.current.directionToggle) {
			graphState.directionOn(true);
		} else {
			graphState.directionOn(false);
		}
	}

	function enablePhysics() {
		if (graphState.config.current.physicsOn) {
			graphState.physicsOn(true);
		} else {
			graphState.physicsOn(false);
		}
	}

	function enableCenterAtNode() {
		// if (centerAtNode) {
		// 	centerAtNode = false;
		// 	//no it should just change a variable at graphState level.
		// 	graphState.config.current.centerAtNode.modeEnabled = false;
		// 	// this.graph.centerAt(this.selectedNode.x, this.selectedNode.y, 300);
		// } else {
		// 	centerAtNode = true;
		// 	graphState.config.current.centerAtNode.modeEnabled = true;
		// 	// this.graph.centerAt(this.selectedNode.x, this.selectedNode.y, 300);
		// }
	}
	function centerGraph() {
		graphState.graph?.centerAt(0, 0);
	}

	function updateTextPropertyDisplay() {
		graphState.updateGraphData();
	}
</script>

<div class="info-panel">
	<PanelEditInputProperty bind:metaName={graphState.config.current.textDisplayProperty} allProperties={graphState.allProperties} onChange={updateTextPropertyDisplay} />

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
			<div class="setting-item-name">Save current config</div>
			<div class="setting-item-description">
				Save current config to json file
			</div>
		</div>
		<div class="setting-item-value">
			<button style="cursor: pointer;" onclick={saveConfig}> Save</button>
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Load a config</div>
			<div class="setting-item-description">
				Load a config from a json file
			</div>
		</div>
		<div class="setting-item-value">
			<button style="cursor: pointer;" onclick={loadConfig}>
				Load
			</button>
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
			<div
				class:is-enabled={graphState.config.current.centerAtNode
					.modeEnabled}
				class="checkbox-container"
			>
				<input
					type="checkbox"
					bind:checked={
						graphState.config.current.centerAtNode.modeEnabled
					}
					onchange={enableCenterAtNode}
				/>
			</div>
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Toggle Directional Links</div>
			<div class="setting-item-description">
				Enable visualization of link directions
			</div>
		</div>
		<div class="setting-item-value">
			<div
				class:is-enabled={graphState.config.current.directionToggle}
				class="checkbox-container"
			>
				<input
					type="checkbox"
					bind:checked={graphState.config.current.directionToggle}
					onchange={enableDirection}
				/>
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
			<div
				class:is-enabled={graphState.config.current.creative
					.modeEnabled}
				class="checkbox-container"
			>
				<input
					type="checkbox"
					bind:checked={
						graphState.config.current.creative.modeEnabled
					}
					onchange={enableCreative}
				/>
			</div>
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Toggle Physics</div>
			<div class="setting-item-description">Enable physics</div>
		</div>
		<div class="setting-item-value">
			<div
				class:is-enabled={graphState.config.current.physicsOn}
				class="checkbox-container"
			>
				<input
					type="checkbox"
					bind:checked={graphState.config.current.physicsOn}
					onchange={enablePhysics}
				/>
			</div>
		</div>
	</div>
</div>
