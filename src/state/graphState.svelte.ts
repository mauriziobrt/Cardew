import { navigateInDirection } from 'src/interaction/navigationUtils';
import type { Direction } from 'src/interaction/navigationUtils';
import { highlightNeighborsGradually, clearRhythmAnimations } from "src/interaction/rhythmUtils"
import { createNewNode, removeNode, creativeConfig } from 'src/interaction/creativeMode';
import { rectangleMultiSelect } from 'src/interaction/multipleNodeSelection';
import * as d3 from "d3";
import type { OSCManager } from 'src/osc/osc';
import type { Config } from 'src/config.svelte';
import type { GraphData, LinkObject, NodeObject } from 'force-graph';
import type ForceGraph from 'force-graph';
import { CursorState } from './cursorState';
import { MetadataState } from './metadataState.svelte';
import { SelectionState } from './selectionState.svelte';
import { Notice } from 'obsidian';

//=======================================================================================
// Main Graph Class most operations appear here

// TYPE NODE DEFINITION IS WRONG IT REFERS TO ANOTHER TYPE THAT IS NOT WHAT I REFER TO
// AS NODE
//=======================================================================================
export class GraphState {
    //====================================================================================
    // Graph variables
    //====================================================================================
    oscManager: OSCManager;
    config: Config;
    cursor = new CursorState;
    oscConfig = $state<Record<string, string[]>>({});
    selectedNodes = $state<Array<NodeObject>>([]);
    graphData = $state<GraphData | null>(null);
    graph = $state<ForceGraph | null>(null);
    lastOscMessage = $state<any[] | null>(null);
    numberElements = $state<number | null>(null);
    statsDataset = $state<any[] | null>(null);
    degree = $state<Record<number, number> | null>(null);
    ctx = <CanvasRenderingContext2D | null>(null);
    globalScale = $state<number>(0);
    multiSelect = $state<boolean>(false);
    nodeIdCounter = $state<number>(0);
    nodeClasses = $state<Record<string, any>>({
        "bibliometrics": {
            "id": "",
            "user": "",
            "description": "",
            "year": "",
            "openacces": "",
            "citations": 0,
            "subject areas": [],
            "scival topics cluster": [],
            "scival topics": []
        },
        "notes": {
        },
        "granulator": {
            "grainSize": 0,
        }
    });

    reservedKeys = new Set([
        "id",
        "name",
        "x",
        "y",
        "vx",
        "vy",
        "index",
        "__indexColor",
        "vx",
        "vy",
        "fx",
        "fy",
        "__initialDragPos",
        "__dragged",
    ]);
    copyMetatada = $state<Record<string, any>>({});
    //====================================================================================
    //States
    //====================================================================================
    selectionState = new SelectionState(() => this.colorScale, () => this.config, () => this.oscManager, () => this.oscConfig, () => this.degree);
    metadataState = new MetadataState(() => this.selectionState.selectedNodes[0]);
    //====================================================================================
    // Declare class properties
    //====================================================================================
    private colorScale!: d3.ScaleOrdinal<string, string>;
    // private previousSelectedId: string | null = null;
    // Positional Properties
    //––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
    private position: { x: number, y: number } | null = null;
    private selectionStartMouse: { x: number, y: number } | null = null;
    private selectionEndMouse: { x: number, y: number } | null = null
    nodeColor: any;
    //====================================================================================
    // Constructor
    //====================================================================================
    constructor(oscManager: OSCManager, config: Config) {
        // Called when the graphState is built
        this.oscManager = oscManager;
        this.config = config;
        // Initialize OSC
    };
    // Here I store the Graph to access it's functions
    theGraph(graph: ForceGraph) {
        this.graph = graph;
    }
    //====================================================================================
    // Update/Edit Data
    //====================================================================================
    // Function to load data in the form of json files
    updateData(data: GraphData) {
        this.graphData = data;
        // ADD THIS CHECK:
        if (!this.graph) {
            console.log('Graph not ready yet, data will be applied when graph mounts');
            return;
        }
        this.graph.graphData(this.graphData);
        // Update Colors
        this.colorScale = this.createColorScale();
        this.graph.nodeColor((node: { openacces: string; }) => this.colorScale(node.openacces));
        // this.graph.nodeColor((n: Node) => n.highlighted ? 'red' : this.colorScale(n.openacces));
        // console.log("LENGTH", data["nodes"]);
        this.numberElements = data["nodes"].length;
        // Calculate node degrees
        this.degree = {}
        // data.nodes.forEach(node => {
        //     node.className = "empty";
        // })
        data.links.forEach(link => {
            // console.log(link.source, link.target, link.weight);
            this.degree[link.source] = (this.degree[link.source] || 0) + 1;
            this.degree[link.target] = (this.degree[link.target] || 0) + 1;
        });
    }
    updateGraphData() {
        if (!this.graphData || !this.graph) return [];
        this.graph.graphData({ nodes: this.graphData.nodes, links: this.graphData.links });
        this.updateDegree()
    };

