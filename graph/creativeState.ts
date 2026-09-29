import type { Config } from 'config.svelte';

//Not working yet, unsure, this is already compartmentalized

//=======================================================================================
// Creative Mode Components
//=======================================================================================
export class MetadataState {
    config: Config;

    constructor(config: Config) {
        // Called when the graphState is built
        this.config = config;
    };

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
            console.log($state.snapshot(this.graphAll));
        }
    }

    killNode() {
        // Function that calls removeNode which deletes the selected node
        // Should also delete the selectedNodes
        // TODO use selectedNodes instead of selected node
        const deletedId = this.selectionState.selectedNode.id;
        removeNode(this.selectionState.selectedNode, this.graphData);
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
        this.selectionState.selectedNodes = this.selectionState.selectedNodes.filter(n => n.id !== deletedId);

        this.selectionState.selectedNode = null;
        this.selectionState.selectedNodeIndex = null;
        this.resetColor();
        this.updateGraphData();
    }
}