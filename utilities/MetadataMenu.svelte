<script lang="ts">
	import { Menu, Notice } from "obsidian";
	let { name = "None" } = $props();
	function openMenu(event: MouseEvent) {
		const menu = new Menu();
		const formats = ["PDF", "PNG", "SVG", "Markdown"];
		menu.addItem((item) => {
			item.setTitle("Select Class").setIcon("download");

			const submenu = item.setSubmenu();

			//this should be iteratively filled depending on the available classes
			for (const format of formats) {
				submenu.addItem((sub) =>
					sub
						.setTitle(`As ${format}`)
						.onClick(() => new Notice(`Exported ${format}`)),
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
					name = "Copy";
				}),
		);

		menu.addItem((item) =>
			item
				.setTitle("Paste Metadata")
				.setIcon("paste")
				.onClick(() => {
					new Notice("Pasted");
					name = "Paste";
				}),
		);
		menu.addSeparator();

		menu.addItem((item) =>
			item
				.setTitle("Save to new class")
				.setIcon("paste")
				.onClick(() => {
					new Notice("Pasted");
					name = "Paste";
				}),
		);

		menu.addItem((item) =>
			item
				.setTitle("Save to existing class")
				.setIcon("paste")
				.onClick(() => {
					new Notice("Pasted");
					name = "Paste";
				}),
		);

		menu.addSeparator();

		menu.addItem((item) =>
			item
				.setTitle("Reset metadata")
				.setIcon("paste")
				.onClick(() => {
					new Notice("Pasted");
					name = "Paste";
				}),
		);

		menu.showAtMouseEvent(event);
	}
</script>

<div class="metadata-property">
	<div class="metadata-property-key">
		<span class="metadata-property-icon"></span>
		<span>Class</span>
	</div>
	<div class="metadata-property-value">
		{name}
	</div>
	<button on:click={openMenu}>Edit</button>
</div>
