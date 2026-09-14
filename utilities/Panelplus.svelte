<script>
	import TriStateToggle from "./TriStateToggle.svelte";
	let direction = $state("both");
	let { onAdd, nodeIds = [] } = $props();

	let targetId = $state("");
	function triggerAdd() {
		if (!targetId) return;
		onAdd(targetId);
		targetId = "";
	}
</script>

<div class="setting-item">
	<div class="setting-item-name">
		<div class="search-input-container">
			<input
				type="text"
				list="all-node-ids"
				bind:value={targetId}
				placeholder="Connect to node..."
			/>
			<datalist id="all-node-ids">
				{#each nodeIds.slice(0, 20) as id}
					<option value={id}></option>
				{/each}
			</datalist>
		</div>
	</div>
	<div class="setting-item-description"></div>

	<div class="setting-item-control">
		<TriStateToggle bind:value={direction} />
		<button style="cursor: pointer;" onclick={triggerAdd}>+</button>
	</div>
</div>
