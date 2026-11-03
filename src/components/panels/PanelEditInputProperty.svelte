<script>
	// let { allProperties } = $props();
	// let metaName = $state("");
	let { metaName = $bindable(), allProperties, onChange } = $props();
</script>
<div>
<input
	class="metadata-property-key-input"
	type="text"
	list="metadata-property-list-info"
	enterkeyhint="next"
	bind:value={metaName}
	placeholder="Metadata Name"
	onchange={onChange}
/>
<datalist id="metadata-property-list-info">
	{#each allProperties.slice(0, 10) as id}
		<option value={id}></option>
	{/each}
</datalist>
</div>