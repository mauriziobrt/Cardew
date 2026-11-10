import type ForceGraph from "force-graph";
import type { GraphData, LinkObject } from "force-graph";
import type { MyNode } from "src/types/graph";
import { rectangleMultiSelect } from "src/interaction/multipleNodeSelection";
import type { Config } from "src/config.svelte";
import type { OSCManager } from "src/osc/osc";
import { Notice } from "obsidian";

export class SelectionState {
    // selectedNode = $state(null) as MyNode | null;
    selectedNodes = $state<Array<MyNode>>([]);
    multiSelect = $state<boolean>(false);
    selectedNodeIndex = $state<number[] | null>(null);
    // previousSelectedId: string | null = null;
    selectionStartMouse: { x: number, y: number } | null = null;
    selectionEndMouse: { x: number, y: number } | null = null

    constructor(
        private getColorScale: () => d3.ScaleOrdinal<string, string>,
        private getConfig: () => Config,
        private getOsc: () => OSCManager,
        private getOscConfig: () => Record<string, string[]>,
        private getDegree: () => Record<number, number>
    ) {
        // this.getSelectedNode;
    }

    private resolveParam(node: any, key: string) {
        switch (key) {
            case 'degree': return this.getDegree()[node.id] ?? 0;
            case 'x': return node.x ?? 0;
            case 'y': return node.y ?? 0;
            default: return node[key] ?? 0;
        }
    }
    //====================================================================================
    // OSC Message from selected node
    //====================================================================================

    sendOSCMessage(node: MyNode) {
        if (!node.className) {
            new Notice("Element has no class");
        } else {
            const currentClass = [node.className];
            let oscConfig = this.getOscConfig()[currentClass[0]];
            console.log(this.getOscConfig()[currentClass[0]], oscConfig, currentClass[0], this.getOscConfig());
            const values = (oscConfig ?? []).map((k) => this.resolveParam(node, k));
            const oscMsg = currentClass.concat(values)
            this.getOsc().sendMessage('/control', oscMsg);
        }
    }

    sendOSCMessagePos(node: MyNode) {
        {
            const oscMsg = [node.id, node.x, node.y];
            // console.log(oscMsg);
            this.getOsc().sendMessage('/pos', oscMsg);
        }
    }


    //====================================================================================
    // Claude generated - crossing axis 
    //====================================================================================

    // fields
    private crossings = new Map<string, MyNode>();   // "nodeId|axisId" -> node currently on an axis
    private autoSelected = new Set<string | number>(); // ids selected by an axis, not by the user

    // call once per frame
    updateCrossings(nodes: MyNode[], graph: ForceGraph, getRadius: (n: MyNode) => number) {
        const axes = nodes.filter((n: any) => n.axis) as any[];
        if (!axes.length && !this.crossings.size) return;

        const now = new Map<string, MyNode>();
        const entered: MyNode[] = [];

        for (const a of axes) {
            const ax = a.fx ?? a.x, ay = a.fy ?? a.y;
            if (ax == null || ay == null) continue;
            const half = a.length / 2, r = (a.angle * Math.PI) / 180;
            const cos = Math.cos(r), sin = Math.sin(r);

            for (const n of nodes as any[]) {
                if (n.ghost || n.x == null || n.y == null) continue;
                const rx = n.x - ax, ry = n.y - ay;
                const u = rx * cos + ry * sin;    // along the axis
                const v = -rx * sin + ry * cos;   // perpendicular
                if (Math.abs(v) <= getRadius(n) && Math.abs(u) <= half) {
                    const key = `${n.id}|${a.id}`;
                    now.set(key, n);
                    if (!this.crossings.has(key)) entered.push(n);   // rising edge
                }
            }
        }

        // nodes that left every axis
        const stillOn = new Set([...now.values()].map(n => n.id));
        const left = new Set<string | number>();
        for (const n of this.crossings.values()) if (!stillOn.has(n.id)) left.add(n.id);

        this.crossings = now;

        // select entering nodes (additive)
        if (entered.length) {
            const prev = this.multiSelect;
            this.multiSelect = true;
            for (const n of entered) {
                if (!this.selectedNodes.some(s => s.id === n.id)) this.autoSelected.add(n.id);
                this.selectNode(n, graph, nodes);
                if (n.className) this.sendOSCMessage(n);   // same message a click sends
            }
            this.multiSelect = prev;
        }

        // deselect only what the axis selected (remove this block if you want selection to persist)
        const toDrop = [...left].filter(id => this.autoSelected.has(id));
        if (toDrop.length) {
            this.selectedNodes = this.selectedNodes.filter(n => !toDrop.includes(n.id));
            toDrop.forEach(id => this.autoSelected.delete(id));
            graph.nodeColor((n: any) =>
                this.selectedNodes.some(s => s.id === n.id) ? 'red' : this.getColorScale()(n.openacces));
        }
    }

    //====================================================================================
    // Data Selection
    //====================================================================================
    toggleMultiselect(toggle: boolean) {
        this.multiSelect = toggle;
        // console.log(this.multiSelect)
    }

    // Function that decides the behaviour of the graph when a node is selected
    selectNode(node: MyNode, graph: ForceGraph, nodes: MyNode[]) {
        if (!graph || !nodes) return;
        // this.selectedNode = node;
        if (node.id) {
            // this.previousSelectedId = node.id;
            if (this.multiSelect) {
                // if it's not there yet then add - don't create duplicates
                if (!this.selectedNodes.includes(node)) {
                    this.selectedNodes.push(node);
                }
                if (this.selectedNodeIndex) {
                    if (!this.selectedNodeIndex.includes(nodes.indexOf(node))) {
                        this.selectedNodeIndex.push(nodes.indexOf(node));
                    }
                }
                // console.log("Selected multiple nodes: ", [...this.selectedNodes]);
            } else {
                // graph.nodeColor(n => n.id === this.selectedNode.id ? 'red' : this.getColorScale()(n.openacces));
                this.selectedNodeIndex = [nodes.indexOf(node)];
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
                // qua comunque cambia perchè faccio le configurazioni io quindi ha senso vedere come faccio le config.
                // allora facciamo quelle va intanto.
                if (!node.className) {
                    new Notice("Element has no class");
                } else {
                    const currentClass = [node.className];
                    let oscConfig = this.getOscConfig()[currentClass[0]];
                    console.log(this.getOscConfig()[currentClass[0]], oscConfig, currentClass[0], this.getOscConfig());
                    const values = (oscConfig ?? []).map((k) => this.resolveParam(node, k));
                    const oscMsg = currentClass.concat(values)
                    this.getOsc().sendMessage('/control', oscMsg);
                }
            }
            graph.nodeColor(n => this.selectedNodes.some(s => s.id === n.id) ? 'red' : this.getColorScale()(n.openacces));

        };
    }
    selectionStart(e: MouseEvent, graph: ForceGraph<MyNode, LinkObject<MyNode>>) {
        // if (!this.graph) return;
        // Selection start is triggered on Mouse Down.
        const { x, y } = graph.screen2GraphCoords(e.layerX, e.layerY)
        this.selectionStartMouse = { x, y }
    }
    selectionEnd(e: MouseEvent, graph: ForceGraph<MyNode, LinkObject<MyNode>>) {
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
