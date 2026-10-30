import { Plugin, ItemView, WorkspaceLeaf, Modal, App, Notice } from 'obsidian';
import type { Component } from 'svelte';
import ForceGraphComponent from './components/ForceGraphComponent.svelte';
import InfoPanelComponent from './components/panels/InfoPanelComponent.svelte';
import FilterPanelComponent from './components/panels/FilterPanelComponent.svelte';
import MetadataPanelComponent from './components/panels/MetadataPanelComponent.svelte';
import ShapePanelComponent from './components/panels/ShapePanelComponent.svelte';
import LinkPanelComponent from './components/panels/LinkPanelComponent.svelte';
import { mount, unmount } from 'svelte';
import { createGraphState, GraphState } from './state/graphState.svelte';
// import * as fs from 'fs';
// import * as path from 'path';
import FileListModal from './components/FileListModal.svelte';
import OSCMetadataPanelComponentSvelte from './components/panels/OSCMetadataPanelComponent.svelte';
import { FileLoader } from './io/FileLoader'
import { OSCManager } from 'src/osc/osc';
import { Config, DEFAULT_CONFIG } from 'src/config.svelte';
import { ForceGraphSettingTab } from './ui/SettingsTab';
import { OSReplView, VIEW_TYPE_OSREPL } from './osrepl/OSReplView';
import { createOSReplState, OSReplState } from './osrepl/osreplState.svelte';

//================================================================================================
// Node Shapes and Color Panel
//================================================================================================
class ShapeConfigModal extends Modal {
	component: ShapePanelComponent | undefined;
	plugin: ExamplePlugin;

	constructor(app: App, plugin: ExamplePlugin,) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl } = this;

		this.component = mount(ShapePanelComponent, {
			target: this.contentEl,
			props: {
				allProperties: this.plugin.graphState.allProperties,
				allValuesAtProperty: this.plugin.graphState.allValuesAtProperty,
				onSave: async () => {
					await this.plugin.config.save(this.plugin);
					this.plugin.graphState.updateData(this.plugin.graphState.graphData);
				},
				onClose: () => this.close(),
				graphState: this.plugin.graphState,
			}
		});
	}

	onClose() {
		if (this.component) {
			unmount(this.component);
			// this.component.$destroy();
		}
	}
}

//================================================================================================
// OSC Configuration
//================================================================================================

class OSCConfigModal extends Modal {
	component: OSCMetadataPanelComponentSvelte | undefined;
	plugin: ExamplePlugin;

	constructor(app: App, plugin: ExamplePlugin,) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl } = this;

		this.component = mount(OSCMetadataPanelComponentSvelte, {
			target: this.contentEl,
			props: {
				graphState: this.plugin.graphState,
				oscConfig: this.plugin.graphState.oscConfig,
				onSave: async () => this.plugin.saveData({ ...(await this.plugin.loadData()), oscConfig: this.plugin.graphState.oscConfig }),
				onClose: () => this.close()
			}
		});
	}

	onClose() {
		if (this.component) {
			unmount(this.component);
			// this.component.$destroy();
		}
	}
}

//================================================================================================
// Link Panel
//================================================================================================

export const VIEW_TYPE_LINK_PANEL = "link-view";

export class LinkView extends ItemView {
	component: Component | undefined;
	plugin: ExamplePlugin | undefined;

	constructor(leaf: WorkspaceLeaf, plugin: ExamplePlugin) {
		super(leaf);
		this.plugin = plugin;
	};

	getViewType(): string {
		return VIEW_TYPE_LINK_PANEL;
	}
	getDisplayText(): string {
		return 'Graph Link Edit Panel';
	}

	getIcon() {
		return "link"; // lucide icon id shown in the tab
	}

	protected async onOpen(): Promise<void> {
		this.component = mount(LinkPanelComponent, {
			target: this.contentEl,
			props: {
				//Here I should define the props, the runes I am passing to the component
				graphState: this.plugin.graphState
			}
		});
	}

	protected async onClose(): Promise<void> {
		if (this.component) {
			unmount(this.component);
		}
	}
}

