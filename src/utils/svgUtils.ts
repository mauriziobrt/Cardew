//===============================================================
// SVGS - 
// CLAUDE FROM HERE
// To take this code, put it into separate files, then create 
// a new View, for the editing also. So this should stay in
// Utils. And then people can have their own svgs, but also
// there are some standard ones. So they should be located
// in different parts of the code.
//===============================================================
export type SvgIcon = { path: Path2D; w: number; h: number };

export function parseSvg(svgText: string): SvgIcon {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const [, , w, h] = doc.documentElement
        .getAttribute("viewBox")!
        .split(/[\s,]+/)
        .map(Number);
    const path = new Path2D();
    doc.querySelectorAll("path").forEach((el) =>
        path.addPath(new Path2D(el.getAttribute("d")!)),
    );
    return { path, w, h };
}

export function drawSvg(
    icon: SvgIcon,
    x: number,
    y: number,
    r: number,
    ctx: CanvasRenderingContext2D,
) {
    const scale = (2 * r) / Math.max(icon.w, icon.h);
    const m = new DOMMatrix()
        .translate(x, y)
        .scale(scale)
        .translate(-icon.w / 2, -icon.h / 2);
    const placed = new Path2D();
    placed.addPath(icon.path, m);
    ctx.fill(placed);
}