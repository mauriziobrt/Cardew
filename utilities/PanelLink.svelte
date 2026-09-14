<script>
	let {
		position,
		nodes = $bindable(),
		links,
		otherNode,
		onDelete,
		onEdit,
		onClick,
		onLeave,
	} = $props();
	// So I create a set to store these node_ids[]
	// const node_ids = [...new Set(nodes.map((n) => n.id))];

	let inputValue = $state(otherNode?.id ?? "");

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

	function commitEdit() {
		if (inputValue !== otherNode?.id) {
			onEdit(inputValue);
		}
	}
</script>

<div
	style="display: flex; padding: 10px"
	// class="panel"
	role="presentation"
	onmouseenter={toggleHighlight}
	onmouseleave={toggleHighlightClear}
>
	<div class="setting-item-info">
		<div class="setting-item-name">
			{otherNode?.description}
		</div>
		<div class="setting-item-description">
			{otherNode?.user}
		</div>
	</div>

	<div class="setting-item-control">
		<input
			type="text"
			list="node-ids-{position}"
			bind:value={inputValue}
			onchange={commitEdit}
			placeholder="Search node..."
		/>
		<datalist id="node-ids-{name}">
			{#each nodes.slice(0, 20) as id}
				<option value={id}></option>
			{/each}
		</datalist>

		<input type="number" style="width:3em" bind:value={links.weight} />
		<button style="cursor: pointer;" onclick={() => triggerDelete(links)}
			>delete</button
		>
	</div>
</div>