    // this should just run on startup, write somewhere and then change when an edit happens
    get allNodeIds() {
        if (!this.graphData) return [];
        return this.graphData.nodes.map(n => n.id)
    }

    // this should just run on startup, write somewhere and then change when an edit happens
    get allProperties() {
        return [...new Set(this.graphData.nodes.flatMap(n => Object.keys(n)))]
            .filter(k => !this.reservedKeys.has(k));
    }

    // this should just run on startup, write somewhere and then change when an edit happens
    allValuesAtProperty(property: string): string[] {
        if (!this.graphData) return [];
        // console.log(property)
        return [...new Set(
            this.graphData.nodes
                .map((n: any) => n[property])
                .filter((v): v is string => typeof v === "string")
        )];
    }

    updateDegree() {
        if (!this.graphData) return;
        // Calculate node degrees
        this.degree = {};

        this.graphData.links.forEach(link => {
            this.degree[link.source.id ?? link.source] = (this.degree[link.source.id ?? link.source] || 0) + 1;
            this.degree[link.target.id ?? link.target] = (this.degree[link.target.id ?? link.target] || 0) + 1;
        });
    }

    // Undo Redo
    // New state
    private undoStack: GraphData[] = [];
    private redoStack: GraphData[] = [];
    private maxHistory = 50; // avoid unbounded memory growth

    // hasEdits = $state(false);

    snapshot(): GraphData {
        // Use $state.snapshot to strip Svelte proxies, then deep clone
        return structuredClone($state.snapshot(this.graphData));
    }

    private pushUndo() {
        if (!this.graphData) return;
        this.undoStack.push(this.snapshot());
        if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
        // Any new action invalidates the redo stack
        this.redoStack = [];
        this.config.current.hasEdits = true;
    }

    undo() {
        if (this.undoStack.length === 0 || !this.graphData) return;
        const current = this.snapshot();
        const previous = this.undoStack.pop()!;
        this.redoStack.push(current);
        this.config.current.hasEdits = true;

        previous.links = previous.links.map(link => ({
            source: link.source.id ?? link.source,
            target: link.target.id ?? link.target
        }));

        this.graphData = previous;
        this.selectionState.selectedNodes[0] = {};
        // this.selectionState.selectedNodeIndex = null;
        this.resetColor();
        this.updateGraphData();
    }

    redo() {
        if (this.redoStack.length === 0 || !this.graphData) return;
        const current = this.snapshot();
        const next = this.redoStack.pop()!;
        this.undoStack.push(current);

        next.links = next.links.map(link => ({
            source: link.source.id ?? link.source,
            target: link.target.id ?? link.target
        }));
        this.graphData = next;
        this.selectionState.selectedNodes[0] = {};
        // this.selectionState.selectedNodeIndex = null;
        this.resetColor();
        this.updateGraphData();
    }
    //================================================================
    //Metadata and MetadataClasses
    //================================================================
    // To be merged with applyNodeClass methods

    retrieveNodeClass() {
        if (!this.selectionState.selectedNodes[0]) return;
        if (this.selectionState.selectedNodes.length > 1) {
            new Notice("Only one element can be copied");
            return
        }
        this.metadataState.retrieveNodeClass(this.selectionState.selectedNodes[0])
    }

    retrieveNodeCleanMetadata() {
        if (!this.selectionState.selectedNodes[0]) return;
        if (this.selectionState.selectedNodes.length > 1) {
            new Notice("Only one element can be copied");
            return
        }
        this.metadataState.retrieveNodeCleanMetadata(this.selectionState.selectedNodes[0])
    }

