import type { NodeObject } from "force-graph";

export const idOf = (n: string | number | NodeObject | undefined) =>
  typeof n === "object" ? n.id : n;
export const idStr = (n: string | number | NodeObject | undefined) => String(idOf(n));