<script>
	import { Menu } from "obsidian";
	import { slide } from "svelte/transition";
	import { setIcon } from "obsidian";
	import { onMount } from "svelte";

	let btnEl;

	onMount(() => {
		setIcon(btnEl, "x");
	});
	let { name, dict = $bindable(), onDeleteMetadata } = $props();

	function triggerDelete(test) {
		onDeleteMetadata(test);
		// reset targetId after use
	}
	// let { name, dict = $bindable(), node = $bindable() } = $props();
	// svelte-ignore non_reactive_update

	// svelte-ignore non_reactive_update
	// let expand = $state(false);

	function openMenu(event) {
		const menu = new Menu();
		menu.addItem((item) =>
			item
				.setTitle("Open Access")
				.setIcon("pencil")
				.onClick(() => console.log("clicked 1")),
		);
		menu.addItem((item) =>
			item
				.setTitle("Citations")
				.setIcon("trash")
				.onClick(() => console.log("clicked 2")),
		);
		menu.showAtMouseEvent(event);
	}
</script>

<div class="metadata-property">
	<div class="metadata-property-key">
		<input
			class="metadata-property-key-input"
			type="text"
			bind:value={name}
		/>
	</div>
	<div class="metadata-property-value">
		<input
			class="metadata-input-text"
			type="text"
			bind:value={dict[name]}
		/>
		<button
			bind:this={btnEl}
			class="clickable-icon"
			aria-label="Delete property"
			onclick={() => triggerDelete(name)}
		></button>
	</div>
</div>

<!-- 
<div class="metadata-property">
	<div class="metadata-property-key">
		<input
			class="metadata-property-key-input"
			type="text"
			bind:value={name}
		/>
	</div>
	<div class="metadata-property-value">
		<input
			class="metadata-input-text"
			type="text"
			bind:value={dict[name]}
		/>
		<button style="cursor: pointer;" onclick={() => triggerDelete(name)}
			>X</button
		>
	</div>
</div> -->

<!-- <button style="cursor: pointer;" onclick={triggerDelete}>X</button> -->

<!-- <button onclick={openMenu}>Open Menu</button> -->


