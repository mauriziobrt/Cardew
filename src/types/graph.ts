import type { NodeObject, LinkObject } from "force-graph";

export interface MyNode extends NodeObject {
  className?: string;
  openacces?: string;
  highlighted?: boolean;
  [key: string]: any;
}

export interface MyLink extends LinkObject<MyNode> {
  weight?: number;
}