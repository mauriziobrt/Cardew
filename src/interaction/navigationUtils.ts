import type { GraphData, NodeObject, LinkObject } from "force-graph";


// interface Node {
//     id: number;
//     group: number;
//     x?: number;
//     y?: number;
//     z?: number;
// }

// interface Link {
//     source: number | Node;
//     target: number | Node;
// }

export type Direction = 'up' | 'down' | 'left' | 'right';

function findClosestNodeInDirection(
    currentNodeId: number,
    direction: Direction,
    graphData: GraphData,
    freeMode: any
    // currentNode: Node
): NodeObject | null {
    // Find closest node in the given direction
    // based on x, y coordinates
    // console.log("NODES", graphData.nodes)
    // const nodes = graphData().nodes;
    const connectedLinks = graphData.links
        .filter(link => link.source.id === currentNodeId || link.target.id === currentNodeId);

    const connectedNodes = connectedLinks
        .map(link => link.source.id === currentNodeId ? link.target : link.source);
    // console.log(connectedNodes)
    const nodes = graphData.nodes;
    if (!nodes || nodes.length === 0) return null;

    // // Find the current node by ID instewad of using stale reference
    const currentNode = nodes.find(node => node.id === currentNodeId);
    // // console.log("CURRENT NODE IS", currentNode)
    if (!currentNode) {
        console.warn(`Current node with ID ${currentNodeId} not found in graph data`);
        return null;
    }
    // Ensure we have valid coordinates (force simulation might still be running)
    if (currentNode.x === undefined || currentNode.y === undefined) {
        console.warn('Current node coordinates not yet available');
        return null;
    }

    const currentX = currentNode.x ?? 0;
    const currentY = currentNode.y ?? 0;

    function isInDirection(angle: number, targetDirection: string) {
        // Normalize angle to range [0, 2π)
        const a = (angle + 2 * Math.PI) % (2 * Math.PI);

        const ranges = {
            'right': [7 * Math.PI / 4, Math.PI / 4],      // 315°–45°
            'up': [Math.PI / 4, 3 * Math.PI / 4],         // 45°–135°
            'left': [3 * Math.PI / 4, 5 * Math.PI / 4],   // 135°–225°
            'down': [5 * Math.PI / 4, 7 * Math.PI / 4],   // 225°–315°
        };

        const [start, end] = ranges[targetDirection];

        if (start < end) {
            return a >= start && a <= end;
        } else {
            // Handles wrap-around (e.g., right: 315°–45°)
            return a >= start || a <= end;
        }
    }

    const MIN_DISTANCE_SQUARED = 0;
    let closest = null;
    let closestDistanceSquared = Infinity;
    let navNode = null;
    if (freeMode == true) {
        navNode = nodes;
    } else {
        navNode = connectedNodes;
    }

    for (const node of navNode) {
        // console.log("Node count:", nodes.length, "Unique IDs:", new Set(nodes.map(n => n.id)).size);

        if (node.id === currentNodeId) continue; // Compare by ID, not reference

        const nodeX = node.x ?? 0;
        const nodeY = node.y ?? 0;

        const dx = nodeX - currentX;
        const dy = nodeY - currentY;

        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < MIN_DISTANCE_SQUARED) continue;

        const angle = Math.atan2(-dy, dx);

        if (isInDirection(angle, direction) && distanceSquared < closestDistanceSquared) {
            closest = node;
            closestDistanceSquared = distanceSquared;
        }
    }
    return closest; // Returns the fresh node object from current graph data
}

export function navigateInDirection(
    currentNode: NodeObject,
    direction: Direction,
    graphData: GraphData,
    freeMode: any
): NodeObject | null {
    return findClosestNodeInDirection(currentNode.id, direction, graphData, freeMode);
}