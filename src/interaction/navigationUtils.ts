import type { GraphData, LinkObject } from "force-graph";
import type { MyNode } from "src/types/graph";
import { idOf } from "src/utils/graphUtils";

export type Direction = 'up' | 'down' | 'left' | 'right';

function findClosestNodeInDirection(
    currentNodeId: MyNode["id"],
    direction: Direction,
    graphData: GraphData,
    freeMode: string
    // currentNode: Node
): MyNode | null {
    // Find closest node in the given direction
    // based on x, y coordinates
    // console.log("NODES", graphData.nodes)
    // const nodes = graphData().nodes;
    // First we filter all links and find the ones where our node exists
    const connectedLinks = graphData.links
        .filter(link => idOf(link.source) === currentNodeId || idOf(link.target) === currentNodeId);

    // Then we retrieve the nodes, I don't know why
    //visually it prints before moving to the direction so that's why it seems like it uses two nodes instead of one
    const connectedNodes = connectedLinks
        .map(link => idOf(link.source) === currentNodeId ? [link.target, "out"] : [link.source, "in"]);
    const outNodes = connectedNodes.filter(link => link[1] === "out")
    const filteredOutNodes = outNodes.map(link => link[0])

    const allConnectedNodes = connectedLinks.map(link => idOf(link.source) === currentNodeId ? link.target : link.source);
    // console.log(filteredOutNodes, "CIAOOOO")
    // console.log(connectedNodes[0], connectedNodes[1])

    // wait we have a currentNode, we just need to check if it is target or source
    // const directionAtNode = connectedLinks;
    // console.log(connectedLinks)
    // const directionLinks = connectedLinks.map(link => idOf(link.source) === currentNodeId || link.source === currentNodeId ? "out" : "in")
    // console.log(directionLinks)

    // only nav to nodes in out direction
    // const direction =     if (idOf(link.source) === node.id || link.source === node.id) {
    //          "out"
    //     } else {
    //          "in"
    //     }

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

    function isInDirection(angle: number, targetDirection: Direction) {
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
    if (freeMode == "free") {
        navNode = nodes;
    } else if (freeMode == "cldir") {
        navNode = filteredOutNodes;
    } else if (freeMode == "cl") {
        navNode = allConnectedNodes;
    }

    if (navNode)
    for (const node of navNode) {
        // console.log("Node count:", nodes.length, "Unique IDs:", new Set(nodes.map(n => n.id)).size);
        if (node)
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
    currentNode: MyNode,
    direction: Direction,
    graphData: GraphData,
    freeMode: any
): MyNode | null {
    return findClosestNodeInDirection(currentNode.id, direction, graphData, freeMode);
}