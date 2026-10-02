export class CursorState {
    private mode: "default" | "pencil" | "cross" = "default";

    private setCursor(style: string) {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        canvas.style.cursor = style;
    }
    
    private pencilCursorCSS =
        `url("data:image/svg+xml;utf8,` +
        encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
        <path d='M2 22l1.5-5.5L16 4l4 4L7.5 20.5z' fill='#fff' stroke='#000' stroke-width='1.5'/>
      <path d='M14.5 5.5l4 4' stroke='#000' stroke-width='1.5'/></svg>`) + `") 2 22, crosshair`;

    pencilCursor() { this.mode = "pencil"; this.setCursor(this.pencilCursorCSS); }
    crossCursor() { this.mode = "cross"; this.setCursor("crosshair"); }
    resetCursor() { this.mode = "default"; this.setCursor(""); }
    get current() { return this.mode }
}