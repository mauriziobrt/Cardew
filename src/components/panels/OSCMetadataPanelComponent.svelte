<script lang="ts">
	import type { GraphState } from "src/state/graphState.svelte";
	import Sortable from "sortablejs";
	import { onMount } from "svelte";
	import data from "../../data/metadataFields.json";

	// It should enable composition of messages, it should fill for every class available
	// it should pickup the types of the class, so every user created class should also
	// it should be a modal, opened when clicking a setting in metadapanelcomponent
	// Option 1: we have it in edit mode, maybe even obsidian edit topbar. 2 we have it on the sidebar. 3 we have it in each node box.
	// Since it's global it should be in 1 or 2

	interface Props {
		graphState: GraphState; //for now, later it should just have access to an OSC config file
		oscConfig: Record<string, string[]>;
		onSave: () => Promise<void>;
		onClose: () => void;
	}

	let { graphState, oscConfig, onSave, onClose }: Props = $props();
	let oscSort: HTMLElement[] = [];
	let oscCompose: HTMLElement[] = [];

	const BUILTINS = ["x", "y", "degree"];
	const classes = Object.keys(data);
	const COLORS = [
		"red",
		"orange",
		"yellow",
		"green",
		"cyan",
		"blue",
		"purple",
		"pink",
	];
	const poolKeys = (oscClass: string) => [
		...new Set([
			...BUILTINS,
			...Object.keys(data[oscClass as keyof typeof data]),
		]),
	];

	function readOrder(el: HTMLElement): string[] {
		return [...el.children].map((c) => (c as HTMLElement).dataset.key!);
	}

	onMount(async function () {
		classes.forEach((oscClass, i) => {
			(oscConfig[oscClass] ?? []).forEach((key) => {
				const src = oscSort[i].querySelector(`[data-key="${key}"]`);
				// if (src) oscCompose[i].appendChild(src.cloneNode(true));
				if (src) {
					const clone = src.cloneNode(true) as HTMLElement;
					clone.addEventListener("dblclick", () => {
						clone.remove();
						oscConfig[oscClass] = readOrder(oscCompose[i]);
						onSave();
					});
					oscCompose[i].appendChild(clone);
				}
			});

			Sortable.create(oscSort[i], {
				group: {
					name: "oscSort",
					put: false,
					pull: "clone",
					sort: false,
				},
				animation: 200,
			});
			Sortable.create(oscCompose[i], {
				group: {
					name: oscClass,
					pull: false,
					put: true,
					removeOnSpill: true,
				},
				onSort: () => {
					// fires on add, reorder, and remove
					oscConfig[oscClass] = readOrder(oscCompose[i]);
					onSave();
				},
				animation: 200,
				onAdd: (evt: {
					item: {
						addEventListener: (
							arg0: string,
							arg1: () => any,
						) => void;
						remove: () => any;
					};
				}) => {
					evt.item.addEventListener("dblclick", () =>
						evt.item.remove(),
					);
				},
			});
		});
	});
</script>

<h2>OSC Configuration</h2>
<!-- <div class="setting-item"> -->
{#each classes as oscClass, c}
	<hr style="margin: 5px;" />
	<div class="osc-class">
		<div class="setting-item-heading">Class Name: {oscClass}</div>
		<section bind:this={oscSort[c]} class="osc-grid">
			{#each poolKeys(oscClass) as tmpcl, i}
				<div
					class="osc-item"
					data-key={tmpcl}
					style="--c: var(--color-{COLORS[i % COLORS.length]})"
				>
					{tmpcl}
				</div>
			{/each}
		</section>

		<div class="setting-item-heading">OSC Message order:</div>

		<section
			bind:this={oscCompose[c]}
			class="osc-grid osc-compose"
		></section>
	</div>
{/each}

<style>
	:global(.osc-grid) {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: var(--size-4-2);
	}
	.osc-class {
		margin-bottom: var(--size-4-4);
	}

	.osc-compose {
		min-height: 2.5em;
		margin-top: var(--size-4-2);
		padding: var(--size-4-2);
		border: 1px dashed var(--background-modifier-border);
		border-radius: var(--radius-m);
	}
	.osc-item {
		background-color: color-mix(in srgb, var(--c) 10%, transparent);
		border: 1px solid var(--c);
		border-radius: var(--radius-xl);
		text-align: center;
		cursor: grab;
	}
</style>