//================================================================================================
// Metadata Panel
//================================================================================================

export const VIEW_TYPE_METADATA_PANEL = "metadata-view";

export class MetadataView extends ItemView {
	component: Component | undefined;
	plugin: ExamplePlugin | undefined;

	constructor(leaf: WorkspaceLeaf, plugin: ExamplePlugin) {
		super(leaf);
		this.plugin = plugin;
	};

	getViewType(): string {
		return VIEW_TYPE_METADATA_PANEL;
	}
	getDisplayText(): string {
		return 'Properties';
	}
	getIcon() {
		return "info"; // lucide icon id shown in the tab
	}

	protected async onOpen(): Promise<void> {
		this.component = mount(MetadataPanelComponent, {
			target: this.contentEl,
			props: {
				//Here I should define the props, the runes I am passing to the component
				graphState: this.plugin.graphState,
				app: this.app,
				// onToggleMetadata: () => this.plugin.toggleMetadataView()
			}
		});
	}

	protected async onClose(): Promise<void> {
		if (this.component) {
			unmount(this.component);
		}
	}
}

//================================================================================================
// Filter Panel
//================================================================================================

export const VIEW_TYPE_FILTER_PANEL = "filter-panel-view";

export class FilterPanelView extends ItemView {
	// First get the component I had created externally
	// component: ReturnType<typeof InfoPanelComponent> | undefined;
	component: Component | undefined;
	plugin: ExamplePlugin;
	//This is a bit unclear but I guess it needs to access the plugin and leaf
	constructor(leaf: WorkspaceLeaf, plugin: ExamplePlugin) {
		super(leaf);
		this.plugin = plugin;
	}
	//The view type is that const I had defined earlier, I don't know why i need this
	getViewType(): string {
		return VIEW_TYPE_FILTER_PANEL;
	}
	//When the software calls this it gets this name, probably popup when hovering
	getDisplayText(): string {
		return 'Graph Filter Panel';
	}

	getIcon() {
		return "search"; // lucide icon id shown in the tab
	}

	async onOpen() {
		//Here it mounts the Svelte component before I created a generic component of the same type
		//Now I assign it to the actual component, using the new mount syntax
		this.component = mount(FilterPanelComponent, {
			target: this.contentEl,
			props: {
				//Here I should define the props, the runes I am passing to the component
				// graphState: (this.app as any).plugins.plugins[''];
				graphState: this.plugin.graphState,
			}
		});
	}

	// So when I define the class I need an onclose with unmount and an open with mount
	protected async onClose(): Promise<void> {
		if (this.component) {
			unmount(this.component);
		}
	}

}

//================================================================================================
// Info Panel
//================================================================================================

export const VIEW_TYPE_INFO_PANEL = "info-panel-view";

export class InfoPanelView extends ItemView {
	// First get the component I had created externally
	// component: ReturnType<typeof InfoPanelComponent> | undefined;
	component: Component | undefined;
	plugin: ExamplePlugin;
	//This is a bit unclear but I guess it inherits the constructor
	constructor(leaf: WorkspaceLeaf, plugin: ExamplePlugin) {
		super(leaf);
		this.plugin = plugin;
	}
	//The view type is that const I had defined earlier, I don't know why i need this
	getViewType(): string {
		return VIEW_TYPE_INFO_PANEL;
	}
	//When the software calls this it gets this name, probably popup when hovering
	getDisplayText(): string {
		return 'Graph Info Panel';
	}

	getIcon() {
		return "settings"; // lucide icon id shown in the tab
	}

	async onOpen() {
		//Here it mounts the Svelte component before I created a generic component of the same type
		//Now I assign it to the actual component, using the new mount syntax
		this.component = mount(InfoPanelComponent, {
			target: this.contentEl,
			props: {
				//Here I should define the props, the runes I am passing to the component
				// graphState: (this.app as any).plugins.plugins[''];
				graphState: this.plugin.graphState
			}
		});
	}

	// So when I define the class I need an onclose with unmount and an open with mount
	protected async onClose(): Promise<void> {
		if (this.component) {
			unmount(this.component);
		}
	}

}

