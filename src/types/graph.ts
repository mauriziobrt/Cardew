import type { NodeObject, LinkObject, GraphData } from "force-graph";
import type ForceGraph from "force-graph";
export type MyGraphData = GraphData<MyNode, MyLink>;
export type MyGraph = ForceGraph<MyNode, MyLink>;

export interface MyNode extends NodeObject {
  className?: string;
  openacces?: string;
  highlighted?: boolean;
  [key: string]: any;
}

export interface MyLink extends LinkObject<MyNode> {
  weight?: number;
}