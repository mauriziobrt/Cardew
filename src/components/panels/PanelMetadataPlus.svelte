<script>
	let { onAdd, allProperties } = $props();

	let metaName = $state("");
	let metaValue = $state("");
	function triggerAdd() {
		if (!metaValue && !metaName) return;
		onAdd(metaName, metaValue);
		metaValue = "";
		metaName = "";
	}

	//Maybe it's suggest modal?
</script>

<div class="metadata-property">
	<div class="metadata-property-key">
		<span class="metadata-property-icon"></span>
		<input
			class="metadata-property-key-input"
			type="text"
			list="metadata-property-list"
			enterkeyhint="next"
			bind:value={metaName}
			placeholder="Metadata Name"
		/>
		<datalist id="metadata-property-list">
			{#each allProperties.slice(0, 10) as id}
				<option value={id}></option>
			{/each}
		</datalist>
	</div>
	<div class="metadata-property-value">
		<input
			class="metadata-input-text"
			type="text"
			list="metadata-value-list"
			enterkeyhint="next"
			bind:value={metaValue}
			placeholder="Metadata Value"
		/>
	</div>
</div>

<div class="metadata-add-button.text-icon-button">
	<div class="text-icon-button">
		<button style="cursor: pointer;" onclick={triggerAdd}>
			<span class="text-button-label">+ Add Property </span>
		</button>
	</div>
</div>