//================================================================================================
// Graph View
//================================================================================================

export const VIEW_TYPE_FORCE_GRAPH = 'graph-view';

export class GraphView extends ItemView {
	// A variable to hold on to the Counter instance mounted in this ItemView.
	// counter: ReturnType<typeof ForceGraphComponent> | undefined;
	component: Component | undefined;
	plugin: ExamplePlugin

	constructor(leaf: WorkspaceLeaf, plugin: ExamplePlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_FORCE_GRAPH;
	}

	getDisplayText() {
		return 'Force-layout graph';
	}

	getIcon() {
		return "chart-network"; // lucide icon id shown in the tab
	}

	// async getProvidersFiles(folderPath: string): Promise<string[]> {
	// 	const folderContent = await this.app.vault.adapter.list(folderPath);
	// 	return folderContent.files;
	// }

	async onOpen() {

		if (!this.plugin.graphState.graphData) {
			this.contentEl.createEl('div', {
				text: 'Loading graph data...',
				cls: 'graph-loading'
			});

			await this.plugin.dataLoaderPromise;

			this.contentEl.empty();
		}
		// const graphData = await this.getGraphData();
		// const peppino = await this.getProvidersFiles("/gianni");
		// console.log(peppino)
		// console.log('Plugin graphState:', this.plugin.graphState);
		// Attach the Svelte component to the ItemViews content element and provide the needed props.
		// this.plugin.graphState.graphData = graphData;

		this.component = mount(ForceGraphComponent, {
			target: this.contentEl,
			props: {
				// data: graphData,
				graphState: this.plugin.graphState
			}
		});

		//
		// Since the component instance is typed, the exported `increment` method is known to TypeScript.
		// this.counter.increment();
	}

	async onClose() {
		if (this.component) {
			// Remove the Counter from the ItemView.
			unmount(this.component);
		}
	}

	async getGraphData() {
	}
}


//================================================================================================
// Main Plugin Class
//================================================================================================
export default class ExamplePlugin extends Plugin {
	graphState: GraphState; // Declare property
	oscManager: OSCManager;
	oscConfig: Record<string, string[]> = {};
	config: Config;
	dataLoaderPromise: Promise<void> | undefined;
	replState: OSReplState;

	private dataLoadedResolve: () => void;
	DEFAULT_CONFIG = DEFAULT_CONFIG;
	trackerProcess: any;

	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	//
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

