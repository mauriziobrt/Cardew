import type { NodeObject } from "force-graph";

export const idOf = (x: string | number | NodeObject | undefined) =>
  typeof x === "object" ? x?.id : x;