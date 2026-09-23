import type { GraphState } from '../graphState.svelte';

export function createGraphActions(graphState: GraphState) {
  return {
    navigateUp: () => graphState.navigate('up'),
    navigateLeft: () => graphState.navigate('left'),
    navigateDown: () => graphState.navigate('down'),
    navigateRight: () => graphState.navigate('right'),
    rhythm: () => graphState.rhythm(),
    kill: () => graphState.killNode(),
    pencilCursor: () => graphState.pencilCursor(),
    resetPencilCursor: () => graphState.resetPencilCursor(),
    mouseDown: () => null,
    mouseUp: () => null,
    mouseDrag: () => null,
    onMultiSelect: (e: MouseEvent) => graphState.toggleMultiselect(true),
    offMultiSelect: (e: MouseEvent) => graphState.toggleMultiselect(false),
    rectangleSelectionStart: (e: MouseEvent) => graphState.selectionStart(e),
    rectangleSelectionEnd: (e: MouseEvent) => graphState.selectionEnd(e),
    clearSelection: (e: MouseEvent) => graphState.clearSelection(e),
    createNode: (e: MouseEvent) => graphState.createNode(e),
    undo:() => graphState.undo(),
    redo:() => graphState.redo()
  };
}