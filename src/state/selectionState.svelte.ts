import type ForceGraph from "force-graph";
import type { GraphData, LinkObject, NodeObject } from "force-graph";
import { rectangleMultiSelect } from "src/interaction/multipleNodeSelection";
import type { Config } from "src/config.svelte";
import type { OSCManager } from "src/osc/osc";

export class SelectionState {
    // selectedNode = $state(null) as NodeObject | null;
    selectedNodes = $state<Array<NodeObject>>([]);
    multiSelect = $state<boolean>(false);
    selectedNodeIndex = $state<number | null>(null);
    // previousSelectedId: string | null = null;
    selectionStartMouse: { x: number, y: number } | null = null;
    selectionEndMouse: { x: number, y: number } | null = null

    constructor(
        private getColorScale: () => d3.ScaleOrdinal<string, string>,
        private getConfig: () => Config,
        private getOsc: () => OSCManager,
        private getDegree: () => Record<number, number> | null
    ) {
        // this.getSelectedNode;
    }

    //====================================================================================
    // Data Selection
    //====================================================================================
    toggleMultiselect(toggle: boolean) {
        this.multiSelect = toggle;
        // console.log(this.multiSelect)
    }


    // Function that decides the behaviour of the graph when a node is selected
    selectNode(node: NodeObject, graph: ForceGraph, nodes: NodeObject[]) {
        if (!graph || !nodes) return;
        // this.selectedNode = node;
        if (node.id) {
            // this.previousSelectedId = node.id;
            this.selectedNodeIndex = nodes.indexOf(node);
            if (this.multiSelect) {
                // if it's not there yet then add - don't create duplicates
                if (!this.selectedNodes.includes(node)) {
                    this.selectedNodes.push(node);
                }
                console.log("Selected multiple nodes: ", [...this.selectedNodes]);
            } else {
                // graph.nodeColor(n => n.id === this.selectedNode.id ? 'red' : this.getColorScale()(n.openacces));
                this.selectedNodes = [node];
                if (this.getConfig().config.centerAtNode.modeEnabled) {
                    graph.centerAt(node.x, node.y, 300);
                }
                // console.log("la config è cuxi",this.getConfig().config.centerAtNode.modeEnabled);
                // this.graph.centerAt(this.selectedNode.x, this.selectedNode.y, 300);
                // this.oscManager.sendMessage('/control', [
                //     node.id, node.openacces, node.citations,
                //     this.degree[node.id], 1000, node.year, node.x, node.y, 2, 55, 800
                // ]);
                this.getOsc().sendMessage('/control', [
                    node.id, node.openacces, node.citations,
                    this.getDegree()[node.id], 1000, node.year, node.x, node.y, 2, 55, 800
                ]);
            }
            graph.nodeColor(n => this.selectedNodes.some(s => s.id === n.id) ? 'red' : this.getColorScale()(n.openacces));

        };
    }
    selectionStart(e: MouseEvent, graph: ForceGraph<NodeObject, LinkObject<NodeObject>>) {
        // if (!this.graph) return;
        // Selection start is triggered on Mouse Down.
        const { x, y } = graph.screen2GraphCoords(e.layerX, e.layerY)
        this.selectionStartMouse = { x, y }
    }
    selectionEnd(e: MouseEvent, graph: ForceGraph<NodeObject, LinkObject<NodeObject>>) {
        // if (!this.graph) return;
        // Selection end is linked with Mouse Drag
        const { x, y } = graph.screen2GraphCoords(e.layerX, e.layerY)
        this.selectionEndMouse = { x, y }  // just update state
    }
    // STILL USING THE FUNCTION ON GRAPHSTATE
    drawOverlay(ctx: CanvasRenderingContext2D, globalScale: number, graphData: GraphData, graph: ForceGraph) {
        // draws the rectangle for the selection.
        if (this.selectionStartMouse && this.selectionEndMouse) {
            const selectedMany = rectangleMultiSelect(
                this.selectionStartMouse.x, this.selectionStartMouse.y,
                this.selectionEndMouse.x, this.selectionEndMouse.y,
                ctx,
                graphData,
                graph,
                this.getColorScale()
            );
            console.log(selectedMany);
        }
    }

}