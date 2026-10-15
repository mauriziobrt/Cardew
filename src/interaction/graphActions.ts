import type { GraphState } from '../state/graphState.svelte';

export function createGraphActions(graphState: GraphState) {
  return {
    navigateUp: () => graphState.navigate('up'),
    navigateLeft: () => graphState.navigate('left'),
    navigateDown: () => graphState.navigate('down'),
    navigateRight: () => graphState.navigate('right'),
    rhythm: () => graphState.rhythm(),
    hover: (x: number, y: number) => graphState.hoverAtPos(x, y),
    kill: () => graphState.killNode(),
    pencilCursor: () => graphState.pencilCursor(),
    resetPencilCursor: () => graphState.resetPencilCursor(),
    crossCursor: () => graphState.crossCursor(),
    resetCrossCursor: () => graphState.resetCrossCursor(),
    mouseDown: () => null,
    mouseUp: () => null,
    mouseDrag: () => null,
    onMultiSelect: (e: MouseEvent) => graphState.toggleMultiselect(true),
    offMultiSelect: (e: MouseEvent) => graphState.toggleMultiselect(false),
    rectangleSelectionStart: (e: MouseEvent) => graphState.selectionStart(e),
    rectangleSelectionEnd: (e: MouseEvent) => graphState.selectionEnd(e),
    clearSelection: () => graphState.clearSelection(),
    createNode: (e: MouseEvent) => graphState.createNode(e),
    selectAll: () => graphState.selectAll(),
    undo: () => graphState.undo(),
    redo: () => graphState.redo(),
    move: (id: string, dimension: string, value: number) => graphState.moveNode(id, dimension, value)
  };
}