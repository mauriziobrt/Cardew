<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import type { GraphState } from "../state/graphState.svelte";
	import { registerControls, registerOSCcontrols } from "src/interaction/control";
	import { createGraphActions } from "../interaction/graphActions";
	import ForceGraph, { type NodeObject } from "force-graph";
	import { showNodeMenu } from "src/ui/NodeMenu";
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

	onMount(() => {
		const cfg = graphState.config.current.graph;

		graph = new ForceGraph()(container)
			.graphData({ nodes: [], links: [] })
			.nodeId("id")
			.nodeLabel("user")
			.nodeVal(
				(node: { id: string | number }) =>
					graphState.degree[node.id] || 1,
			) // Default to 1 if no links
			.nodeRelSize(cfg.nodeSize)
			.d3AlphaDecay(cfg.alphaDecay)
			.d3VelocityDecay(cfg.velocityDecay)
			.nodeCanvasObject((node, ctx: CanvasRenderingContext2D) =>
				nodePaint(node, ctx),
			)
			// .nodePointerAreaPaint(nodePaint)
			.nodePointerAreaPaint(({ id, x, y }, color, ctx) => {
				const r = 3 + Math.sqrt(graphState.degree[id] || 1) * 2;
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(x, y, r, 0, 2 * Math.PI);
				ctx.fill();
			})
			.cooldownTicks(Infinity)
			.cooldownTime(Infinity)
			.linkWidth(
				(node: { weight: number }) => node.weight / cfg.linkWidth,
			)
			.linkDirectionalParticleWidth(2)
			.width(container.clientWidth)
			.height(container.clientHeight)
			.backgroundColor("rgba(0, 0, 0, 0)")
			.linkColor(() => linkStaticColor)
			.linkCurvature(0.2)
			.onEngineStop(() => console.log("Physics stopped"))
			.onBackgroundClick(() => {
				graphState.setupBackgroundClick();
			})
			.onRenderFramePost(
				(ctx: CanvasRenderingContext2D, globalScale: number) => {
					graphState.drawOverlay(ctx, globalScale);
				},
			)
			// Add function that opens a contextual menu on right click
			.onBackgroundRightClick((node: NodeObject, event: MouseEvent) => {
				// graphState.selectNode(node);
				showNodeMenu(node, event, graphState);
			})
			.onNodeRightClick((node: NodeObject, event: MouseEvent) => {
				graphState.selectNode(node);
				showNodeMenu(node, event, graphState);
			})
			.onNodeClick((node: NodeObject) => {
				graphState.selectNode(node);
			});

		graphState.theGraph(graph);

		if (graphState.graphData) {
			graphState.updateData(graphState.graphData);
		}

		function nodePaint(
			{ id, openacces, x, y },
			ctx: CanvasRenderingContext2D,
			overrideColor?: string,
		) {
			// ctx.fillStyle = "black";
			const shapesByOpenAccess = {
				open: (x, y, r, ctx) => {
					ctx.beginPath();
					ctx.arc(x, y, r, 0, 2 * Math.PI, false);
					ctx.fill();
				}, // circle
				closed: (x, y, r, ctx) => {
					ctx.fillRect(x - r, y - r * 0.66, r * 2, r * 1.33);
				}, // rectangle
				green: (x, y, r, ctx) => {
					ctx.beginPath();
					ctx.moveTo(x, y - r);
					ctx.lineTo(x - r, y + r);
					ctx.lineTo(x + r, y + r);
					ctx.fill();
				}, // triangle
				gold: (x, y, r, ctx) => {
					ctx.beginPath();
					ctx.moveTo(x, y - r);
					ctx.lineTo(x + r, y);
					ctx.lineTo(x, y + r);
					ctx.lineTo(x - r, y);
					ctx.closePath();
					ctx.fill();
				}, // diamond/rhombus shape, filled solid
				diamond: (x, y, r, ctx) => {
					// outlined diamond (hollow), to distinguish from gold
					ctx.beginPath();
					ctx.moveTo(x, y - r);
					ctx.lineTo(x + r, y);
					ctx.lineTo(x, y + r);
					ctx.lineTo(x - r, y);
					ctx.closePath();
					ctx.lineWidth = 1.5;
					ctx.strokeStyle = ctx.fillStyle;
					ctx.stroke();
				},
				hybrid: (x, y, r, ctx) => {
					// half-filled circle: left half solid, right half outline
					ctx.beginPath();
					ctx.arc(x, y, r, Math.PI / 2, (3 * Math.PI) / 2);
					ctx.fill();
					ctx.beginPath();
					ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2);
					ctx.lineWidth = 1.5;
					ctx.strokeStyle = ctx.fillStyle;
					ctx.stroke();
				},
				unknown: (x, y, r, ctx) => {
					ctx.font = `${r * 2}px Sans-Serif`;
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillText("?", x, y);
				},
			};

			const size = graphState.degree[id] || 1;
			const radius = 3 + Math.sqrt(size) * 2; // scale however looks right
			const fn =
				shapesByOpenAccess[openacces] ?? shapesByOpenAccess.unknown;

			const isSelected = graphState.selectionState.selectedNodes.some(
				(s) => s.id === id,
			);

			const color = isSelected ? "red" : graphState.colorScale(openacces);

			ctx.save();
			ctx.fillStyle = overrideColor ?? color;
			fn(x, y, radius, ctx);
			ctx.restore();
		}

		//so i have to get the osc maybe inhereting from graphstate and say that on message /up: actions.navigateUp.
		//so i need to create a new register controls but for the different cases of incoming messages.
		// Layer 2 → 1 wiring

		const actions = createGraphActions(graphState);
		cleanupControls = registerControls({
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
			undo: actions.undo,
			redo: actions.redo,
		});
		cleanupOSCControls = registerOSCcontrols(
			{
				msgUp: actions.navigateUp,
				msgLeft: actions.navigateLeft,
				msgDown: actions.navigateDown,
				msgRight: actions.navigateRight,
				msgSpace: actions.rhythm,
				msgPos: actions.hover
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
			// now it is stuck
		}
	});
	3;
	onDestroy(() => {
		cleanupControls?.();
		cleanupOSCControls?.();
		resizeObserver.disconnect();
		graph?.pauseAnimation?.(); // stops the internal RAF loop
		if (graph) graph = null;
	});
</script>

<div bind:this={container} class="force-graph-container"></div>

<style>
	.force-graph-container {
		width: 100%;
		height: 100%;
		/* background-color: --background-primary; */
	}
</style>
