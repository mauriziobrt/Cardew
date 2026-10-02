<script lang="ts">
	import { Menu, Notice } from "obsidian";
	let {
		className = <String>"None",
		currentClass = "None",
		fields = <Array<TemplateStringsArray>>[],
		onEditClass,
		saveClass,
	} = $props();

	$effect(() => {
		className = currentClass?.className ?? "empty";
	});

	function editClass(name: string) {
		if (!name) return;
		onEditClass(name);
	}

	function openMenu(event: MouseEvent) {
		const menu = new Menu();
		//This should be passed from graphState or somewhere I could hold all of the saved classes
		// const formats = ["Bibliometric", "Note", "Control"];
		menu.addItem((item) => {
			item.setTitle("Select Class").setIcon("download");

			const submenu = item.setSubmenu();

			//this should be iteratively filled depending on the available classes
			for (const format of fields) {
				submenu.addItem(
					(sub: {
						setTitle: (arg0: string) => {
							(): any;
							new (): any;
							onClick: { (arg0: () => void): any; new (): any };
						};
					}) =>
						sub.setTitle(format).onClick(() => {
							new Notice(`Set class ${format}`);
							className = format;
							editClass(className);
						}),
				);
			}
		});

		menu.addSeparator();

		menu.addItem((item) =>
			item
				.setTitle("Copy Metadata")
				.setIcon("documents")
				.onClick(() => {
					new Notice("Copied");
					className = "Copy";
				}),
		);

		menu.addItem((item) =>
			item
				.setTitle("Paste Metadata")
				.setIcon("paste")
				.onClick(() => {
					new Notice("Pasted");
					className = "Paste";
				}),
		);
		menu.addSeparator();

		menu.addItem((item) =>
			item
				.setTitle("Save to new class")
				.setIcon("save")
				.onClick(() => {
					new Notice("Save to new class");
					saveClass();
				}),
		);

		menu.addItem((item) =>
			item
				.setTitle("Save to existing class")
				.setIcon("paste")
				.onClick(() => {
					new Notice("Pasted");
					className = "Paste";
				}),
		);

		menu.addSeparator();

		menu.addItem((item) =>
			item
				.setTitle("Reset metadata")
				.setIcon("paste")
				.onClick(() => {
					new Notice("Pasted");
					className = "Paste";
				}),
		);

		menu.showAtMouseEvent(event);
	}
</script>

<div class="metadata-property">
	<div class="metadata-property-key">
		<span class="metadata-property-icon"></span>
		<span style="padding: var(--metadata-input-padding);">Class</span>
	</div>
	<div class="metadata-property-value">
		{className}
	</div>
	<button onclick={openMenu}>Edit</button>
</div>
