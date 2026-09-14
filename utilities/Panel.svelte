<script>
	import { Menu } from "obsidian";
	import { slide } from "svelte/transition";
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

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{name}</div>
	</div>
	<div class="setting-item-control">
		<input type="text" bind:value={dict[name]} />
		<!-- <button style="cursor: pointer;" onclick={triggerDelete}>X</button> -->
		<button style="cursor: pointer;" onclick={() => triggerDelete(name)}
			>X</button
		>
	</div>
</div>

<!-- <button onclick={openMenu}>Open Menu</button> -->

<style>
</style>