    applyRetrievedNodeClass() {
        if (!this.selectionState.selectedNodes[0]) return;
        for (const n of this.selectionState.selectedNodes) {
            this.metadataState.applyRetrievedNodeClass(n, this.nodeClasses)
        }
        this.updateGraphData();
    }

    applyMetadata() {
        if (!this.selectionState.selectedNodes[0]) return;
        this.pushUndo();
        for (const n of this.selectionState.selectedNodes) {
            this.metadataState.applyMetadata(n);
        }
        this.updateGraphData();
    }

    applyNodeClass(className: string | number) {
        if (!this.selectionState.selectedNodes[0] || !this.nodeClasses[className]) return;
        this.pushUndo();
        this.metadataState.applyNodeClass(this.selectionState.selectedNodes[0], className, this.nodeClasses[className]);
        this.updateGraphData();
    }

    saveNodeAsClass(className: string, overwrite: boolean) {
        // if overwrite on I can saveToExistingClas|| !this.graphData
        if (!this.selectionState.selectedNodes[0]) return [];
        const fields = this.metadataState.getEmptyFields(this.selectionState.selectedNodes[0]);
        this.nodeClasses[className] = fields;
    }

    //====================================================================================
    // Link Editing
    //====================================================================================

    get selectedNodeLinks() {
        if (!this.selectionState.selectedNodes[0] || !this.graphData) return [];
        // So first I create a set to avoid duplicates that filters through the link and get the full link where either it is the source or the target
        const onlyIDs = new Set(this.graphData.links.filter(
            link =>
                link.source.id === this.selectionState.selectedNodes[0].id ||
                link.target.id === this.selectionState.selectedNodes[0].id
        )
            .flatMap(link => [link.source.id, link.target.id])); //flatmap flattens it but I'm still not sure what it does actually

        // there are no duplicates but now I need to create an array from this probably there's a quick
        // way.
        // I return as array because it was returning a set, so this set -> array allows to have an array with duplicates
        // It is also displaying the selected link ID, I should remove that
        onlyIDs.delete(this.selectionState.selectedNodes[0].id)
        // And now I have the clean array
        // I should get two things the raw links and the flatmap
        return Array.from(onlyIDs)
    }

    get selectedNodeRawLinks() {
        if (!this.selectionState.selectedNodes[0] || !this.graphData) return [];
        return this.graphData.links.filter(
            link =>
                link.source.id === this.selectionState.selectedNodes[0].id ||
                link.target.id === this.selectionState.selectedNodes[0].id
        )
    }

    editLink(link: LinkObject, newTargetId: string) {
        if (!this.graphData || !this.selectionState.selectedNodes[0]) return;
        if (newTargetId === this.selectionState.selectedNodes[0].id) return;
        this.pushUndo();
        if (link.source.id === this.selectionState.selectedNode.id || link.source === this.selectionState.selectedNodes[0].id) {
            link.target = newTargetId;
        } else {
            link.source = newTargetId;
        }
        this.updateGraphData();
    }

    addLink(targetId: string | number) {
        if (!this.graphData || !this.selectionState.selectedNodes[0]) return;
        //to add a link I need to get the link ID  and a targetId that has to be a node existing in the graph
        const sourceId = this.selectionState.selectedNodes[0].id;
        // Normalize both to the same type — match whatever type your node.id actually is
        const normalizedTarget = typeof sourceId === 'number' ? Number(targetId) : String(targetId);

        // I remove if they are the same maybe here I can throw an error later
        if (sourceId === normalizedTarget) {
            console.warn(`addLink: target is the same as source`);
            return;
        };

        // Make sure the target actually exists in the current node set
        const targetExists = this.graphData.nodes.some(n => n.id === normalizedTarget);
        if (!targetExists) {
            console.warn(`addLink: no node with id ${normalizedTarget}`);
            return;
        }

        // if the link already exist then return I don't need to create duplicates
        const exists = this.graphData.links.some(link => {
            const s = link.source.id ?? link.source;
            const t = link.target.id ?? link.target;
            return (s === sourceId && t === normalizedTarget) || (s === normalizedTarget && t === sourceId);
        });
        if (exists) return;
        this.pushUndo();
        // here I push the new link but I have to check if targetId exists, when is this created?
        this.graphData.links.push({ source: sourceId, target: normalizedTarget });
        this.updateGraphData();
    }

