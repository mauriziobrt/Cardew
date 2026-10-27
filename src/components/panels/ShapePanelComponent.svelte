<script lang="ts">
	import type { GraphState } from "src/state/graphState.svelte";
	import ShapePopover from "./ShapePopover.svelte";
	import { untrack } from "svelte";
	import { Notice } from "obsidian";

	//it should save the current state
	//to save the state and have it working effectively I need to first check the config part

	interface Props {
		allProperties: string[]; //for now, later it should just have access to an OSC config file
		allValuesAtProperty: (property: string) => string[];
		onSave: () => Promise<void>;
		onClose: () => void;
		graphState: GraphState;
	}

	let {
		allProperties,
		allValuesAtProperty,
		onSave,
		onClose,
		graphState,
	}: Props = $props();

	let currentProperty = $state(
		untrack(() => graphState.config.current.mappings?.property ?? ""),
	);

	// let mappingPool: Mapping[] = $state([
	// 	{ value: "null", shape: "circle", color: "#e66465" },
	// ]);

	let mappingPool = $state(
		structuredClone(
			$state.snapshot(graphState.config.current.mappings.rules),
		),
	);

	function addMapping() {
		mappingPool.push({ value: "", shape: "circle", color: "#e66465" });
	}

	async function save() {
		graphState.config.updateMappings({
			property: currentProperty,
			rules: $state.snapshot(mappingPool),
		});
		await onSave();
	}

	function noticeDev() {
		new Notice("Feature currently in development!");
	}
</script>

<div class="vertical-tab-content">
	<h2>Node shape mapping and editor</h2>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Map property to shapes</div>
			<div class="setting-item-description">
				Choose which property to map to shapes
			</div>
		</div>
		<div class="setting-item-control">
			<input
				type="text"
				list="all-properties-no-reserved"
				bind:value={currentProperty}
			/>
			<datalist id="all-properties-no-reserved">
				{#each allProperties.slice(0, 10) as id}
					<option value={id}></option>
				{/each}
			</datalist>
		</div>
	</div>
	{#each mappingPool as el, i}
		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-description">
					<input
						type="text"
						list="all-values-property-{i}"
						bind:value={el.value}
						style="margin:2px"
					/>
					<datalist id="all-values-property-{i}">
						{#each graphState
							.allValuesAtProperty(currentProperty)
							.slice(0, 10) as id}
							<option value={id}></option>
						{/each}
					</datalist>
				</div>
			</div>
			<div class="setting-item-control" style="margin:5px">
				<ShapePopover bind:value={el.shape} {i} />
				<input
					type="color"
					id="foreground"
					name="foreground"
					bind:value={el.color}
					style=" border-radius: 100%; inline-size: 30px; block-size: 30px; border-width: 1px; border-style: solid; border-color: rgb(153, 153, 153);"
				/>
			</div>
		</div>
	{/each}
	<div class="metadata-add-button.text-icon-button">
		<div class="text-icon-button">
			<button style="cursor: pointer;" onclick={addMapping}>
				<span class="text-button-label">+ Add Mapping</span>
			</button>
		</div>
		<div class="text-icon-button">
			<button style="cursor: pointer;" onclick={save}>
				<span class="text-button-label">Save Mapping</span>
			</button>
		</div>
		<div class="text-icon-button">
			<button style="cursor: pointer;" onclick={noticeDev}>
				<span class="text-button-label">Load Mapping</span>
			</button>
		</div>
	</div>
</div>
