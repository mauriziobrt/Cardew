<script lang="ts">
	import PanelLink from "./PanelLink.svelte";
	import Panelplus from "./PanelLinkPlus.svelte";
	import type { GraphState } from "src/state/graphState.svelte";
	import { idOf } from "src/utils/graphUtils";
	import type { MyLink, MyNode } from "src/types/graph";

	interface Props {
		graphState: GraphState;
	}

	// Props are defined in main.ts
	let { graphState }: Props = $props();

	function handleAdd(targetId: MyNode["id"]) {
		if(targetId) graphState.addLink(targetId);
	}

	function handleDelete(link: MyLink) {
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
<div class="view-content">
	<div class="metadata-container">
		<div class="metadata-content">
			<div class="metadata-properties">
				<!-- <section bind:this={nodeSort}> -->
				<section>
					{#if graphState.selectionState.selectedNodeIndex !== null}
						<!-- the issue is connecting to the links and on each editing make it work
		also on // the other end -->
						{#each graphState.selectedNodeRawLinks as link (link)}
							{@const otherNode =
								idOf(link.source) === graphState.selectionState.selectedNodes[0].id
									? link.target
									: link.source}
							<PanelLink
								links={link}
								otherNode={otherNode}
								onDelete={handleDelete}
								// onEdit at the moment is unused
								// onEdit={(newTargetId: MyNode["id"]) =>
								// 	{if(newTargetId) graphState.editLink(link, newTargetId)}}
								// bind:nodes={graphState.allNodeIds}
								onClick={() => graphState.highlightLink(link)}
								onLeave={() => graphState.selectNode(graphState.selectionState.selectedNodes[0])}
								selectNode={(node: MyNode) =>
									graphState.selectNode(node)}
								degree={graphState.degree[otherNode.id]}
								direction={graphState.getLinkDirection(graphState.selectionState.selectedNodes[0], link)}
								editDirection={() => graphState.editLinkDirection(link)}
							/>
						{/each}
					{/if}
				</section>
			</div>
		</div>

		<span style="margin: 0.1px"></span>
		<Panelplus onAdd={handleAdd} nodeIds={graphState.allNodeIds} />
	</div>
</div>

<style>
	.metadata-container {
		--metadata-divider-width: 1px;
	}
</style>
