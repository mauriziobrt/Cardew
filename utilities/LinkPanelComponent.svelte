<script lang="ts">
	import Sortable from "sortablejs";
	import { onMount } from "svelte";
	import PanelLink from "./PanelLink.svelte";
	import Panelplus from "./Panelplus.svelte";
	import type { GraphState } from "graphState.svelte";

	interface Props {
		graphState: GraphState;
	}

	// Props are defined in main.ts
	let { graphState }: Props = $props();

	let nodeSort: HTMLElement;

	onMount(async function () {
		Sortable.create(nodeSort, {
			group: {
				name: "nodeSort",
				put: false,
				pull: false,
			},
			animation: 200,
		});
	});

	//Handlers
	function handleChange(event) {
		console.log(event.detail);
	}

	function handleAdd(targetId) {
		graphState.addLink(targetId);
	}

	function handleDelete(link) {
		if (confirm("Press a button!\nEither OK or Cancel.")) {
			graphState.removeLink(link);
		} else {
			return;
		}
	}
</script>

<!--
//===============================================================
Objective:
[=========]
[=========]
[=========]
[––––+––––]

[======= -]-> possibility to remove the element, if clicked a popup appear to confirm operation
[======= -]
[        -]
[––––+––––]
Add links with autocomplete:
https://svelte.dev/playground/1154fae2095b443484589c3194efec16?version=4.2.9#H4sIAAAAAAAAE21QwU4rMQz8lcinh7QUuC7dSqUHxBUkECIcQuJ2I7xOlHhb0Kr__pRN-4TEu1n2zHhmJmAzILTwtEcSVOtRgg1DJBRUDxxHUQ6HAA1sPWGG9m0C-Y6FURbQnPnrGBd51oAGPkzG_-1tYEGWDC0ss00-iiLDu06DZA0rzUr5IYYks4_NyUe1sU1hUBqq1qX54fPSF4CG28K3gbMoGyikrDr1puGl94IaGqXhEV0dXpEoHOp8nxC5jnc0npB3ZOynhvdbzUV1O7IVH1j1hh3hpje8wz-4R5YLNRVE_RwIFxR29bJwKMbTxezrqHl5VTOviubS-b2yZHLu9NyL8YzpVMLyV_z6onQ6wykkDf_eVu6TfFO5HryTvr25vo5fZ0wkY7EP5DB1GjZzOeebFxxyN9XGjnUXuA1cQz4bGrGbfuaeQVerEsj5_ZwGGhD8EmgljXh8b6AEP3h20G4NZTz-BSEXEwVoAgAA

ON button click add element to links
Change draggable to just one portion of the element, so that it doesn't
overlap with the input
//===============================================================
So what is needed:
- Links expanded, add a menu to select the node and on node display the different links


//===============================================================
-->
<!-- <h1 class="setting-title">Linked Nodes</h1> -->
<div class="view-content">
	<div class="metadata-container">
		<div class="metadata-content">
			<div class="metadata-properties">
				<section bind:this={nodeSort}>
					{#if graphState.selectedNodeIndex !== null}
						<!-- the issue is connecting to the links and on each editing make it work
		also on // the other end -->
						{#each graphState.selectedNodeRawLinks as link (link)}
							{@const otherNode =
								link.source.id === graphState.selectedNode.id
									? link.target
									: link.source}
							<PanelLink
								links={link}
								otherNode={otherNode}
								onDelete={handleDelete}
								onEdit={(newTargetId) =>
									graphState.editLink(link, newTargetId)}
								bind:nodes={graphState.allNodeIds}
								onClick={() => graphState.highlightLink(link)}
								onLeave={() => graphState.selectNode(graphState.selectedNode)}
								selectNode={(node) =>
									graphState.selectNode(node)}
								degree={graphState.degree[otherNode.id]}
							/>
						{/each}

						<!-- {#each Object.entries(graphState.selectedNodeRawLinks) as [key, value]}
			<PanelLink
				position={key}
				// I can't bind to selectedNodeLinks for some reason
				links={value}
				// here instead of passing all the nodes I should only pass the array
				// bind:nodes={graphState.graphData.nodes}
				onDelete={handleDelete}
			/>
		{/each} -->
					{/if}
				</section>
			</div>
		</div>

		<span style="margin: 0.1px"></span>
		<!-- <h1 class="setting-title">Connect Nodes</h1> -->

		<Panelplus onAdd={handleAdd} nodeIds={graphState.allNodeIds} />
	</div>
</div>

<style>
	.metadata-container {
		--metadata-divider-width: 1px;
	}
</style>
