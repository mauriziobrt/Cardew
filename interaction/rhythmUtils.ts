let activeTimeouts: ReturnType<typeof setTimeout>[] = [];

// Find weight between nodes
function getWeightBetweenNodesWithDefault(data, sourceId, targetId) {
    const link = data.links.find(link =>
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
    node: Node,
    graphData: any,
    osc: any,
    graph: any,
    colorScale: d3.ScaleOrdinal<string, string>

    // degree: Record<number, number>
    //   degree: Record<number, number>,
    //   allNodes: Node[],
    //   allLinks: Link[]
): void {
    clearRhythmAnimations();

    // List of all Connected Links obtained from the Graph Data Links
    const connectedLinks = graphData.links
        .filter(link => link.source.id === node.id || link.target.id === node.id);

    // List of all Connected Nodes obtained from the Connected Links
    const connectedNodes = connectedLinks
        .map(link => link.source.id === node.id ? link.target : link.source);

    // Max Weight among all connected links
    const tmpMaxWeight = Math.max(...connectedLinks.map(link => link.weight));

    graphData.nodes.forEach(n => n.highlighted = false);
    node.highlighted = true;

    connectedNodes.forEach((neighbor) => {
        const normalizedWeight = getWeightBetweenNodesWithDefault(graphData, node.id, neighbor.id) / tmpMaxWeight;

        const minDelay = 50;    // ms — highest weight fires first
        const maxDelay = 3000;  // ms — lowest weight fires last

        const delay = minDelay + Math.pow(1 - normalizedWeight, 3.2) * (maxDelay - minDelay);

        // console.log({ neighbor: neighbor.id, normalizedWeight, delayMs: delay });

        const timeoutId = setTimeout(() => {
            neighbor.highlighted = true;
            graph.nodeColor((n: Node) => n.highlighted ? 'red' : colorScale(n.openacces));
            osc.sendMessage('/rhythm', [
                neighbor.id, neighbor.openacces, neighbor.citations,
                55, 1000, neighbor.year, neighbor.x, neighbor.y, 1, 55, 800
            ]);
        }, delay);

        activeTimeouts.push(timeoutId);
    });
}