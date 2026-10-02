export type FieldType = "text" | "number" | "checkbox" | "list";
export interface FieldDef { type: FieldType; integer?: boolean; min?: number; max?: number; }
export type TypeRegistry = Record<string, FieldDef>;

export function inferDef(value: any): FieldDef {
  if (typeof value === "boolean") return { type: "checkbox" };
  if (typeof value === "number") return { type: "number" };
  if (Array.isArray(value)) return { type: "list" };
  return { type: "text" };
}

export function defaultFor(def: FieldDef): any {
  switch (def.type) {
    case "number": return def.min ?? 0;
    case "checkbox": return false;
    case "list": return [];
    default: return "";
  }
}

// Soft validation: returns an error message or null. Never changes the value.
export function validate(value: any, def: FieldDef): string | null {
  if (def.type === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) return "Not a number";
    if (def.integer && !Number.isInteger(value)) return "Must be an integer";
    if (def.min !== undefined && value < def.min) return `Minimum is ${def.min}`;
    if (def.max !== undefined && value > def.max) return `Maximum is ${def.max}`;
  }
  if (def.type === "checkbox" && typeof value !== "boolean") return "Not a checkbox value";
  if (def.type === "list" && !Array.isArray(value)) return "Not a list";
  return null;
}