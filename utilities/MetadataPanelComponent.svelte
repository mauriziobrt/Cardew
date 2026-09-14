<script lang="ts">
	import Sortable from "sortablejs";
	import { onMount } from "svelte";
	import Panel from "./Panel.svelte";
	import Panelplus from "./Panelplus.svelte";
	import type { GraphState } from "graphState.svelte";
	import MetadataPlus from "./MetadataPlus.svelte";
	// import PanelNodes from "./PanelNodes.svelte";

	let foo: HTMLElement;

	onMount(async function () {
		// it is needed for each group
		Sortable.create(foo, {
			group: {
				name: "foo",
				put: true,
				// 				pull: false,
			},
			animation: 200,
		});
	});

	interface Props {
		graphState: GraphState;
	}

	// Props are defined in main.ts
	let { graphState }: Props = $props();

	const RESERVED = [
		"x",
		"y",
		"vx",
		"vy",
		"index",
		"__indexColor",
		"vx",
		"vy",
		"fx",
		"fy",
		"__initialDragPos",
		"__dragged",
	];

	const RESERVEDEXTRA = [
		"id",
		"name",
		"x",
		"y",
		"vx",
		"vy",
		"index",
		"__indexColor",
		"vx",
		"vy",
		"fx",
		"fy",
		"__initialDragPos",
		"__dragged",
	];

	function handleAdd(metaName, metaValue) {
		if (!graphState.selectedNode || !metaName?.trim()) return;
		if (RESERVED.includes(metaName)) {
			console.warn(`"${metaName}" is a reserved field`);
			return;
		}
		graphState.selectedNode[metaName.trim()] = metaValue;
	}

	function handleDelete(metaName) {
		if (!graphState.selectedNode) return;
		// console.log(graphState.selectedNode[metaName]);
		if (RESERVEDEXTRA.includes(metaName)) {
			alert(
				`ATTENTION, "${metaName} " is reserved field and can't be deleted`,
			);
			return;
		}
		if (confirm("Press a button!\nEither OK or Cancel.")) {
			graphState.removeMetadata(metaName);
		} else {
			return;
		}
	}
</script>

<!-- <h1 class="setting-title">Metadata</h1> -->
<div class="view-content">
	<div class="metadata-container">
		<div class="metadata-content">
			<div class="metadata-properties">
				<!-- {#each Object.entries(graphState.selectedNode ?? {}) as [key]}
		<Panel name={key} bind:dict={graphState.selectedNode} /> -->
				<!-- <Panel name={key} bind:dict={graphState.selectedNode} /> -->
				<!-- {/each} -->

				{#if graphState.selectedNodeIndex !== null}
					{@const node =
						graphState.graphData.nodes[
							graphState.selectedNodeIndex
						]}
					{#each Object.entries(node).filter(([key]) => !RESERVED.includes(key)) as [key, value]}
						<!-- {#each Object.entries(graphState.graphData.nodes[graphState.selectedNodeIndex]) as [key, value]} -->
						<Panel
							name={key}
							dict={graphState.graphData.nodes[
								graphState.selectedNodeIndex
							]}
							onDeleteMetadata={handleDelete}
						/>
					{/each}
				{/if}
			</div>
		</div>
		<MetadataPlus onAdd={handleAdd} />
	</div>
</div>

<style>
.metadata-container{
	--metadata-divider-width: 1px;
}
</style>