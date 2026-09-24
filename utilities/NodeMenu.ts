// NodeMenu.ts
import type { GraphState } from "graphState.svelte";
import { Menu, Notice } from "obsidian";

export function showNodeMenu(node: any, event: MouseEvent, graphState: GraphState) {
    const menu = new Menu();
    menu.addSeparator();
    menu.addItem((item) =>
        item.setTitle("Copy Metadata").setIcon("documents")
            .onClick(() => {
                new Notice("Copied")
                graphState.retrieveNodeCleanMetadata();
            }
            ),
    );
    menu.addItem((item) =>
        item.setTitle("Paste Metadata").setIcon("paste")
            .onClick(() => {
                new Notice("Pasted")
                graphState.applyMetadata();
            }
            ),
    );
    menu.addSeparator();
    menu.showAtMouseEvent(event);
}