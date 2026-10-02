import type { GraphData, NodeObject } from "force-graph";
import type { Config } from "config.svelte";
import type { GraphState } from "../state/graphState.svelte";
// Create nodes based on some key + click, it works if creative mode is enabled. 
// when background click if there are combos of actions then create a new node. also should be callable from osc.
// TODO: callable from osc

// Creative Mode is active when the setting is true
// There is a sandbox graph

// if creative mode stop forces and everything of that sort. user determines location
let nodeIdCounter = 0;
export function createNewNode(
    graphData: any,
    graph: any,
    x: number,
    y: number
): void {
    // let coords = graph.screen2GraphCoords(MouseEvent.clientX, MouseEvent.clientY);
    let nodeId = nodeIdCounter++;
    graphData.nodes.push({ id: nodeId, x: x, y: y, name: 'node_' + nodeId });
    console.log(graphData.nodes);
}

export function removeNode(
    //which one is the selected node?
    node: NodeObject,
    graphData: any,
): void {
    const link = graphData.link;
    graphData.links.filter(link => link.source === node || link.target === node).forEach(link => removeLink(link, graphData));
    graphData.nodes.splice(graphData.nodes.indexOf(node), 1);
};

function removeLink(
    link: any,
    graphData: any
): void {
    graphData.links.splice(graphData.links.indexOf(link), 1);
};

export function creativeConfig(
    // if creativeMode enabled then change to creative config mode
    // so force and stuff is blocked a bit
    config: Config,
    graphState: GraphState
): void {
    config.update({ graph: { nodeSize: 1 } });
    config.updateGraph({ alphaDecay: 0 });
    config.updateGraph({ nodeSize: 0.1 });
    graphState.graph?.nodeSize(100);
    graphState.graph?.d3AlphaDecay(0);
}
