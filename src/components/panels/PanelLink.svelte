<script>
	import { setIcon } from "obsidian";
	import { onMount } from "svelte";

	let btnEl;

	onMount(() => {
		setIcon(btnEl, "x");
	});
	let {
		position,
		nodes = $bindable(),
		links,
		otherNode,
		onDelete,
		onEdit,
		onClick,
		onLeave,
		selectNode,
		degree,
	} = $props();
	// So I create a set to store these node_ids[]
	// const node_ids = [...new Set(nodes.map((n) => n.id))];

	let inputValue = $derived(otherNode?.id ?? "");

	function triggerDelete(links) {
		//Function that on click of delete returns the index of the element.
		// console.log(links)
		onDelete(links);
	}

	function toggleHighlight(links) {
		// function to toggle when mouseenter the panel
		// console.log(links);
		onClick(links);
	}

	function toggleHighlightClear() {
		// function to toggle when mouseenter the panel
		// console.log(links);
		onLeave();
	}

	function toggleSelect() {
		console.log("TEST");
		selectNode(otherNode);
	}

	function commitEdit() {
		if (inputValue !== otherNode?.id) {
			onEdit(inputValue);
		}
	}

	// function selectOtherLink() {
	// 	selectNode(otherNode);
	// }
</script>

<div class="metadata-property">
	<div class="metadata-property-key">
		<div
			class="setting-item-info"
			role="presentation"
			onmouseenter={toggleHighlight}
			onmousedown={toggleSelect}
			onmouseleave={toggleHighlightClear}
		>
			<div class="setting-item-name">
				{otherNode?.description}
			</div>
			<div class="setting-item-description">
				{otherNode?.user} – Node degree: {degree} - Node id: {inputValue}
			</div>
		</div>
	</div>
	<div class="metadata-property-value">
		weight:
		<input
			class="metadata-input-number"
			type="number"
			style="width:3em"
			bind:value={links.weight}
		/>
		<button
			bind:this={btnEl}
			class="clickable-icon"
			aria-label="Delete connection"
			onclick={() => triggerDelete(links)}
		></button>
		<!-- <button style="cursor: pointer;" onclick={() => triggerDelete(links)}
			>delete</button
		> -->
	</div>
</div>

<style>
	.metadata-property-key {
		width: 55em;
	}
</style>
