import { navigateInDirection } from './interaction/navigationUtils';
import { highlightNeighborsGradually, clearRhythmAnimations } from "./interaction/rhythmUtils"
import { createNewNode, removeNode, creativeConfig } from 'interaction/creativeMode';
import { rectangleMultiSelect } from 'interaction/multipleNodeSelection';
import * as d3 from "d3";
import type { OSCManager } from 'osc/osc';
import type { Config } from 'config.svelte';
import type { GraphData } from 'force-graph';
import type ForceGraph from 'force-graph';
//import type { Stats } from 'stats.svelte';
//=======================================================================================
// Main Graph Class most operations appear here
//=======================================================================================
export class GraphState {
    //====================================================================================
    // Graph variables
    //====================================================================================
    oscManager: OSCManager;
    config: Config;
    // selectedNode = $state<Node | null>(null);
    selectedNode = $state(null) as Node | null;
    selectedNodes = $state<Array<Node>>([]);
    selectedNodeIndex = $state<number | null>(null);
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
    //====================================================================================
    // Declare class properties
    //====================================================================================
    private colorScale!: d3.ScaleOrdinal<string, string>;
    private previousSelectedId: string | null = null;
    // Positional Properties
    //––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
    private position: { x: number, y: number } | null = null;
    private selectionStartMouse: { x: number, y: number } | null = null;
    private selectionEndMouse: { x: number, y: number } | null = null
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
    theGraph(graph: Graph) {
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
        data.links.forEach(link => {
            // console.log(link.source, link.target, link.weight);
            this.degree[link.source] = (this.degree[link.source] || 0) + 1;
            this.degree[link.target] = (this.degree[link.target] || 0) + 1;
        });
    }
    updateGraphData() {
        if (!this.graphData) return [];
        this.graph.graphData({ nodes: this.graphData.nodes, links: this.graphData.links });
        this.updateDegree()
    };

    get allNodeIds() {
        if (!this.graphData) return [];
        return this.graphData.nodes.map(n => n.id)
    }

    updateDegree() {
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
    }

    undo() {
        if (this.undoStack.length === 0 || !this.graphData) return;
        const current = this.snapshot();
        const previous = this.undoStack.pop()!;
        this.redoStack.push(current);

        previous.links = previous.links.map(link => ({
            source: link.source.id ?? link.source,
            target: link.target.id ?? link.target
        }));

        this.graphData = previous;
        this.selectedNode = null;
        this.selectedNodeIndex = null;
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
        this.selectedNode = null;
        this.selectedNodeIndex = null;
        this.updateGraphData();
    }

    //====================================================================================
    // Link Editing
    //====================================================================================

    get selectedNodeLinks() {
        if (!this.selectedNode || !this.graphData) return [];
        // So first I create a set to avoid duplicates that filters through the link and get the full link where either it is the source or the target
        const onlyIDs = new Set(this.graphData.links.filter(
            link =>
                link.source.id === this.selectedNode.id ||
                link.target.id === this.selectedNode.id
        )
            .flatMap(link => [link.source.id, link.target.id])); //flatmap flattens it but I'm still not sure what it does actually

        // there are no duplicates but now I need to create an array from this probably there's a quick
        // way.
        // I return as array because it was returning a set, so this set -> array allows to have an array with duplicates
        // It is also displaying the selected link ID, I should remove that
        onlyIDs.delete(this.selectedNode.id)
        // And now I have the clean array
        // I should get two things the raw links and the flatmap
        return Array.from(onlyIDs)
    }

    get selectedNodeRawLinks() {
        if (!this.selectedNode || !this.graphData) return [];
        return this.graphData.links.filter(
            link =>
                link.source.id === this.selectedNode.id ||
                link.target.id === this.selectedNode.id
        )
    }

    editLink(link: Link, newTargetId) {
        if (!this.graphData || !this.selectedNode) return;
        if (newTargetId === this.selectedNode.id) return;
        this.pushUndo();
        if (link.source.id === this.selectedNode.id || link.source === this.selectedNode.id) {
            link.target = newTargetId;
        } else {
            link.source = newTargetId;
        }
        this.updateGraphData();
    }

