// to implement: cmd+i or i opens inspector

import type { OSCManager } from "osc/osc";

// cmd+e creation/presentation mode
export function registerControls(handlers: {
    onUp: () => void;
    onLeft: () => void;
    onDown: () => void;
    onRight: () => void;
    onSpace: () => void;
    onBackspace: () => void;
    onCmd: () => void;
    onCmdUp: () => void;
    onMouseDown: (e: MouseEvent) => void;
    onMouseUp: (e: MouseEvent) => void;
    onMouseDrag: (e: MouseEvent) => void;
    onCtrlMouseDown?: (e: MouseEvent) => void;
    onCmdMouseDown?: (e: MouseEvent) => void;
    onCmdMouseUp?: (e: MouseEvent) => void;
    onAltMouseDown?: (e: MouseEvent) => void;
    onAltMouseUp?: (e: MouseEvent) => void;
    onAltMouseDrag?: (e: MouseEvent) => void;
    undo: () => void;
    redo: () => void;
}) {
    let dragging = false;
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'w' || e.key === 'ArrowUp') handlers.onUp();
        if (e.key === 'a' || e.key === 'ArrowLeft') handlers.onLeft();
        if (e.key === 's' || e.key === 'ArrowDown') handlers.onDown();
        if (e.key === 'd' || e.key === 'ArrowRight') handlers.onRight();
        if (e.key === ' ') handlers.onSpace?.();
        if (e.key === 'Backspace') handlers.onBackspace?.();
        if (e.key === 'Control') handlers.onCmd?.();
        // if (e.key === 'MetaLeft') handlers.onCmdUp?.();
        // Uncomment to get key name
        // else console.log(e.key)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            handlers.undo();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            handlers.redo();
        }
    }

    function handleKeyup(e: KeyboardEvent) {
        if (e.key === 'Control') handlers.onCmdUp?.();
    }


    function handleDoubleClick(e: MouseEvent) {
        // console.log(e);
        // handlers.onDoubleClick(e);
    }

    function handleMouseDown(e: MouseEvent) {
        // console.log(e);
        dragging = true;
        handlers.onMouseDown(e);

        if (e.altKey && e.button === 0) {
            e.stopPropagation();
            handlers.onAltMouseDown?.(e)
        };
        if (e.metaKey && e.button === 0) {
            // e.stopPropagation();
            handlers.onCmdMouseDown?.(e)
        };
        if (e.ctrlKey && e.button === 0) {
            e.stopPropagation();
            handlers.onCtrlMouseDown?.(e)
        };

    }
    function handleMouseUp(e: MouseEvent) {
        // console.log("maronn");
        dragging = false;
        handlers.onMouseUp(e);
        if (e.button === 0) {
            handlers.onAltMouseUp?.(e);
            handlers.onCmdMouseUp?.(e);
        }
    }
    function handleMouseMove(e: MouseEvent) {
        if (dragging) handlers.onMouseDrag(e);
        if (dragging && e.altKey) handlers.onAltMouseDrag?.(e);
    }

    const canvas = document.querySelector('canvas')

    if (!canvas) return;
    // canvas.addEventListener("dblclick", handleDoubleClick);
    canvas.addEventListener('mousedown', handleMouseDown, true);
    canvas.addEventListener('mouseup', handleMouseUp, true);
    canvas.addEventListener('mousemove', handleMouseMove, true);
    canvas.tabIndex = 0;
    canvas.addEventListener('keydown', handleKeydown);
    canvas.addEventListener('keyup', handleKeyup);

    return () => {
        // canvas.removeEventListener("dblclick", handleDoubleClick);
        canvas.removeEventListener('mousedown', handleMouseDown, true);
        canvas.removeEventListener('mouseup', handleMouseUp, true);
        canvas.removeEventListener('mousemove', handleMouseMove, true);
        canvas.removeEventListener('keydown', handleKeydown);
        canvas.removeEventListener('keyup', handleKeyup);
    };
}

export function registerOSCcontrols(handlers: {
    msgUp: () => void;
    msgLeft: () => void;
    msgDown: () => void;
    msgRight: () => void;
    msgSpace: () => void;
}, oscManager: OSCManager) {
    console.log(oscManager);
    oscManager.onMessage((address, args) => {
        console.log('Received OSC:', address, args);
        if (address) {
            switch (address) {
                case '/up':
                    // const id = args[0]
                    handlers.msgUp();
                    // window.selectNodeById(id);
                    break;
                case '/down':
                    handlers.msgDown();
                    break;
                case '/left':
                    handlers.msgLeft();
                    break;
                case '/right':
                    handlers.msgRight();
                    break;
            }
        }
    })
    return
}