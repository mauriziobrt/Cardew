<script lang="ts">
	import { prepareFuzzySearch, sortSearchResults } from "obsidian";
	import type { SearchResult } from "obsidian";
	import type { GraphState } from "src/state/graphState.svelte";

	interface Props {
		graphState: GraphState;
	}

	// Props are defined in main.ts
	let { graphState }: Props = $props();

	// Ok it should receive the current data structure only so it should be reactive to that
	// let {
	// 	items,
	// 	onselect,
	// }: { items: string[]; onselect?: (item: string) => void } = $props();

	let items = $derived(
		graphState.graphData?.nodes.map((n) => ({
			id: n.id,
			description: n.description,
		})) ?? [],
	);

	let query = $state("");

	type Result = { id: string; item: string; match: SearchResult };

	let results = $derived.by<Result[]>(() => {
		if (!query)
			return items.slice(0, 50).map(({ id, description }) => ({
				id,
				item: description,
				match: { score: 0, matches: [] },
			}));

		// console.log(query);
		const matcher = prepareFuzzySearch(query);
		const out: Result[] = [];
		for (const { id, description } of items) {
			const match = matcher(description);
			if (match) out.push({ id, item: description, match });
		}

		sortSearchResults(out);
		return out.slice(0, 50);
	});

	// get node id at description
	function highlightNode(id: string) {
		console.log("THIS IS THE ID:", id);
		// I should store somehow the original node id, so that I can recall through that
		graphState.selectNode(graphState.getNodeAtID(id));
	}

	function selectResults() {
		console.log(results);
		const resNodes = results.map((r) => graphState.getNodeAtID(r.id));
		console.log(resNodes);
		graphState.selectionState.selectedNodes = resNodes;
	}
</script>

<div class="search-input-container">
	<input type="text" placeholder="Search..." bind:value={query} />
</div>

<!-- Ok I iterate through them but I should get the node object as well to recall it -->
<div class="view-content">
	<div class="metadata-container">
		<div class="metadata-content">
			<div class="metadata-properties">
				{#each results as { id, item, match } (id)}
					<div class="metadata-property">
						<div
							class="result"
							role="button"
							tabindex="0"
							onclick={() => highlightNode?.(id)}
							onkeydown={(e) =>
								e.key === "Enter" && highlightNode?.(id)}
						>
							<div class="setting-item-info">
								<div class="setting-item-name">
									{item}
								</div>
								<div class="setting-item-description"></div>
							</div>
						</div>
					</div>
					<span style="margin: 3px"></span>
				{/each}
			</div>
		</div>
	</div>
</div>
