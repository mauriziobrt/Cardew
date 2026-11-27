<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import type { GraphState } from "../state/graphState.svelte";
	import {
		registerControls,
		registerOSCcontrols,
	} from "src/interaction/control";
	import { createGraphActions } from "../interaction/graphActions";
	import ForceGraph, { type NodeObject } from "force-graph";
	import type { MyNode } from "src/types/graph";
	import { showNodeMenu } from "src/ui/NodeMenu";
	// import { parseSvg, drawSvg } from "src/utils/svgUtils";
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

	// claude bloat to fix flickering
	let lastW = 0;
	let lastH = 0;
	let snap: HTMLCanvasElement | null = null;

	function resizeGraph() {
		if (!graph || !container) return;

		const w = container.clientWidth;
		const h = container.clientHeight;
		if (w === lastW && h === lastH) return;

		const canvas = container.querySelector(
			"canvas",
		) as HTMLCanvasElement | null;

		// 1. graph coordinate currently at the center of the OLD viewport
		const center = graph.screen2GraphCoords(lastW / 2, lastH / 2);

		// 2. snapshot the current frame
		if (canvas && canvas.width > 0 && canvas.height > 0) {
			snap ??= document.createElement("canvas");
			if (snap.width !== canvas.width || snap.height !== canvas.height) {
				snap.width = canvas.width;
				snap.height = canvas.height;
			}
			snap.getContext("2d")!.drawImage(canvas, 0, 0);
		}

		const oldCanvasW = canvas?.width ?? 0;
		const oldCanvasH = canvas?.height ?? 0;

		// 3. resize, then re-center on the same graph point (no animation)
		graph.width(w).height(h);
		graph.centerAt(center.x, center.y);

		// 4. paint the old frame back, shifted by half the size change,
		//    so the placeholder is also centered
		if (canvas && snap) {
			const ctx = canvas.getContext("2d")!;
			const dx = (canvas.width - oldCanvasW) / 2;
			const dy = (canvas.height - oldCanvasH) / 2;
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.drawImage(snap, dx, dy);
			ctx.restore();
		}

		lastW = w;
		lastH = h;
	}

	// End Of CLAUDE BLOAT

	function getRadius(node: MyNode) {
		const radius =
			3 +
			Math.sqrt(graphState.degree[node.id] || 1) *
				graphState.config.current.graph.nodeSize;
		return radius;
	}

	function withAlpha(hex: string | undefined, a = 1) {
		if (!hex) return "#848484";
		const n = parseInt(hex.slice(1, 7), 16);
		return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
	}

	// function axisColor(n: MyNode) {
	// 	if (n.axisColor) return n.axisColor;
	// 	const prop = graphState.config.current.mappings.property;
	// 	const rule = graphState.ruleMap.get(String(n[prop]));
	// 	return rule?.color ? withAlpha(rule.color, rule.alpha) : "black";
	// }
	function axisColor(n: MyNode) {
		if (selectedIds.has(n.id)) return "red";
		if (n.axisColor) return n.axisColor;
		const prop = graphState.config.current.mappings.property;
		const rule = graphState.ruleMap.get(String(n[prop]));
		return rule?.color ? withAlpha(rule.color, rule.alpha) : "black";
	}

	const selectedIds = $derived(
		new Set(graphState.selectionState.selectedNodes.map((n) => n.id)),
	);

	// Force setup for axis line
	function forceGhostLine() {
		let ns: any, axes: any;
		const f = (alpha: number) => {
			for (const a of axes) {
				const half = a.length / 2,
					r = (a.angle * Math.PI) / 180;
				const cos = Math.cos(r),
					sin = Math.sin(r);
				for (const n of ns) {
					if (n.ghost) continue;
					const rx = n.x - (a.fx ?? a.x),
						ry = n.y - (a.fy ?? a.y);
					const u = rx * cos + ry * sin; // along the line
					const v = -rx * sin + ry * cos; // perpendicular
					if (!a.physics) continue;
					const lx = u - Math.max(-half, Math.min(half, u));
					const dist = Math.hypot(lx, v);
					if (dist > a.range) continue;
					const ulx = dist ? lx / dist : 0;
					const uly = dist ? v / dist : Math.random() < 0.5 ? -1 : 1;
					const k = (a.strength * alpha) / Math.max(dist, 1);
					n.vx += (ulx * cos - uly * sin) * k;
					n.vy += (ulx * sin + uly * cos) * k;
				}
			}
		};
		f.initialize = (arr: any[]) => {
			ns = arr;
			axes = arr.filter((n) => n.axis);
		};
		return f;
	}

	// Creatte the axis object if node has axis property set to true
	function axisObject(
		n: MyNode,
		ctx: CanvasRenderingContext2D,
		scale: number,
	) {
		if (!n.axis) return;
		ctx.beginPath();
		const h = n.length / 2,
			r = (n.angle * Math.PI) / 180;
		const dx = Math.cos(r) * h,
			dy = Math.sin(r) * h;
		const cx = n.fx ?? n.x,
			cy = n.fy ?? n.y;
		if (cx == null || cy == null) return;
		ctx.moveTo(cx - dx, cy - dy);
		ctx.lineTo(cx + dx, cy + dy);
		ctx.strokeStyle = axisColor(n);
		ctx.lineWidth = 1 / scale;
		ctx.stroke();
	}

	// Draw the axis if node has axis property set to true
	function axisDraw(n: MyNode, color: string, ctx: CanvasRenderingContext2D) {
		if (!n.axis) return;
		ctx.strokeStyle = color;
		ctx.lineWidth = 80;
		ctx.beginPath();
		const h = n.length / 2,
			r = (n.angle * Math.PI) / 180;
		const dx = Math.cos(r) * h,
			dy = Math.sin(r) * h;
		const cx = n.fx ?? n.x,
			cy = n.fy ?? n.y;
		if (cx == null || cy == null) return;
		ctx.moveTo(cx - dx, cy - dy);
		ctx.lineTo(cx + dx, cy + dy);
		ctx.stroke();
	}

	onMount(() => {
		const cfg = graphState.config.current.graph;

		graph = new ForceGraph(container)
			.autoPauseRedraw(false)
			.showPointerCursor(false)
			.onNodeHover((node: MyNode | null) =>
				graphState.cursor.hover(!!node),
			)
			.graphData({ nodes: [], links: [] })
			.dagMode(null)
			.onNodeDragEnd(() => {
				if (!graphState.physicsOn) {
					graphState.bridge.sendSnapshot();
				}
			})
			.nodeId("id")
			.nodeLabel("user")
			.nodeVal(
				(node: { id: string | number }) =>
					graphState.degree[node.id] || 1,
			) // Default to 1 if no links
			// .nodeRelSize(cfg.nodeSize)
			.d3AlphaDecay(cfg.alphaDecay)
			.d3VelocityDecay(cfg.velocityDecay)
			.nodeCanvasObject(
				(node, ctx: CanvasRenderingContext2D, globalScale) => {
					if (node.axis) {
						axisObject(node, ctx, globalScale);
					} else {
						nodePaint(node, ctx);
						const fontSize = 12 / globalScale;
						ctx.font = `${fontSize}px Sans-Serif`;
						ctx.textAlign = "center";
						ctx.textBaseline = "bottom";
						ctx.fillStyle = "#222";
						if (graphState.config.current.textOverlay) {
							ctx.fillText(
								node[
									graphState.config.current
										.textDisplayProperty
								],
								node.x,
								node.y -
									graphState.config.current.graph.nodeSize,
							); // 6 ≈ node radius + padding
						}
					}
				},
			)
			.nodePointerAreaPaint((node, color, ctx) => {
				if (node.axis) {
					axisDraw(node, color, ctx);
				} else {
					const r = getRadius(node);
					ctx.fillStyle = color;
					ctx.beginPath();
					ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
					ctx.fill();
				}
			})
			.cooldownTicks(0)
			.cooldownTime(0)
			.linkWidth(
				(node: { weight: number }) => node.weight / cfg.linkWidth,
			)
			.linkDirectionalArrowLength(12)
			.width(container.clientWidth)
			.height(container.clientHeight)
			.backgroundColor("rgba(0, 0, 0, 0)")
			.linkColor(() => linkStaticColor)
			.linkCurvature(cfg.linkCurvature)
			.onEngineStop(() => {
				console.log("Physics stopped");
				graphState.bridge.sendSnapshot();
			})
			.onBackgroundClick(() => {
				graphState.setupBackgroundClick();
			})
			.onRenderFramePost(
				(ctx: CanvasRenderingContext2D, globalScale: number) => {
					//if position different than lost position
					// const lastPost = (but it should for each tracked node, so we need a sort of dict when we get the node something like [id, lastpost: x, y, pos: x, y])
					// console.log(graphState.graphData?.nodes[0]["x"], graphState.graphData?.nodes[0]["y"]);
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
			})
			.d3Force("ghostLine", forceGhostLine());

		graph.d3Force("charge")?.strength((n: any) => (n.ghost ? 0 : -30));

		graphState.theGraph(graph);

		if (graphState.graphData) {
			graphState.updateData(graphState.graphData);
		}

		//In nodePaint the shapes and colors are created.
		//the thing is that graphState.colorScale() is a sort
		//of map between a property and some data
		function nodePaint(
			node: MyNode,
			ctx: CanvasRenderingContext2D,
			overrideColor?: string,
		) {
			const { id, openacces, x, y } = node;
			const prop = graphState.config.current.mappings.property;
			const rule = graphState.ruleMap.get(String(node[prop]));
			const radius = getRadius(node);
			const fn =
				shapes[rule?.shape] ?? shapes[openacces] ?? shapes.unknown;
			ctx.save();
			ctx.fillStyle =
				overrideColor ??
				(selectedIds.has(id)
					? "red"
					: withAlpha(rule?.color, rule?.alpha));
			// ctx.fillStyle =
			// 	overrideColor ?? (selectedIds.has(id) ? "red" : rule?.color);
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
				onShiftMouseDown: actions.onMultiSelect,
				onShiftUp: actions.offMultiSelect,
				onAltMouseDown: actions.rectangleSelectionStart,
				onAltMouseUp: actions.clearSelection,
				onAltMouseDrag: actions.rectangleSelectionEnd,
				onCmdA: actions.selectAll,
				onL: actions.linkAllSelectedNodes,
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
		resizeObserver = new ResizeObserver(resizeGraph); // no throttle, no settle timer
		resizeObserver.observe(container);

		// Handle resize
		// resizeObserver = new ResizeObserver(() => {
		// 	if (graph && container) {
		// 		graph.width(container.clientWidth);
		// 		graph.height(container.clientHeight);
		// 	}
		// });
		// resizeObserver.observe(container);

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
		clearTimeout(settleTimer);
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
		position: relative;
		overflow: hidden;
	}
</style>
