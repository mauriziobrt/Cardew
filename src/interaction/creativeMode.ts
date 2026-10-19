import type { NodeObject } from "force-graph";
import type { Config } from "src/config.svelte";
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
    x: number,
    y: number,
    name: string
): string {
    // let coords = graph.screen2GraphCoords(MouseEvent.clientX, MouseEvent.clientY);
    let existingIds = new Set(graphData.nodes.map((n: any) => n.id));
    let nodeId = nodeIdCounter++;
    let id = name + nodeId;
    do {
        id = name + nodeIdCounter++;
    } while (existingIds.has(id));

    graphData.nodes.push({ id, x, y, name: id });
    return id;
    // console.log("NEW NODE", name)
    // graphData.nodes.push({ id: id, x: x, y: y, name: id });
    // console.log([...graphData.nodes]);
    // return (id);
}

export function removeNode(
    //which one is the selected node?
    node: NodeObject,
    graphData: any,
): void {
    const link = graphData.link;
    graphData.links.filter((link: { source: NodeObject; target: NodeObject; }) => link.source === node || link.target === node).forEach((link: any) => removeLink(link, graphData));
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
    // config.update({ graph: { nodeSize: 1 } });
    config.updateGraph({ alphaDecay: 0 });
    config.updateGraph({ nodeSize: 0.1 });
    graphState.graph?.nodeVal(100);
    graphState.graph?.d3AlphaDecay(0);
}
