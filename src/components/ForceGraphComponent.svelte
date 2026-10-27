<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import type { GraphState } from "../state/graphState.svelte";
	import {
		registerControls,
		registerOSCcontrols,
	} from "src/interaction/control";
	import { createGraphActions } from "../interaction/graphActions";
	import ForceGraph from "force-graph";
	import type { MyNode } from "src/types/graph";
	import { showNodeMenu } from "src/ui/NodeMenu";
	import { parseSvg, drawSvg } from "src/utils/svgUtils";
	import { shapes } from "src/data/shapes";

	interface Props {
		graphState: GraphState;
	}

	let { graphState }: Props = $props();
	let linkStaticColor = "rgba(104, 100, 100, 0.3)";
	let container: HTMLDivElement;
	let graph: any;
	let cleanupControls: () => void;
	let cleanupOSCControls: () => void;
	let resizeObserver: any;

	const selectedIds = $derived(
		new Set(graphState.selectionState.selectedNodes.map((n) => n.id)),
	);

	onMount(() => {
		const cfg = graphState.config.current.graph;

		graph = new ForceGraph(container)
			.graphData({ nodes: [], links: [] })
			.dagMode(null)
			.nodeId("id")
			.nodeLabel("user")
			.nodeVal(
				(node: { id: string | number }) =>
					graphState.degree[node.id] || 1,
			) // Default to 1 if no links
			.nodeRelSize(cfg.nodeSize)
			.d3AlphaDecay(cfg.alphaDecay)
			.d3VelocityDecay(cfg.velocityDecay)
			.nodeCanvasObject(
				(node, ctx: CanvasRenderingContext2D, globalScale) => {
					nodePaint(node, ctx);
					const fontSize = 12 / globalScale;
					ctx.font = `${fontSize}px Sans-Serif`;
					ctx.textAlign = "center";
					ctx.textBaseline = "bottom";
					ctx.fillStyle = "#222";
					ctx.fillText(
						node[graphState.config.current.textDisplayProperty],
						node.x,
						node.y - 6,
					); // 6 ≈ node radius + padding
				},
			)
			.nodePointerAreaPaint(({ id, x, y }, color, ctx) => {
				const r = 3 + Math.sqrt(graphState.degree[id] || 1) * 2;
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(x, y, r, 0, 2 * Math.PI);
				ctx.fill();
			})
			.cooldownTicks(1000)
			.cooldownTime(10000)
			.linkWidth(
				(node: { weight: number }) => node.weight / cfg.linkWidth,
			)
			.linkDirectionalArrowLength(12)
			// .linkDirectionalParticleWidth(2)
			.width(container.clientWidth)
			.height(container.clientHeight)
			.backgroundColor("rgba(0, 0, 0, 0)")
			.linkColor(() => linkStaticColor)
			.linkCurvature(0.2)
			.onEngineStop(() => {
				console.log("Physics stopped");
			})
			.onBackgroundClick(() => {
				graphState.setupBackgroundClick();
			})
			.onRenderFramePost(
				(ctx: CanvasRenderingContext2D, globalScale: number) => {
					graphState.drawOverlay(ctx, globalScale);
				},
			)
			// Add function that opens a contextual menu on right click
			.onBackgroundRightClick((node: MyNode, event: MouseEvent) => {
				// graphState.selectNode(node);
				showNodeMenu(node, event, graphState);
			})
			.onNodeRightClick((node: MyNode, event: MouseEvent) => {
				graphState.selectNode(node);
				showNodeMenu(node, event, graphState);
			})
			.onNodeClick((node: MyNode) => {
				graphState.selectNode(node);
			});

		graphState.theGraph(graph);

		if (graphState.graphData) {
			graphState.updateData(graphState.graphData);
		}

		function nodePaint(
			node: MyNode,
			ctx: CanvasRenderingContext2D,
			overrideColor?: string,
		) {
			const { id, openacces, x, y } = node;
			const prop = graphState.config.current.mappings.property;
			const rule = graphState.ruleMap.get(String(node[prop]));
			const radius = 3 + Math.sqrt(graphState.degree[id] || 1) * 2;
			const fn = shapes[rule?.shape] ?? shapes[openacces] ?? shapes.unknown;
			// const fn = shapes[openacces] ?? shapes.unknown;
			ctx.save();
			ctx.fillStyle =
				overrideColor ??
				(selectedIds.has(id)
					? "red"
					: graphState.colorScale(openacces));
			fn(x, y, radius, ctx);
			ctx.restore();
		}

		//so i have to get the osc maybe inhereting from graphstate and say that on message /up: actions.navigateUp.
		//so i need to create a new register controls but for the different cases of incoming messages.
		// Layer 2 → 1 wiring

		const actions = createGraphActions(graphState);
		cleanupControls = registerControls(
			{
				onUp: actions.navigateUp,
				onLeft: actions.navigateLeft,
				onDown: actions.navigateDown,
				onRight: actions.navigateRight,
				onSpace: actions.rhythm,
				onBackspace: actions.kill,
				onCtrlMouseDown: actions.createNode,
				onCmd: actions.pencilCursor,
				onCmdUp: actions.resetPencilCursor,
				onAlt: actions.crossCursor,
				onAltUp: actions.resetCrossCursor,
				onMouseDown: actions.mouseDown,
				onMouseDrag: actions.mouseDrag,
				onMouseUp: actions.mouseUp,
				onCmdMouseDown: actions.onMultiSelect,
				onCmdMouseUp: actions.offMultiSelect,
				onAltMouseDown: actions.rectangleSelectionStart,
				onAltMouseUp: actions.clearSelection,
				onAltMouseDrag: actions.rectangleSelectionEnd,
				onCmdA: actions.selectAll,
				// onCmdI: actions.toggleMetadataView,
				undo: actions.undo,
				redo: actions.redo,
			},
			container,
		);
		cleanupOSCControls = registerOSCcontrols(
			{
				msgUp: actions.navigateUp,
				msgLeft: actions.navigateLeft,
				msgDown: actions.navigateDown,
				msgRight: actions.navigateRight,
				msgSpace: actions.rhythm,
				msgPos: actions.hover,
				msgMove: actions.move,
				msgCreate: actions.createComplexNode,
				msgDelete: actions.deleteNode,
				msgSearch: actions.searchNodes,
			},
			graphState.oscManager,
		);

		// Handle resize
		resizeObserver = new ResizeObserver(() => {
			if (graph && container) {
				graph.width(container.clientWidth);
				graph.height(container.clientHeight);
			}
		});
		resizeObserver.observe(container);

		if (graphState.config.current.creative.modeEnabled) {
			graphState.setupCreativeConfig();
		} else {
			// now nothing happens to the graph ways
		}
	});

	onDestroy(() => {
		graph?.pauseAnimation?.();
		graph?._destructor?.();
		cleanupControls?.();
		cleanupOSCControls?.();
		resizeObserver.disconnect();
		// clearTimeout(timeoutId);
		graph?.pauseAnimation?.(); // stops the internal RAF loop
		if (graph) graph = null;
	});
</script>

<div bind:this={container} class="force-graph-container"></div>

<style>
	.force-graph-container {
		width: 100%;
		height: 100%;
	}
</style>
