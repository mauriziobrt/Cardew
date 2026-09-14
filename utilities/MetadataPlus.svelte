<script>
	let { onAdd, nodeIds = [] } = $props();

	let metaName = $state("");
	let metaValue = $state("");
	function triggerAdd() {
		if (!metaValue && !metaName) return;
		onAdd(metaName, metaValue);
		metaValue = "";
		metaName = "";
	}
</script>

<div class="setting-item">
	<div class="setting-item-info">
		<input type="text" list="all-node-ids" bind:value={metaName} placeholder="Metadata Name" />
		<input type="text" list="all-node-ids" bind:value={metaValue} placeholder="Metadata Value" />
	</div>
	<div class="setting-item-description"></div>
	<div class="setting-item-control">
		<button style="cursor: pointer;" onclick={triggerAdd}>+</button>
	</div>
</div>
