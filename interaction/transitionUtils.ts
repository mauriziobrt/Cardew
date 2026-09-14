interface Node {
    id: number;
    group: number;
    x?: number;
    y?: number;
    z?: number;
}

interface Link {
    source: number | Node;
    target: number | Node;
}

// interface GraphData {
//     nodes: Node[];
//     links: Link[];
// }

type Direction = 'up' | 'down' | 'left' | 'right';

export function findShortestPath(
    startNode: Node,
    graph: Graph,
    endNode: Node,
): void {
    const nodes = graph.graphData().nodes
    const links = graph.graphData().links

    const adjacencyList = {}
    // nodes.forEach(node => { adjacencyList[node.id] = [] })
    
    // links.forEach(link => {
    //     const source = typeof link.source === 'object' ? link.source.id : link.source
    //     const target = typeof link.target === 'object' ? link.target.id : link.target
    //     adjacencyList[source].push({ node: target, link: link })
    //     adjacencyList[target].push({ node: source, link: link })
    // })

    // const queue = [{ node: startNode.id, path: [], links: [] }]
    // const visited = new Set([startNode.id])

    // while (queue.length > 0) {
    //     const { node, path, links } = queue.shift()

    //     if (node === endNode.id) {
    //         return { path: [...path, node], links: links }
    //     }

    //     adjacencyList[node].forEach(neighbor => {
    //         if (!visited.has(neighbor.node)) {
    //             visited.add(neighbor.node)
    //             queue.push({
    //                 node: neighbor.node,
    //                 path: [...path, node],
    //                 links: [...links, neighbor.link]
    //             })
    //         }
    //     })
    // }

    // return { path: [], links: [] }
}

export function connectSelectedNodes(
    selectedNode: Node,
    graphData: GraphData,
    endNode: Node,
): void {
}

export function transition(
    currentNode: Node,
    direction: Direction,
    graphData: GraphData,
    freeMode: any
): void {
}