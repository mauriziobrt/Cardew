import type { LinkObject, NodeObject } from "force-graph";
import type { SelectionState } from "src/state/selectionState.svelte";

let activeTimeouts: ReturnType<typeof setTimeout>[] = [];

// Find weight between nodes
function getWeightBetweenNodesWithDefault(links: LinkObject[], sourceId, targetId) {
    const link = links.find(link =>
        (link.source.id === sourceId && link.target.id === targetId) ||
        (link.source.id === targetId && link.target.id === sourceId)
    );
    return link ? link.weight : 0;
}

export function clearRhythmAnimations() {
    // Clear all active timeouts
    activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    activeTimeouts = []; // Reset the array
}

export function highlightNeighborsGradually(
    node: NodeObject,
    graph: any,
    nodes: NodeObject[],
    links: LinkObject[],
    selectionState: SelectionState
    //instead of passing everything I should just pass what is needed
    // degree: Record<number, number>
    //   degree: Record<number, number>,
    //   allNodes: Node[],
    //   allLinks: Link[]
): void {
    clearRhythmAnimations();

    // List of all Connected Links obtained from the Graph Data Links
    const connectedLinks = links
        .filter(link => link.source.id === node.id || link.target.id === node.id);

    // List of all Connected Nodes obtained from the Connected Links
    const connectedNodes = connectedLinks
        .map(link => link.source.id === node.id ? link.target : link.source);

    // Max Weight among all connected links
    const tmpMaxWeight = Math.max(...connectedLinks.map(link => link.weight));

    nodes.forEach(n => n.highlighted = false);
    node.highlighted = true;

    connectedNodes.forEach((neighbor) => {
        const normalizedWeight = getWeightBetweenNodesWithDefault(links, node.id, neighbor.id) / tmpMaxWeight;
        const minDelay = 50;    // ms — highest weight fires first
        const maxDelay = 3000;  // ms — lowest weight fires last

        const delay = minDelay + Math.pow(1 - normalizedWeight, 3.2) * (maxDelay - minDelay);

        // console.log({ neighbor: neighbor.id, normalizedWeight, delayMs: delay });

        const timeoutId = setTimeout(() => {
            selectionState.toggleMultiselect(true);
            selectionState.selectNode(neighbor, graph, nodes);
            selectionState.toggleMultiselect(false);
        }, delay);

        activeTimeouts.push(timeoutId);
    });
}