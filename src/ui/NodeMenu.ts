// NodeMenu.ts
import type { GraphState } from "src/state/graphState.svelte";
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
    menu.addItem((item) =>
        item.setTitle("Copy Class").setIcon("documents")
            .onClick(() => {
                new Notice("Copied")
                graphState.retrieveNodeClass();
            }
            ),
    );
    menu.addItem((item) =>
        item.setTitle("Paste Class").setIcon("paste")
            .onClick(() => {
                new Notice("Pasted")
                graphState.applyRetrievedNodeClass();
            }
            ),
    );
    menu.showAtMouseEvent(event);
}