<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Cosmograph, prepareCosmographData } from "@cosmograph/cosmograph";
	interface Props {
		data: {
			nodes: any[];
			links: any[];
		};
	}

	let { data }: Props = $props();

	let container: HTMLDivElement;
	let graph: any;

	const rawPoints = [{ id: "a" }, { id: "b" }, { id: "c" }];

	const rawLinks = [
		{ source: "a", target: "b" },
		{ source: "b", target: "c" },
		{ source: "c", target: "a" },
	];

	// Create a config to map your data into Cosmograph's internal format
	const dataConfig = {
		points: {
			pointIdBy: "id",
		},
		links: {
			linkSourceBy: "source",
			linkTargetsBy: ["target"],
		},
	};

	onMount(() => {
		graph = ForceGraph()(container)
			.graphData(data)
			.nodeId("id")
			.nodeLabel("name")
			.nodeRelSize(6)
			.linkDirectionalParticles(2)
			.linkDirectionalParticleWidth(2)
			.width(container.clientWidth)
			.height(container.clientHeight)
			// .backgroundColor("white")
			.nodeAutoColorBy("group")
			.linkAutoColorBy((d) => data.nodes[d.source].group);

		// Handle resize
		const resizeObserver = new ResizeObserver(() => {
			if (graph && container) {
				graph.width(container.clientWidth);
				graph.height(container.clientHeight);
			}
		});
		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
		};
	});
	onDestroy(() => {
		if (graph) {
			//   graph._destructor();
			graph = null;
		}
	});
</script>

<div bind:this={container} class="force-graph-container"></div>

<style>
	.force-graph-container {
		width: 100%;
		height: 100%;
		background-color: rgb(231, 231, 231);
	}
</style>