    removeLink(link: LinkObject) {
        if (!this.graphData) return;
        this.pushUndo();
        // here I have to pass the exact instance of link: {source: ...; target: ...}
        this.graphData.links = this.graphData.links.filter(
            l => l !== link
        );
        this.updateGraphData();
    }

    highlightLink(link: LinkObject) {
        if (!this.graph) return;
        this.graph.nodeColor(node =>
            node.id === link.source.id || node.id === link.target.id ? 'red' : this.colorScale(node.openacces)
        );
    }

    resetColor() {
        if (!this.graph) return;
        this.graph.nodeColor((node) =>
            this.colorScale(node.openacces)
        );
    }
    //====================================================================================
    // Data Selection
    //====================================================================================


    getNodeAtID(id: string): NodeObject {
        return this.graph.graphData().nodes.find((n) => n.id === id);
    }

    toggleMultiselect(toggle: boolean) {
        this.multiSelect = toggle;
        // console.log(this.multiSelect)
    }

    selectAll() {
        if (!this.graph || !this.graphData) return;
        this.selectionState.toggleMultiselect(true);
        // get all the nodes of the graph
        console.log("ALL", this.graphData.nodes)
        // this.graphData.nodes;
        this.graphData.nodes.map((singleNode) => this.selectionState.selectNode(singleNode, this.graph, this.graphData.nodes));
        // this.selectionState.selectNode(this.graphData.nodes, this.graph, this.graphData.nodes);
        this.selectionState.toggleMultiselect(false);
    }

    // Function that decides the behaviour of the graph when a node is selected
    selectNode(node: NodeObject) {
        if (!this.graph || !this.graphData) return;
        this.selectionState.selectNode(node, this.graph, this.graphData.nodes);
    }

    selectionStart(e: MouseEvent) {
        if (!this.graph) return;
        // this.selectionState.selectionStart(e, this.graph);
        // Selection start is triggered on Mouse Down.
        const { x, y } = this.graph.screen2GraphCoords(e.layerX, e.layerY)

        this.selectionStartMouse = { x, y }
    }
    selectionEnd(e: MouseEvent) {
        if (!this.graph) return;
        // this.selectionState.selectionEnd(e, this.graph);

        // Selection end is linked with Mouse Drag
        const { x, y } = this.graph.screen2GraphCoords(e.layerX, e.layerY)
        // console.log(e.layerX, e.layerY)
        this.selectionEndMouse = { x, y }  // just update state
    }
    drawOverlay(ctx: CanvasRenderingContext2D, globalScale: number) {
        // this.selectionState.drawOverlay(ctx, globalScale, this.graphData, this.graph);
        // Function to draw on top of the canvas
        this.ctx = ctx;
        // globalScale is the zoom value but not necessary at the moment
        this.globalScale = globalScale;
        // draws the rectangle for the selection.
        if (this.selectionStartMouse && this.selectionEndMouse) {
            this.selectionState.selectedNodes = rectangleMultiSelect(
                this.selectionStartMouse.x, this.selectionStartMouse.y,
                this.selectionEndMouse.x, this.selectionEndMouse.y,
                ctx,
                this.graphData,
                this.graph,
                this.colorScale
            )
        }
    }

    //====================================================================================
    // Interaction Modes
    //====================================================================================
    // hoverAtPos(ox: number, oy: number) {
    //     // console.log(ox.value, oy.value);
    //     const screenX = ox / 1000 * this.graph.width();
    //     const screenY = oy / 1000 * this.graph.height();
    //     const { x, y } = this.graph.screen2GraphCoords(screenX, screenY);

    //     const nodes = this.graph.graphData().nodes;
    //     const node = nodes.find(n => {
    //         const dx = n.x - x;
    //         const dy = n.y - y;
    //         return Math.sqrt(dx * dx + dy * dy) < this.degree[n.id];
    //     });
    //     if (node) { console.log("EL NODINO LOCALINO", node, x, y); this.selectNode(node); };
    // }

    private targets = new Map<string, { x?: number; y?: number }>();
    private rafId: number | null = null;
    private readonly smoothing = 0.15; // 0-1, lower = smoother

    moveNode(id: string, dimension: string, value: number) {
        const node = this.getNodeAtID(id);
        if (!node) return;

        const t = this.targets.get(id) ?? {};
        if (dimension === "x") t.x = value;
        else if (dimension === "y") t.y = value;
        else return;
        this.targets.set(id, t);

        // pin at current position so interpolation starts from where it is
        if (node.fx == null) node.fx = node.x;
        if (node.fy == null) node.fy = node.y;

        if (this.rafId === null) this.rafId = requestAnimationFrame(this.step);
    }