    addLink(targetId: string | number) {
        if (!this.graphData || !this.selectedNode) return;
        //to add a link I need to get the link ID  and a targetId that has to be a node existing in the graph
        const sourceId = this.selectedNode.id;
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

    removeLink(link: Link) {
        if (!this.graphData) return;
        this.pushUndo();
        // here I have to pass the exact instance of link: {source: ...; target: ...}
        this.graphData.links = this.graphData.links.filter(
            l => l !== link
        );

        this.updateGraphData();
    }

    highlightLink(link: Link) {
        if (!this.graph) return;
        this.graph.nodeColor(n =>
            n.id === link.source.id || n.id === link.target.id ? 'red' : this.colorScale(n.openacces)
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
    toggleMultiselect(toggle: boolean) {
        this.multiSelect = toggle;
        console.log(this.multiSelect)
    }
    // Function that decides the behaviour of the graph when a node is selected
    selectNode(node: Node) {
        if (!this.graph || !this.graphData) return;
        const prevId = this.previousSelectedId;
        this.selectedNode = node;
        if (this.selectedNode.id) {
            this.previousSelectedId = node.id;
            this.selectedNodeIndex = this.graphData.nodes.indexOf(node);
            // this.graph.nodeColor((node) => this.colorScale(node.openacces));
            if (this.multiSelect) {
                // if it's not there yet then add - don't create duplicates
                if (!this.selectedNodes.includes(this.selectedNode)) {
                    this.selectedNodes.push(this.selectedNode);
                }
                console.log([...this.selectedNodes]);
                this.graph.nodeColor(n => this.selectedNodes.some(s => s.id === n.id) ? 'red' : this.colorScale(n.openacces));
            } else {
                this.graph.nodeColor(n => n.id === this.selectedNode.id ? 'red' : this.colorScale(n.openacces));
                this.graph.centerAt(this.selectedNode.x, this.selectedNode.y, 300);
                // this should be GUI composed
                this.oscManager.sendMessage('/control', [
                    node.id, node.openacces, node.citations,
                    this.degree[node.id], 1000, node.year, node.x, node.y, 2, 55, 800
                ]);

            }
        };
    }
    selectionStart(e: MouseEvent) {
        // Selection start is triggered on Mouse Down.
        const { x, y } = this.graph.screen2GraphCoords(e.layerX, e.layerY)
        this.selectionStartMouse = { x, y }
    }
    selectionEnd(e: MouseEvent) {
        // Selection end is linked with Mouse Drag
        const { x, y } = this.graph.screen2GraphCoords(e.layerX, e.layerY)
        this.selectionEndMouse = { x, y }  // just update state
    }
    drawOverlay(ctx: CanvasRenderingContext2D, globalScale: number) {
        // Function to draw on top of the canvas
        this.ctx = ctx;
        // globalScale is the zoom value but not necessary at the moment
        this.globalScale = globalScale;
        // draws the rectangle for the selection.
        if (this.selectionStartMouse && this.selectionEndMouse) {
            rectangleMultiSelect(
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
    // Function that determines where to move when wasd or arrows are moved
    navigate(direction: Direction) {
        if (!this.selectedNode || !this.graphData) return;
        // TODO Direction should be closer connected node also, add toggle to choose
        const nextNode = navigateInDirection(this.selectedNode, direction, this.graphData, true);
        if (nextNode) {
            // Always call this.selectNode so everything stays the same
            this.selectNode(nextNode);
        }
    }
    // Rhythmic interaction mode
    rhythm() {
        if (!this.selectedNode || !this.graphData || !this.graph) return;
        //TODO: APPLY stats of current cluster
        highlightNeighborsGradually(this.selectedNode, this.graphData, this.oscManager, this.graph, this.colorScale);
    }
    // Transition interaction mode
    transition() {
        if (!this.selectedNodes || !this.graphData) return;
        console.log(this.selectedNodes);
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
            if (!this.graph) return [];
            if (!this.graphData) return [];
            const { x, y } = this.graph.screen2GraphCoords(e.layerX, e.layerY)
            this.position = { x, y }
            // Basic metadata created here, but can be edited in the information view (TODO)
            createNewNode(this.graphData, this.graph, this.position.x, this.position.y);
            // let coords = this.graph.screen2GraphCoords(e.layerX, e.layerY);
            // let nodeId = this.nodeIdCounter++;
            // this.graphData.nodes.push({ id: nodeId, x: coords.x, y: coords.y });
            this.updateGraphData();
            console.log($state.snapshot(this.graphAll)); // plain object, accurate snapshot
        }
    }

    get graphAll() {
        if (!this.graphData) return [];
        return this.graphData
    }

    killNode() {
        // Function that calls removeNode which deletes the selected node
        // Should also delete the selectedNodes
        if (!this.config.current.creative.modeEnabled || !this.selectedNode || !this.graphData) return;
        this.pushUndo();
        // TODO use selectedNodes instead of selected node
        const deletedId = this.selectedNode.id;
        removeNode(this.selectedNode, this.graphData);
        // Also drop any link referencing the deleted node,
        // handling both raw ids and force-graph-resolved node objects
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

        // Also clean up multi-select if the deleted node was part of it
        this.selectedNodes = this.selectedNodes.filter(n => n.id !== deletedId);

        this.selectedNode = null; // fixes bug #3 from earlier too
        this.selectedNodeIndex = null;
        this.updateGraphData();
    }
    //=======================================================================================
    // Utilities
    //=======================================================================================
    pencilCursor() {
        const pencilCursorCSS =
            `url("data:image/svg+xml;utf8,` +
            encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
      <path d='M2 22l1.5-5.5L16 4l4 4L7.5 20.5z' fill='#fff' stroke='#000' stroke-width='1.5'/>
      <path d='M14.5 5.5l4 4' stroke='#000' stroke-width='1.5'/>
    </svg>
  `) +
            `") 2 22, crosshair`;

        const canvas = document.querySelector('canvas')
        canvas.style.cursor = pencilCursorCSS;
    }

    resetPencilCursor() {
        const canvas = document.querySelector('canvas')
        canvas.style.cursor = '';
    }

    public createColorScale() {
        if (!this.graphData) return;
        const nodes = this.graphData.nodes;
        const userValues = [
            ...new Set(nodes.map((node) => node.openacces)),
        ];
        const COLORS = this.config.current.colors;
        // Map custom colors to the domain values
        return d3
            .scaleOrdinal()
            .domain(userValues)
            .range(
                userValues.map((color) =>
                    COLORS[color as keyof typeof COLORS] || COLORS.closed
                    // OPENACCESS[color] || "#84848466"
                ),
            ); // fallback to 'closed' color
    }

    removeMetadata(metaName) {
        if (!this.graphData) return;
        this.pushUndo();
        // here I have to pass the exact instance of link: {source: ...; target: ...}
        console.log(this.selectedNode[metaName]);
        delete this.selectedNode[metaName];

        this.updateGraphData();
    }
    //=======================================================================================
    // Cleanup
    //=======================================================================================
    setupBackgroundClick() {
        // Add event listener to background clicks
        // Reset selections
        this.selectedNodes = [];
        this.selectedNode = null;
        this.selectedNodeIndex = null;
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
        this.selectedNode = null;
        this.graphData = null;
        this.graph = null;
        // this.oscManager = null;
        // this.colorScale = null;
        this.previousSelectedId = null;
    }
}
export const createGraphState = (oscManager: OSCManager, config: Config) => new GraphState(oscManager, config);
//Dead code
//=======================================================================================
// Open Access Colors
//=======================================================================================
// const OPENACCESS = {
//     gold: "#fff260a7",
//     green: "#cdfec5a6",
//     diamond: "#1eeff6a1",
//     closed: "#d4d4d466",
//     hybrid: "#cf6acc7e",
// };
