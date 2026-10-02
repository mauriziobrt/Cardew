<script lang="ts">
	import Panel from "./Panel.svelte";
	import type { GraphState } from "src/state/graphState.svelte";
	import MetadataPlus from "../metadata/MetadataPlus.svelte";
	import MetadataMenu from "../metadata/MetadataMenu.svelte";
	import { ExampleModal } from "../../ui/NamingComponent";
    import { Notice, App } from "obsidian";

	interface Props {
		graphState: GraphState;
		app: App;
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
		// "fx",
		// "fy",
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

	function handleAdd(metaName: string, metaValue: any) {
		if (!graphState.selectionState.selectedNodes[0] || !metaName?.trim()) return;
		if (RESERVED.includes(metaName)) {
			console.warn(`"${metaName}" is a reserved field`);
			return;
		}
		graphState.selectionState.selectedNodes[0][metaName.trim()] = metaValue;
	}

	function handleApply(metaName: string) {
		graphState.applyNodeClass(metaName);
		// console.log(metaName)
	}

	const saveClass = () => {
		new ExampleModal(this.app, (result) => {
			new Notice(`Saved new class: ${result}!`);
			graphState.saveNodeAsClass(result, false);
		}).open();
	}

	function handleReset(metaName: string) {
		//Function to clear the metadata of an object
	}

	function handleDelete(metaName: string) {
		if (!graphState.selectionState.selectedNodes[0]) return;
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

<div class="view-content">
	<div class="metadata-container">
		<div class="metadata-content">
			<div class="metadata-properties">
				{#if graphState.nodeClasses !== null}
					<MetadataMenu
						currentClass={graphState.selectionState.selectedNodes[0]}
						fields={Object.keys(graphState.nodeClasses)}
						onEditClass={handleApply}
						saveClass={saveClass}
					></MetadataMenu>
					<span style="margin:2px"></span>
					{#if graphState.selectionState.selectedNodeIndex !== null && graphState.graphData !== null}
						{@const node =
							graphState.graphData.nodes[
								graphState.selectionState.selectedNodeIndex
							]}
						{#if node}
							{#each Object.entries(node).filter(([key]) => !RESERVED.includes(key)) as [key, value]}
								<!-- {#each Object.entries(graphState.graphData.nodes[graphState.selectedNodeIndex]) as [key, value]} -->
								<Panel
									name={key}
									dict={graphState.graphData.nodes[
										graphState.selectionState.selectedNodeIndex
									]}
									onDeleteMetadata={handleDelete}
								/>
							{/each}
						{/if}
					{/if}
				{/if}
			</div>
		</div>
		<MetadataPlus onAdd={handleAdd} />
	</div>
</div>

<style>
	.metadata-container {
		--metadata-divider-width: 1px;
	}
</style>