    private step = () => {
        let active = false;

        for (const [id, t] of this.targets) {
            const n = this.getNodeAtID(id);
            if (!n) { this.targets.delete(id); continue; }

            if (t.x !== undefined) {
                n.fx += (t.x - n.fx) * this.smoothing;
                if (Math.abs(t.x - n.fx) < 0.1) { n.fx = t.x; delete t.x; }
                else active = true;
            }
            if (t.y !== undefined) {
                n.fy += (t.y - n.fy) * this.smoothing;
                if (Math.abs(t.y - n.fy) < 0.1) { n.fy = t.y; delete t.y; }
                else active = true;
            }
            if (t.x === undefined && t.y === undefined) this.targets.delete(id);
        }

        this.graph.d3ReheatSimulation(); // replace `graph` with your ForceGraph instance, so it redraws

        this.rafId = active ? requestAnimationFrame(this.step) : null;
    };
    // moveNode(id: string, dimension: string, value: number) {
    //     const movingNode = this.getNodeAtID(id);
    //     console.log("MOVING", dimension)
    //     switch (dimension) {
    //         case "x":
    //             console.log("dimension is x");
    //             //add an interpolation here
    //             movingNode.fx = value;
    //             break;
    //         case "y":
    //             console.log("dimension is y");
    //             movingNode.fy = value;
    //             break;
    //     }
    //     this.graph.d3ReheatSimulation(); // replace `graph` with your ForceGraph instance
    // }

    //CLAUDE GENERATED FUNCTION
    hoverAtPos(ox: number, oy: number) {
        // Max sends 0..1000; clamp in case of overshoot
        const nx = Math.min(Math.max(ox / 1000, 0), 1);
        const ny = Math.min(Math.max(oy / 1000, 0), 1);

        // Use CSS-pixel dimensions, not canvas.width (which includes devicePixelRatio)
        const screenX = nx * this.graph.width();
        const screenY = ny * this.graph.height();
        const { x, y } = this.graph.screen2GraphCoords(screenX, screenY);

        const zoom = this.graph.zoom();          // graph units -> screen px
        const minRadius = 12 / zoom;             // at least ~12px on screen

        let closest: any = null;
        let closestDist = Infinity;

        for (const n of this.graph.graphData().nodes as any[]) {
            if (n.x == null || n.y == null) continue;

            const dx = n.x - x;
            const dy = n.y - y;
            const dist = Math.hypot(dx, dy);

            const radius = Math.max(this.degree[n.id] ?? 0, minRadius);
            if (dist < radius && dist < closestDist) {
                closest = n;
                closestDist = dist;
            }
        }

        if (closest && closest !== this.selectionState.selectedNodes[0]) {   // avoid re-selecting each message
            this.selectionState.selectedNodes[0] = closest;
            this.selectNode(closest);
        }
    }

    // Function that determines where to move when wasd or arrows are moved
    navigate(direction: Direction) {
        if (!this.selectionState.selectedNodes[0] || !this.graphData) return;
        // TODO Direction add toggle to choose connected vs closer or external control
        const nextNode = navigateInDirection(this.selectionState.selectedNodes[0], direction, this.graphData, true);
        if (nextNode) {
            // Always call this.selectNode so everything stays the same
            this.selectNode(nextNode);
            // console.log("SELECTED", nextNode);
        }
    }
    // Rhythmic interaction mode
    rhythm() {
        if (!this.selectionState.selectedNodes[0] || !this.graphData || !this.graph) return;
        //TODO: APPLY stats of current cluster
        highlightNeighborsGradually(this.selectionState.selectedNodes[0], this.graph, this.graphData.nodes, this.graphData.links, this.selectionState);
    }
    // Transition interaction mode
    transition() {
        if (!this.selectionState.selectedNodes || !this.graphData) return;
        console.log(this.selectionState.selectedNodes);
        //for any combination of nodes find a path that traverse them
    }
    //=======================================================================================
    // Creative Mode Components
    //=======================================================================================
    setupCreativeConfig() {
        // TODO: function to enable creative mode, which causes the graph to be more static
        // creativeConfig;
        // this.graph?.d3VelocityDecay(1)
    }
    //Maybe here lifeDeathNode() if background if not call the other IDK
    createNode(e: MouseEvent) {
        // Create a new node at position
        if (this.config.current.creative.modeEnabled) {
            this.pushUndo();
            if (!this.graph || !this.graphData) return [];
            const { x, y } = this.graph.screen2GraphCoords(e.layerX, e.layerY)
            this.position = { x, y }
            // Basic metadata created here, but can be edited in the information view
            const newNodeID = createNewNode(this.graphData, this.position.x, this.position.y, this.config.current.newName);
            this.updateGraphData();
            this.selectNode(this.getNodeAtID(newNodeID));
        }
    }

