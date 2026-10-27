<!-- CLAUDE SLOP CODE WILL FIX IT LATER -->
<script lang="ts">
	import { SHAPE_NAMES } from "src/data/shapes";
	

	// const valueS = [
	// 	"circle",
	// 	"square",
	// 	"triangle",
	// 	"diamond",
	// 	"hexagon",
	// 	"star",
	// ];
	let { value = $bindable("circle"), i } = $props();
	// let value = $state("circle");
	let btn: HTMLButtonElement;
	let pop: HTMLDivElement;
	let pos = $state({ top: 0, left: 0 });

	function place() {
		const r = btn.getBoundingClientRect();
		pos = { top: r.bottom + 4, left: r.left };
	}

	function pick(s: string) {
		value = s;
		pop.hidePopover();
	}
</script>

<button bind:this={btn} popovertarget="value-pop-{i}" onclick={place}>
	{value}
</button>

<div
	id="value-pop-{i}"
	popover
	bind:this={pop}
	style="top:{pos.top}px; left:{pos.left}px"
>
	{#each SHAPE_NAMES as s}
		<button class:selected={s === value} onclick={() => pick(s)}>{s}</button
		>
	{/each}
</div>
<!-- FINISH CLAUDE SLOP CODE -->

<style>
	[popover] {
		position: fixed;
		inset: auto;
		margin: 0;
		padding: 6px;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m);
		box-shadow: var(--shadow-s);
	}
	[popover]:popover-open {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 4px;
	}
	.selected {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}
</style>
