<script lang="ts">
	import Panel from "./Panel.svelte";
	import type { GraphState } from "src/state/graphState.svelte";
	import MetadataPlus from "./PanelMetadataPlus.svelte";
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
	const RESERVED_SET = new Set(RESERVED);

	const allProps = $derived.by(() => {
		const s = new Set<string>();
		for (const n of graphState.graphData?.nodes ?? [])
			for (const k of Object.keys(n)) if (!RESERVED_SET.has(k)) s.add(k);
		return [...s];
	});

	const entries = $derived.by(() => {
		const i = graphState.selectionState.selectedNodeIndex;
		const node = i !== null ? graphState.graphData?.nodes[i] : null;
		if (!node) return [];
		return Object.keys(node)
			.filter((k) => !RESERVED.includes(k))
			.map((k) => [k, node[k]] as const);
	});

	function handleAdd(metaName: string, metaValue: any) {
		if (!graphState.selectionState.selectedNodes[0] || !metaName?.trim())
			return;
		if (RESERVED.includes(metaName)) {
			console.warn(`"${metaName}" is a reserved field`);
			return;
		}
		graphState.selectionState.selectedNodes[0][metaName.trim()] = metaValue;
		graphState.updateGraphData();
	}

	function handleApply(metaName: string) {
		graphState.applyNodeClass(metaName);
		// console.log(metaName)
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter") {
			graphState.createColorScale();
			graphState.updateGraphData();
		}
	}

	const saveClass = () => {
		new ExampleModal(this.app, (result) => {
			new Notice(`Saved new class: ${result}!`);
			graphState.saveNodeAsClass(result, false);
		}).open();
	};

	// const editOSCMetadata = () => {
	// 	new OSCMetadataModal(this.app).open();
	// };

	function handleReset(metaName: string) {
		//Function to clear the metadata of an object
		if (!graphState.selectionState.selectedNodes[0]) return;
		// for each class, set the value to null (depending on)
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
						currentClass={graphState.selectionState
							.selectedNodes[0]}
						fields={Object.keys(graphState.nodeClasses)}
						onEditClass={handleApply}
						{saveClass}
						// editOSC={editOSCMetadata}
					></MetadataMenu>
					<span style="margin:2px"></span>
					{#if graphState.selectionState.selectedNodeIndex !== null && graphState.graphData !== null}
						{@const node =
							graphState.graphData.nodes[
								graphState.selectionState.selectedNodeIndex
							]}
						{#if node}
							{#each entries as [key, value] (key)}
								<Panel
									name={key}
									dict={node}
									onDeleteMetadata={handleDelete}
									onKeydown={handleKeydown}
									allProperties={allProps}
									allPropertyValues={() =>
										graphState.allValuesAtProperty(key)}
								/>
							{/each}
							<datalist id="all-properties-no-reserved">
								{#each allProps.slice(0, 10) as id (id)}
									<option value={id}></option>
								{/each}
							</datalist>
						{/if}
					{/if}
				{/if}
			</div>
		</div>
		<MetadataPlus
			onAdd={handleAdd}
			allProperties={graphState.allProperties}
		/>
	</div>
</div>

<style>
	.metadata-container {
		--metadata-divider-width: 1px;
	}
</style>
