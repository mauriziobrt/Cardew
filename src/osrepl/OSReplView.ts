// OSReplView.ts
// Drop into main.ts exactly like ExampleView / InfoPanelView.
// Register in onload(), add ribbon icon, done.

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { spawn } from 'child_process';
import { mount, unmount } from 'svelte';
import type { Component } from 'svelte';
import type ExamplePlugin from '../../main';       // your existing plugin class
import OSReplComponent from './OSReplComponent.svelte';

export const VIEW_TYPE_OSREPL = 'osrepl-view';

export class OSReplView extends ItemView {
	component: Component | undefined;
	plugin: ExamplePlugin;

	constructor(leaf: WorkspaceLeaf, plugin: ExamplePlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string { return VIEW_TYPE_OSREPL; }
	getDisplayText(): string { return 'OS REPL'; }
	getIcon(): string { return 'terminal'; }  // Obsidian built-in icon

	async onOpen() {
		this.plugin.trackerProcess = spawn('python3', ['./tracker.py'], {
			detached: false,
			stdio: 'ignore'
		});

		this.component = mount(OSReplComponent, {
			target: this.contentEl,
			props: {
				replState: this.plugin.replState   // see main.ts additions below
			}
		});
	}

	 async onClose(): Promise<void> {
		if (this.component) unmount(this.component);
		this.plugin.trackerProcess?.kill();
	}
}

// ── Additions needed in main.ts ──────────────────────────────────────────────
//
// 1. Import at top:
//      import { OSReplView, VIEW_TYPE_OSREPL } from './OSReplView';
//      import { createOSReplState, OSReplState } from './osrepl/osreplState.svelte';
//
// 2. Add property to ExamplePlugin class:
//      replState: OSReplState;
//
// 3. In onload(), after initializeOSC():
//      this.replState = createOSReplState(this.oscManager);
//
// 4. Register the view:
//      this.registerView(VIEW_TYPE_OSREPL, (leaf) => new OSReplView(leaf, this));
//
// 5. Add ribbon icon:
//      this.addRibbonIcon('terminal', 'Open OS REPL', () => this.activateReplView());
//
// 6. Add activateReplView() method (same pattern as activateBothViews):
//      async activateReplView() {
//          const { workspace } = this.app;
//          const leaves = workspace.getLeavesOfType(VIEW_TYPE_OSREPL);
//          if (leaves.length > 0) {
//              workspace.revealLeaf(leaves[0]);
//          } else {
//              const leaf = workspace.getLeaf('split', 'vertical');
//              await leaf.setViewState({ type: VIEW_TYPE_OSREPL, active: true });
//              workspace.revealLeaf(leaf);
//          }
//      }
//
// 7. In onunload():
//      if (this.replState) this.replState.close();