    get graphAll() {
        if (!this.graphData) return [];
        return this.graphData
    }

    killNode() {
        // Function that calls removeNode which deletes the selected node
        // Should also delete the selectedNodes
        if (!this.config.current.creative.modeEnabled || !this.selectionState.selectedNodes || !this.graphData) return;
        this.pushUndo();
        // TODO use selectedNodes instead of selected node
        for (const el of this.selectionState.selectedNodes) {
            new Notice(`Deleting ${el.id}`);
            const deletedId = el.id;
            removeNode(el, this.graphData);
            // // Also drop any link referencing the deleted node,
            // // handling both raw ids and force-graph-resolved node objects
            this.graphData.links = this.graphData.links
                .filter(link => {
                    const s = link.source.id ?? link.source;
                    const t = link.target.id ?? link.target;
                    return s !== deletedId && t !== deletedId;
                })
                .map(link => ({
                    source: link.source.id ?? link.source,
                    target: link.target.id ?? link.target
                }));
            this.selectionState.selectedNodes = this.selectionState.selectedNodes.filter(n => n.id !== deletedId);
        }
        this.resetColor();
        this.updateGraphData();
    }
    //=======================================================================================
    // Cursor Utilities
    //=======================================================================================
    pencilCursor() { this.cursor.pencilCursor(); };
    resetPencilCursor() { this.cursor.resetCursor(); };
    crossCursor() { this.cursor.crossCursor(); };
    resetCrossCursor() { this.cursor.resetCursor(); };

    public createColorScale() {
        if (!this.graphData) return;
        // const nodes = this.graphData.nodes;
        // //change here so new colorscale can get created with different configs, maybe just for each class a specific color? idk
        // const userValues = [
        //     ...new Set(nodes.map((node) => node.openacces)),
        // ];
        // console.log(userValues);
        const COLORS = this.config.current.colors;
        const statuses = Object.keys(COLORS);
        // Map custom colors to the domain values
        return d3
            .scaleOrdinal()
            .domain(statuses)
            .range(
                statuses.map((color) =>
                    COLORS[color as keyof typeof COLORS] || COLORS.closed
                    // OPENACCESS[color] || "#84848466"
                ),
            )
            .unknown(COLORS.closed);
    }

    removeMetadata(metaName: any) {
        if (!this.graphData) return;
        this.pushUndo();
        // here I have to pass the exact instance of link: {source: ...; target: ...}
        if (!this.selectionState.selectedNodes[0]) return;
        // console.log(this.selectionState.selectedNodes[0][metaName]);
        delete this.selectionState.selectedNodes[0][metaName];

        this.updateGraphData();
    }
    //=======================================================================================
    // Cleanup
    //=======================================================================================
    setupBackgroundClick() {
        // Add event listener to background clicks
        // Reset selections
        this.selectionState.selectedNodes = [];
        clearRhythmAnimations();
        this.resetColor();
        // highlightedPath = [];
        // clearActiveAnimations();
        // clearTransitionAnimations();
        // this.graph.nodeColor((node) => this.colorScale(node.openacces));
        // Reset link coloring and width
        // graph.linkCurvature(0.2)
        // graph.linkWidth(node => node.weight / 2.0)
        // console.log(this.graph.screen2GraphCoords)
    }
    clearSelection() {
        this.selectionStartMouse = null
        this.selectionEndMouse = null
    }
    // Main Destructor function
    close() {
        this.selectionState.selectedNodes[0] = {};
        this.graphData = null;
        this.graph = null;
        // this.oscManager = null;
        // this.colorScale = null;
        // this.previousSelectedId = null;
    }
}
export const createGraphState = (oscManager: OSCManager, config: Config) => new GraphState(oscManager, config);