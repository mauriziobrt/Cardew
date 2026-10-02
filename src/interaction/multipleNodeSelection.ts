// if click and drag create rectangular selection
// i need to get the mouse position, then to draw a rectangle under mouse position
// then every node that matches these values get selected
// then they stay selected until I do a background click
// multiple nodes could also be selected when clicking and pressing the shift key

import type { GraphData } from "force-graph"
import type { GraphState } from "src/state/graphState.svelte"

// ISSUE selected nodes should be the same as
//=======================================================================================
// INTERNAL FUNCTIONS
//=======================================================================================
let selectedNodes: any[] = []
//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function positionSelection(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    graphData: GraphData,
    graph: GraphState,
    colorScale: d3.ScaleOrdinal<string, string>
): any[] {
    const minX = Math.min(startX, endX)
    const maxX = Math.max(startX, endX)
    const minY = Math.min(startY, endY)
    const maxY = Math.max(startY, endY)
    // Select the nodes based on position I need to pass the node data structure
    selectedNodes = graphData.nodes.filter(n =>
        n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY
    )
    // console.log(selectedNodes)
    // return the nodes to highlight
    // for now maybe just highlight them depending on this so that they are clean
    // I will clean up later, now I need to have the functionalities
    // So for each selected nodes color it
    // also I will need this for multiple selection after when I want to select multiple
    // nodes by pressing a single key and also if I want to send them as a single packet.
    // which action are available with multiselection? multidelete, multisend, 
    // analysis (also musicological maybe include mean centroid etc..)
    // console.log(graph.nodeColor())
    graph.nodeColor(n =>
        selectedNodes.some(s => s.id === n.id) ? 'yellow' : colorScale(n.openacces));
    // console.log("Selected many nodes:", [...selectedNodes]);
    graph.selectedNodes = [...selectedNodes]
    // console.log("TEST", [...selectedNodes])
    return [...selectedNodes]
    // this.graph.nodeColor(n => n.id === this.selectedNode.id ? 'red' : this.colorScale(n.openacces));
}
//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function drawRectangle(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    ctx: CanvasRenderingContext2D,
): void {

    const x = Math.min(startX, endX)
    const y = Math.min(startY, endY)
    const w = Math.abs(endX - startX)
    const h = Math.abs(endY - startY)

    ctx.save()
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.52)'
    ctx.fillStyle = 'rgba(118, 117, 117, 0.43)'
    ctx.lineWidth = 2;// / globalScale

    ctx.fillRect(x, y, w, h)
    ctx.strokeRect(x, y, w, h)
    ctx.restore()
}
//=======================================================================================
// EXPORT FUNCTION
//=======================================================================================
export function rectangleMultiSelect(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    ctx: CanvasRenderingContext2D,
    graphData: any,
    graph: any,
    colorScale: d3.ScaleOrdinal<string, string>
): any[] {
    drawRectangle(startX, startY, endX, endY, ctx);
    return positionSelection(startX, startY, endX, endY, graphData, graph, colorScale)
}
