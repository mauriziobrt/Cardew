import type { GraphData } from "force-graph";
import type { Config } from "config.svelte";
import type { GraphState } from "../graphState.svelte";
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
    node: Node,
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
// Missing function to link nodes, maybe with a graphical arrow being displayed, starting at pos node (that gets updated if the node moves) 
// and where it is possible to change the directionality of the link. the directionality of the link can also be changed on click

// Function to link nodes

// <head>
//   <style> body { margin: 0; } </style>

//   <script src="//cdn.jsdelivr.net/npm/force-graph"></script>
//   <!--<script src="../../dist/force-graph.js"></script>-->
// </head>

// <body>
// <br/>
// <div style="text-align: center; color: silver">
//   <b>New node:</b> click on the canvas, <b>New link:</b> drag one node close enough to another one,
//   <b>Rename</b> node or link by clicking on it, <b>Remove</b> node or link by right-clicking on it
// </div>
//   <div id="graph"></div>

//   <script>
//     let nodeIdCounter = 0, linkIdCounter = 0;
//     let nodes = [], links = [];
//     let dragSourceNode = null, interimLink = null;
//     const snapInDistance = 15;
//     const snapOutDistance = 40;

//     const updateGraphData = () => {
//       Graph.graphData({ nodes: nodes, links: links });
//     };

//     const distance = (node1, node2) => {
//       return Math.sqrt(Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2));
//     };

//     const rename = (nodeOrLink, type) => {
//       let value = prompt('Name this ' + type + ':', nodeOrLink.name);
//       if (!value) {
//         return;
//       }
//       nodeOrLink.name = value;
//       updateGraphData();
//     };

//     const setInterimLink = (source, target) => {
//       let linkId = linkIdCounter ++;
//       interimLink = { id: linkId, source: source, target: target, name: 'link_' + linkId };
//       links.push(interimLink);
//       updateGraphData();
//     };

//     const removeLink = link => {
//       links.splice(links.indexOf(link), 1);
//     };

//     const removeInterimLinkWithoutAddingIt = () => {
//       removeLink(interimLink);
//       interimLink = null;
//       updateGraphData();
//     };

//     const removeNode = node => {
//       links.filter(link => link.source === node || link.target === node).forEach(link => removeLink(link));
//       nodes.splice(nodes.indexOf(node), 1);
//     };

//     const Graph = new ForceGraph(document.getElementById('graph'))
//         .linkDirectionalArrowLength(6)
//         .linkDirectionalArrowRelPos(1)
//         .onNodeDrag(dragNode => {
//           dragSourceNode = dragNode;
//           for (let node of nodes) {
//             if (dragNode === node) {
//               continue;
//             }
//             // close enough: snap onto node as target for suggested link
//             if (!interimLink && distance(dragNode, node) < snapInDistance) {
//               setInterimLink(dragSourceNode, node);
//             }
//             // close enough to other node: snap over to other node as target for suggested link
//             if (interimLink && node !== interimLink.target && distance(dragNode, node) < snapInDistance) {
//               removeLink(interimLink);
//               setInterimLink(dragSourceNode, node);
//             }
//           }
//           // far away enough: snap out of the current target node
//           if (interimLink && distance(dragNode, interimLink.target) > snapOutDistance) {
//             removeInterimLinkWithoutAddingIt();
//           }
//         })
//         .onNodeDragEnd(() => {
//           dragSourceNode = null;
//           interimLink = null;
//           updateGraphData();
//         })
//         .nodeColor(node => node === dragSourceNode || (interimLink &&
//                 (node === interimLink.source || node === interimLink.target)) ? 'orange' : null)
//         .linkColor(link => link === interimLink ? 'orange' : '#bbbbbb')
//         .linkLineDash(link => link === interimLink ? [2, 2] : [])
//         .onNodeClick((node, event) => rename(node, 'node'))
//         .onNodeRightClick((node, event) => removeNode(node))
//         .onLinkClick((link, event) => rename(link, 'link'))
//         .onLinkRightClick((link, event) => removeLink(link))
//         .onBackgroundClick(event => {
//           let coords = Graph.screen2GraphCoords(event.layerX, event.layerY);
//           let nodeId = nodeIdCounter ++;
//           nodes.push({ id: nodeId, x: coords.x, y: coords.y, name: 'node_' + nodeId });
//           updateGraphData();
//         });
//     updateGraphData();
//   </script>
// </body>