	async onload() {
		try {
			//Initialize config
			this.config = new Config();
			await this.config.load(this);

			await this.initializeOSC();
			this.replState = createOSReplState(this.oscManager);
			this.oscConfig = (await this.loadData())?.oscConfig ?? {};
			// this.oscManager = new OSCManager(57122, '127.0.0.1', 57120);

			this.graphState = createGraphState(this.oscManager, this.config);
			this.graphState.oscConfig = this.oscConfig;
			this.dataLoaderPromise = new Promise((resolve) => {
				this.dataLoadedResolve = resolve;
			})
			// from claude
			this.graphState.openMetadata = () => this.activateMetadataView();
			this.graphState.closeMetadata = () =>
				this.app.workspace.detachLeavesOfType(VIEW_TYPE_METADATA_PANEL);
			// end claude

			const fileLoader = new FileLoader(this.graphState);
			const dataPath = this.config.current.paths.defaultDataPath + '/5-co-cit-coupling.json';// /sandbox.json 5-co-cit-coupling

			try {
				await fileLoader.loadGraphData(dataPath);
				this.dataLoadedResolve();
			} catch (error) {
				console.error("Failed to load graph data:", error);
				this.dataLoadedResolve();
			}
			const fruits = this.addStatusBarItem();
			fruits.createEl('span', { text: 'Cardew © Maurizio Berta, 2026' });

			this.registerView(
				VIEW_TYPE_FORCE_GRAPH,
				(leaf) => new GraphView(leaf, this),
			);
			this.registerView(
				VIEW_TYPE_INFO_PANEL,
				(leaf) => new InfoPanelView(leaf, this)
			);
			this.registerView(
				VIEW_TYPE_FILTER_PANEL,
				(leaf) => new FilterPanelView(leaf, this)
			);

			this.registerView(
				VIEW_TYPE_METADATA_PANEL,
				(leaf) => new MetadataView(leaf, this)
			);

			this.registerView(
				VIEW_TYPE_OSREPL,
				(leaf) => new OSReplView(leaf, this)
			);

			this.registerView(
				VIEW_TYPE_LINK_PANEL,
				(leaf) => new LinkView(leaf, this)
			);


			this.addRibbonIcon(
				'folder-pen',
				'Load New Graph',
				async () => {
					const fileLoader = new FileLoader(this.graphState);
					const dataPath = this.config.current.paths.defaultDataPath + '/sandbox.json';// /sandbox.json 5-co-cit-coupling
					if (this.config.current.hasEdits == true) {
						if (window.confirm("This graph has unsaved edits.\nAre you sure you want to load a new graph?")) {
							try {
								await fileLoader.loadGraphData(dataPath);
								this.dataLoadedResolve();
							} catch (error) {
								console.error("Failed to load graph data:", error);
								this.dataLoadedResolve();
							}
						}
					} else {
						try {
							await fileLoader.loadGraphData(dataPath);
							this.dataLoadedResolve();
						} catch (error) {
							console.error("Failed to load graph data:", error);
							this.dataLoadedResolve();
						}
					}
				}
			);

			this.addRibbonIcon(
				'link',
				'Open Link View',
				() => this.activateLinkView()
			);

			this.addRibbonIcon(
				'info',
				'Open Metadata View',
				() => this.activateMetadataView()
			);

			this.addRibbonIcon(
				'terminal',
				'Open OS REPL',
				() => this.activateReplView()
			);

			this.addRibbonIcon('git-fork', 'Open Force Graph', () => {
				// this.activateView();
				this.activateBothViews();
			});

			this.addRibbonIcon('chevrons-left-right-ellipsis', 'Open OSC Configuration', () => {
				new OSCConfigModal(this.app, this).open();
			})

			this.addRibbonIcon("paintbrush", 'Open Shape and Color Configuration', () => {
				new ShapeConfigModal(this.app, this).open();
			})

			this.addSettingTab(new ForceGraphSettingTab(this.app, this));

			this.addCommand({
				id: 'config-metadata-osc',
				name: 'Config OSC Metadata',
				callback: () => {
					new OSCConfigModal(this.app, this).open();
				}
			});

			this.addCommand({
				id: 'config-shapes',
				name: 'Config Shapes and Colours',
				callback: () => {
					new ShapeConfigModal(this.app, this).open();
				}
			});

			this.addCommand({
				id: 'metadata-view-toggle',
				name: 'Open and close metadata view',
				callback: () => {
					this.toggleMetadataView()
				}
			});

			this.addCommand({
				id: 'link-view-toggle',
				name: 'Open and close link view',
				callback: () => {
					this.toggleLinkView()
				}
			});


			this.app.workspace.onLayoutReady(() => {
				this.activateBothViews();
				// this.activateMetadataView();
				this.activateLinkView();
				this.app.workspace.detachLeavesOfType("all-properties");
			});

			//claude
			this.registerEvent(this.app.workspace.on('layout-change', () => {
				this.graphState.metadataOpen =
					this.app.workspace.getLeavesOfType(VIEW_TYPE_METADATA_PANEL).length > 0;
			}));
			//endclaude

		} catch (error) {
			console.error("Plugin initialization failed:", error);
			new Notice("Failed to initialize Force Graph plugin");
		}
	}
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	//
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

