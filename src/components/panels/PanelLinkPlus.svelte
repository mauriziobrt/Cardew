<script>
	// import TriStateToggle from "./TriStateToggle.svelte";
	import { setIcon } from "obsidian";
	import { onMount } from "svelte";

	let searchEl;

	onMount(() => {
		setIcon(searchEl, "search");
	});
	let direction = $state("both");
	let { onAdd, nodeIds = [] } = $props();

	let targetId = $state("");
	function triggerAdd() {
		if (!targetId) return;
		onAdd(targetId);
		targetId = "";
	}
</script>

<div class="metadata-property">
	<div class="metadata-property-value">
		<div class="metadata-property-icon">
			<span bind:this={searchEl} aria-label="Search Nodes"></span>
		</div>
		<!-- <div class="search-input-container"> -->
		<input
			class="metadata-input-longtext"
			type="text"
			list="all-node-ids"
			bind:value={targetId}
			placeholder="Connect to node..."
		/>
		<datalist id="all-node-ids">
			{#each nodeIds.slice(0, 50) as id}
				<option value={id}></option>
			{/each}
		</datalist>
		<!-- </div> -->
	</div>
</div>
<div class="metadata-add-button.text-icon-button">
	<div class="text-icon-button">
		<button style="cursor: pointer;" onclick={triggerAdd}>
			<span class="text-button-label">+ Add Connection </span>
		</button>
	</div>
</div>
