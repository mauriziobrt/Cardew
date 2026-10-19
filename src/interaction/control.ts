// to implement: cmd+i or i opens inspector

import type { OSCManager } from "src/osc/osc";

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
    onAlt: () => void;
    onAltUp: () => void;
    onMouseDown: (e: MouseEvent) => void;
    onMouseUp: (e: MouseEvent) => void;
    onMouseDrag: (e: MouseEvent) => void;
    onCtrlMouseDown?: (e: MouseEvent) => void;
    onCmdMouseDown?: (e: MouseEvent) => void;
    onCmdMouseUp?: (e: MouseEvent) => void;
    onAltMouseDown?: (e: MouseEvent) => void;
    onAltMouseUp?: (e: MouseEvent) => void;
    onAltMouseDrag?: (e: MouseEvent) => void;
    onCmdA: () => void;
    onCmdI: () => void;
    undo: () => void;
    redo: () => void;
}, root: HTMLElement) {

    let dragging = false;
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'w' || e.key === 'ArrowUp') handlers.onUp();
        if (e.key === 'a' || e.key === 'ArrowLeft') handlers.onLeft();
        if (e.key === 's' || e.key === 'ArrowDown') handlers.onDown();
        if (e.key === 'd' || e.key === 'ArrowRight') handlers.onRight();
        if (e.key === ' ') handlers.onSpace?.();
        if (e.key === 'Backspace') handlers.onBackspace?.();
        if (e.key === 'Control') handlers.onCmd?.();
        if (e.key === 'Alt') handlers.onAlt?.();
        // if (e.key === 'MetaLeft') handlers.onCmdUp?.();
        // Uncomment to get key name
        // else 
        // console.log(e.key)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            handlers.onCmdA();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            handlers.onCmdI();
        }
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
        if (e.key === 'Alt') handlers.onAltUp?.();
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

    // const canvas = document.querySelector('canvas')

    // if (!canvas) return;
    const canvas = root.querySelector('canvas');
    if (!canvas) {
        console.warn('registerControls: no canvas found');
        return () => { };
    }

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
    msgPos: (x: number, y: number) => void;
    msgMove: (id: string, dimension: string, value: number) => void;
    msgCreate: (id: string, properties: Record<string, number[]>) => void;
    msgDelete: (id: string) => void;
    msgSearch: (property: string, query: string) => void;
}, oscManager: OSCManager) {
    console.log(oscManager);
    oscManager.onMessage((address, args) => {
        // console.log('Received OSC:', address, args);
        if (address) {
            switch (address) {
                case '/nav':
                    switch (args[0]) {
                        case 'up':
                            handlers.msgUp();
                            break;
                        case 'down':
                            handlers.msgDown();
                            break;
                        case 'left':
                            handlers.msgLeft();
                            break;
                        case 'right':
                            handlers.msgRight();
                            break;
                    }
                    break;
                case '/pos':
                    // console.log("POST", args[0].value);
                    // Hover over nodes in the canvas and select them
                    handlers.msgPos(args[0].value, args[1].value);
                    break;
                case '/move':
                    // Dimension & Position \move {dimension} {position}
                    // Move a node on the canvas
                    // console.log("POST", args[0], args[1], args[2].value);
                    handlers.msgMove(args[0], args[1], args[2].value);
                    break;
                case '/create':
                    // Create new node with any amount of properties. 
                    // \create {id} {property} {value} {property} {value} ..... {property} {value}
                    // 
                    // console.log(args.slice(1));
                    const propertyArray = args.slice(1);
                    // Source - https://stackoverflow.com/a/57851980
                    // Posted by Simon Buchan, modified by community. See post 'Timeline' for change history
                    // Retrieved 2026-10-16, License - CC BY-SA 4.0

                    const pairs = propertyArray.flatMap((_, i, a) => i % 2 ? [] : [a.slice(i, i + 2)]);
                    handlers.msgCreate(args[0], pairs);
                    break;
                case '/delete':
                    // Delete any node given an id
                    // \delete {id} 
                    // 
                    handlers.msgDelete(args[0]);
                    break;
                case '/search':
                    // Delete any node given an id
                    // \delete {id} 
                    // 
                    handlers.msgSearch(args[0], args[1]);
                    break;
            }
        }
    })
    return
}