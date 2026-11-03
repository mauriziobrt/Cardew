// claude generated utils to fix type errors
import type { OSCValue } from "src/osc/osc";

export function oscRaw(arg: OSCValue | undefined): string | number | boolean | null | undefined {
    return arg !== null && typeof arg === "object" ? arg.value : arg;
}

export function oscNumber(arg: OSCValue | undefined): number {
    const v = oscRaw(arg);
    return typeof v === "number" ? v : Number(v);   // NaN if missing or non-numeric
}

export function oscString(arg: OSCValue | undefined): string {
    const v = oscRaw(arg);
    return v === undefined ? "" : String(v);
}