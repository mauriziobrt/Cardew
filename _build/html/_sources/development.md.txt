# Development

## How to access View from a user action

I want to map cmd+i to open the metadata view.

## How to add a new OSC control

OSC mapping is defined in 4 steps:
1. In control.ts we retrieve the OSC control (which address and arguments).
2. In ForceGraphComponent.svelte I add the control to RegisterOscControl
3. In graphActions.ts I map the control to a function in graphState.
4. I create the function in graphState to do an action on the graph.

Create a function in graphState.svelte.ts, in this case I created:

``findNodes(query: string) {
        const filtered = this.filteringState.search(this.graphData?.nodes, query);
        console.log(filtered);
    }``

Now, I need to create a OSC control in control.ts.
First I add a handler msgSearch: (query: string) => void, with string because we are running a string query (but in the case of filtering we'll expand to search by property and value). Then we add a case inside oscManager.onMessage() 
case '/search':
                handlers.msgSearch(args[0]);
                break;

Then in ForceGraphComponent.svelte ->
cleanupOSCControls = registerOSCcontrols(
			{
				msgUp: actions.navigateUp,
				msgLeft: actions.navigateLeft,
				msgDown: actions.navigateDown,
				msgRight: actions.navigateRight,
				msgSpace: actions.rhythm,
				msgPos: actions.hover,
				msgMove: actions.move,
				msgCreate: actions.createComplexNode,
				msgDelete: actions.deleteNode,
				msgSearch: actions.searchNodes
			},
			graphState.oscManager,
		);

And in graphActions.ts ->
    searchNodes: (query: string) => graphState.findNodes(query);

Finally in graphState.svelte.ts -> 

    findNodes(query: string) {
        console.log(query)
        const filtered = this.filteringState.search(this.graphData?.nodes, query);
        console.log(filtered);
    }

## How to create a new View in Obsidian Plugin

The main.ts is structured as follows:
- Single Component Declarations that extend Obsidian classes (Modal, ItemView, Plugin…)
	- Contructor function
	- onOpen() function
		- ```this.component = mount(InfoPanelComponent, {target: this.contentEl, props: {}})```
	- onClose() function
		- ```if (this.component) unmount(this.component);```
- Plugin Class Declaration
	- onload() function
		- Initialization and Views registration
	- activateView() functions that are opened on Ribbon Click, Command, etc..
	- onunload() function

We can also define the new in a separate Svelte file. The important part is to define ```View type export const VIEW_TYPE_OSREPL = 'osrepl-view';``` and then the export class.
So to create a new view we have to first create a new component.

---

Create MetadataPanelComponent.svelte then in main.ts at the top add:
	import MetadataPanelComponent from 'utilities/MetadataPanelComponent.svelte';
	

In the file called main.ts

```export const VIEW_TYPE_METADATA_PANEL = "metadata-view";```
I define the view type as a constant. I don’t know yet what the string name is used for.

Then I create the export class extending ItemView:
```
export class MetadataView extends ItemView {
	getViewType(): string {
		throw new Error('Method not implemented.');
	}
	getDisplayText(): string {
		throw new Error('Method not implemented.');
	}
}
```
The getViewType and getDisplayText are required by ItemView, VSCode suggest to add them by itself, so no need to remember this.

When I add the onOpen and onClose, VSCode suggests this form ```protected async onClose(): Promise<void> {}```. 

At this point it looks like this after adding contructor and the other elements.
```
`export const VIEW_TYPE_METADATA_PANEL = "metadata-view";`

`export class MetadataView extends ItemView {`
	`component: Component | undefined;`
	`plugin: ExamplePlugin | undefined;`
	`constructor(leaf: WorkspaceLeaf, plugin: ExamplePlugin) {`
		`super(leaf);`
		`this.plugin = plugin;`
	`};`
	`getViewType(): string {`
		`return VIEW_TYPE_METADATA_PANEL;`
	`}`
	`getDisplayText(): string {`
		`return 'Graph Metadata Edit Panel';`
	`}`
	`protected async onOpen(): Promise<void> {`
		`// this.component = mount()`
	`}`
	`protected async onClose(): Promise<void> {`
		`if (this.component) {`
			`unmount(this.component);`
		`}`
	`}`
`}`
```
Now let’s move to the next step, since I am missing the component to mount.

---

To see the component from Obsidian I need to register the view in the main plugin class inside onload() function. Then I need to add a ribbon icon to show it. I created that and a function that activates that view that is called when clicking the ribbon. (note here i was creating another component not the same one as before)

```
this.addRibbonIcon(
	'link',
	'Open Link View',
	() => this.activateLinkView()
);
```

```
async activateLinkView() {
	const { workspace } = this.app;
	const leaves = workspace.getLeavesOfType(VIEW_TYPE_LINK_PANEL);
	if (leaves.length > 0) {
		workspace.revealLeaf(leaves[0]);
	} else {
		const leaf = workspace.getLeaf('split', 'vertical');
		await leaf.setViewState({ type: VIEW_TYPE_LINK_PANEL, active: true });
	workspace.revealLeaf(leaf);
	}
}
```

## How to create a new View in OSC