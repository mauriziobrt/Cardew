import type { MyNode } from "src/types/graph";
import type { MyLink } from "src/types/graph";
import type { SelectionState } from "src/state/selectionState.svelte";
import { idOf } from "src/utils/graphUtils";

let activeTimeouts: ReturnType<typeof setTimeout>[] = [];

// Find weight between nodes
function getWeightBetweenNodesWithDefault(links: MyLink[], sourceId: string | number | undefined, targetId: string | number | undefined) {
    const link = links.find(link =>
        (idOf(link.source) === sourceId && idOf(link.target) === targetId) ||
        (idOf(link.source) === targetId && idOf(link.target) === sourceId)
    );
    return link?.weight ?? 0;
}

export function clearRhythmAnimations() {
    // Clear all active timeouts
    activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    activeTimeouts = []; // Reset the array
}

export function highlightNeighborsGradually(
    node: MyNode,
    graph: any,
    nodes: MyNode[],
    links: MyLink[],
    selectionState: SelectionState
    //instead of passing everything I should just pass what is needed
    // degree: Record<number, number>
    //   degree: Record<number, number>,
    //   allNodes: Node[],
    //   allLinks: Link[]
): void {
    clearRhythmAnimations();

    const nodeById = new Map(nodes.map(n => [n.id, n]));

    // List of all Connected Links obtained from the Graph Data Links
    const connectedLinks = links
        .filter(link => idOf(link.source) === node.id || idOf(link.target) === node.id);

    // List of all Connected Nodes obtained from the Connected Links
    // const connectedNodes = connectedLinks.map(link => idOf(link.source) === node.id ? link.target : link.source);

    const connectedNodes = connectedLinks.flatMap(link => {
        const otherId = idOf(link.source) === node.id ? idOf(link.target) : idOf(link.source);
        const other = nodeById.get(otherId);
        return other ? [other] : [];
    });

    // Max Weight among all connected links
    const tmpMaxWeight = Math.max(...connectedLinks.map(link => link.weight ?? 0));

    nodes.forEach(n => n.highlighted = false);
    node.highlighted = true;

    connectedNodes.forEach((neighbor) => {
        if (!links || !node || !neighbor) return;
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