import type { GraphData, LinkObject } from "force-graph";
import type { MyNode } from "src/types/graph";

type Direction = 'up' | 'down' | 'left' | 'right';

export function findShortestPath(
    startNode: MyNode,
    graphData: GraphData,
    endNode: MyNode,
): {} {
    const nodes = graphData.nodes
    const links = graphData.links

    const adjacencyList = {}
    nodes.forEach(node => { adjacencyList[node.id] = [] })
    
    links.forEach(link => {
        const source = typeof link.source === 'object' ? idOf(link.source) : link.source
        const target = typeof link.target === 'object' ? idOf(link.target) : link.target
        adjacencyList[source].push({ node: target, link: link })
        adjacencyList[target].push({ node: source, link: link })
    })

    const queue = [{ node: startNode.id, path: [], links: [] }]
    const visited = new Set([startNode.id])

    while (queue.length > 0) {
        const { node, path, links } = queue.shift()

        if (node === endNode.id) {
            return { path: [...path, node], links: links }
        }

        adjacencyList[node].forEach(neighbor => {
            if (!visited.has(neighbor.node)) {
                visited.add(neighbor.node)
                queue.push({
                    node: neighbor.node,
                    path: [...path, node],
                    links: [...links, neighbor.link]
                })
            }
        })
    }

    return { path: [], links: [] }
}

export function connectSelectedNodes(
    selectedNode: MyNode,
    graphData: GraphData,
    endNode: MyNode,
): void {

}

export function transition(
    currentNode: MyNode,
    direction: Direction,
    graphData: GraphData,
    freeMode: any
): void {
}