	async toggleMetadataView() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_METADATA_PANEL);
		if (leaves.length > 0) {
			leaves.forEach(l => l.detach());
		} else {
			await this.activateMetadataView();
		}
	}

	async toggleLinkView() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_LINK_PANEL);
		if (leaves.length > 0) {
			leaves.forEach(l => l.detach());
		} else {
			await this.activateLinkView();
		}
	}

	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	//
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	async activateReplView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_OSREPL);
		if (leaves.length > 0) {
			workspace.revealLeaf(leaves[0]);
		} else {
			const leaf = workspace.getLeaf('split', 'vertical');
			await leaf.setViewState({ type: VIEW_TYPE_OSREPL, active: true });
			workspace.revealLeaf(leaf);
		}
	}
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	//
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	async activateLinkView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_LINK_PANEL);
		if (leaves.length > 0) {
			workspace.revealLeaf(leaves[0]);
		}
		else {
			const leaf = workspace.getLeaf('split', 'horizontal');
			await leaf.setViewState({ type: VIEW_TYPE_LINK_PANEL, active: true });
			workspace.revealLeaf(leaf);
			const tabGroup = leaf.parent as any;
			if (tabGroup?.setStacked) {
				tabGroup.setStacked(true);
			}
		}
		// const metaLeaves = workspace.getLeavesOfType(VIEW_TYPE_METADATA_PANEL);
		// const parentLeaf = metaLeaves[0] ?? workspace.getLeaf('split', 'horizontal');

		// createLeafInParent adds it as a tab in the same tab group, not a new split
		// const leaf = workspace.createLeafInParent(parentLeaf.parent, 1);
		// await leaf.setViewState({ type: VIEW_TYPE_LINK_PANEL, active: true });
		// workspace.revealLeaf(leaf);


	}
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	//
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	async activateMetadataView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_METADATA_PANEL);
		if (leaves.length > 0) {
			workspace.revealLeaf(leaves[0]);
		} else {
			const leaf = workspace.getRightLeaf(false);
			if (!leaf) return;
			await leaf.setViewState({ type: VIEW_TYPE_METADATA_PANEL, active: false });
			workspace.revealLeaf(leaf);
		}
	}
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	//
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	async activateBothViews() {
		const { workspace } = this.app;

		if (!this.graphState.graphData) {
			await this.dataLoaderPromise;
		}

		//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
		// Activate the info view
		//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
		let infoPanelLeaf: WorkspaceLeaf | null = null;
		const infoPanelLeaves = workspace.getLeavesOfType(VIEW_TYPE_INFO_PANEL);

		if (infoPanelLeaves.length > 0) {
			//it exist reveal it
			infoPanelLeaf = infoPanelLeaves[0];
		} else {
			// workspace.setActiveLeaf(forceGraphLeaf, { focus: true });
			//create it
			const leaf = workspace.getLeftLeaf(false
			);
			// This construct allows to remove the  blablaleaf is possibly null
			// because I write if null then stop so then it's for sure WorkSpaceLeaf
			if (!leaf) return;
			infoPanelLeaf = leaf;
			await infoPanelLeaf.setViewState({
				type: VIEW_TYPE_INFO_PANEL,
				active: true
			})
		}

		workspace.revealLeaf(infoPanelLeaf)

		//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
		// Activate the filter view
		//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
		let filterPanelLeaf: WorkspaceLeaf | null = null;
		const filterPanelLeaves = workspace.getLeavesOfType(VIEW_TYPE_FILTER_PANEL);

		if (filterPanelLeaves.length > 0) {
			//it exist reveal it
			filterPanelLeaf = filterPanelLeaves[0];
		} else {
			// workspace.setActiveLeaf(forceGraphLeaf, { focus: true });
			//create it
			const leaf = workspace.getLeftLeaf(true
			);
			// This construct allows to remove the  blablaleaf is possibly null
			// because I write if null then stop so then it's for sure WorkSpaceLeaf
			if (!leaf) return;
			filterPanelLeaf = leaf;
			await filterPanelLeaf.setViewState({
				type: VIEW_TYPE_FILTER_PANEL,
				active: true
			})
		}
		workspace.revealLeaf(filterPanelLeaf)

		//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
		// Activate the metadata edit view
		//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
		let metadataPanelLeaf: WorkspaceLeaf | null = null;
		const metadataPanelLeaves = workspace.getLeavesOfType(VIEW_TYPE_METADATA_PANEL);

		if (metadataPanelLeaves.length > 0) {
			//it exist reveal it
			metadataPanelLeaf = metadataPanelLeaves[0];
		} else {
			// workspace.setActiveLeaf(forceGraphLeaf, { focus: true });
			//create it
			const leaf = workspace.getRightLeaf(false
			);
			// This construct allows to remove the  blablaleaf is possibly null
			// because I write if null then stop so then it's for sure WorkSpaceLeaf
			if (!leaf) return;
			metadataPanelLeaf = leaf;
			if (!metadataPanelLeaf) return;
			await metadataPanelLeaf.setViewState({
				type: VIEW_TYPE_METADATA_PANEL,
				active: true
			})
		}

		workspace.revealLeaf(metadataPanelLeaf)


		//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
		// Activate the graph view
		//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
		// First I activate the ForceGraph View
		// I should check if with this method both gets open or I can control them individually
		let forceGraphLeaf: WorkspaceLeaf | null = null;
		const forceGraphLeaves = workspace.getLeavesOfType(VIEW_TYPE_FORCE_GRAPH)

		if (forceGraphLeaves.length > 0) {
			// It exist, so show it
			forceGraphLeaf = forceGraphLeaves[0]
		} else {
			// Create it
			const leaf = workspace.getLeaf(false);
			if (!leaf) return; // or throw new Error("Could not get leaf")
			forceGraphLeaf = leaf;
			// forceGraphLeaf = workspace.getRightLeaf(false);
			await forceGraphLeaf.setViewState({
				type: VIEW_TYPE_FORCE_GRAPH,
				active: true
			});
		}

		await workspace.revealLeaf(forceGraphLeaf);


	}
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	// Where is this used???
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	// getFilesFromDirectory(dirPath: string): FileInfo[] {
	// 	try {
	// 		if (!fs.existsSync(dirPath)) {
	// 			throw new Error('Directory does not exist');
	// 		}

	// 		const items = fs.readdirSync(dirPath);

	// 		return items.map(item => {
	// 			const fullPath = path.join(dirPath, item);
	// 			const stats = fs.statSync(fullPath);

	// 			return {
	// 				name: item,
	// 				path: fullPath,
	// 				size: stats.size,
	// 				modified: stats.mtime,
	// 				isDirectory: stats.isDirectory()
	// 			};
	// 		});
	// 	} catch (error) {
	// 		console.error('Error reading directory:', error);
	// 		return [];
	// 	}
	// }
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	// Initialize OSC connection
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	private async initializeOSC(): Promise<void> {
		try {
			const { localPort, remoteAddress, remotePort, ipVersion } = this.config.current.osc;

			this.oscManager = new OSCManager(
				localPort,
				remoteAddress,
				remotePort,
				ipVersion
			);

			console.log(`OSC initialized: ${localPort} -> ${remoteAddress}:${remotePort}`);
		} catch (error) {
			console.error("Failed to initialize OSC:", error);
			throw error;
		}
	}
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	// Restart OSC with new settings (called from settings tab)
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	async restartOSC(): Promise<void> {
		try {
			new Notice('Restarting OSC connection...');

			// Close existing connection
			if (this.oscManager) {
				this.oscManager.close();
			}

			// Reinitialize with new config
			await this.initializeOSC();

			// Update graphState with new OSC manager
			this.graphState.oscManager = this.oscManager;

			new Notice('OSC connection restarted successfully');
		} catch (error) {
			console.error("Failed to restart OSC:", error);
			new Notice('Failed to restart OSC connection');
		}
	}
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	// When Closing App release everything
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
	async onunload() {
		document.head
			.querySelectorAll('style[id^="svelte-"]')
			.forEach((el) => el.remove());
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_FORCE_GRAPH);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_INFO_PANEL);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_FILTER_PANEL);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_METADATA_PANEL);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_LINK_PANEL);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_OSREPL);

		if (this.graphState) {
			this.graphState.close();
		}
		if (this.oscManager) {
			this.oscManager.close();
		}
		if (this.replState) this.replState.close();
		// Release any resources configured by the plugin.
	}
}