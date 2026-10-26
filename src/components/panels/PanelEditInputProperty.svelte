<script>
	// let { allProperties } = $props();
	// let metaName = $state("");
	let { metaName = $bindable(), allProperties, onChange } = $props();
</script>

<div class="metadata-property">
	<span class="metadata-property-icon"></span>
	<input
		class="metadata-property-key-input"
		type="text"
		list="metadata-property-list"
		enterkeyhint="next"
		bind:value={metaName}
		placeholder="Metadata Name"
        onchange={onChange}
	/>
	<datalist id="metadata-property-list">
		{#each allProperties.slice(0, 10) as id}
			<option value={id}></option>
		{/each}
	</datalist>
</div>
<span style="margin:5px"></span>