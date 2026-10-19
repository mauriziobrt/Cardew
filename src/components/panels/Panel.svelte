<script lang="ts">
	import { Menu } from "obsidian";
	import { onMount } from "svelte";
	let {
		name,
		dict = $bindable(),
		onDeleteMetadata,
		onKeydown,
		allProperties,
		allPropertyValues,
	} = $props();

	// let currentType = $state("text");
	let currentType = $state("text");

	// $effect(() => {
	// 	currentType = dict[`${name}_type`] ?? "text";
	// });

	let listEl: string[] = $state(["text"]);

	onMount(() => {
		// setIcon(btnEl, "x");

		currentType = typeof dict[name];
		// console.log(typeof dict[name]);
		// if (currentType == "string") {
		// 	// console.log(name);
		// 	console.log(allPropertyValues);
		// }
	});
	let fields = ["object", "number", "string"];
	// Ok so this is the internal single line element, that focused block, here we already have the information
	// regarding the element data type

	function triggerDelete(test: any) {
		onDeleteMetadata(test);
		// reset targetId after use
	}

	function removePill(item: string) {
		listEl.remove(item);
		// console.log(dict[name]);
		dict[name].remove(item);
		// console.log(dict[name]);
	}

	// Contextual Menu when Clicking on Icon to change property, copy/paste properties, maybe also delete should be here
	function openMenu(event: MouseEvent) {
		const menu = new Menu();
		menu.addItem((item) => {
			item.setTitle("Property Type").setIcon("download");

			const submenu = item.setSubmenu();

			//this should be iteratively filled depending on the available classes
			for (const format of fields) {
				let tmpTitle = "";
				console.log(format);
				if (format == currentType) {
					tmpTitle = "✓ " + format;
				} else {
					tmpTitle = "    " + format;
				}
				submenu.addItem(
					(sub: {
						setTitle: (arg0: string) => {
							(): any;
							new (): any;
							onClick: { (arg0: () => void): any; new (): any };
						};
					}) =>
						sub.setTitle(tmpTitle).onClick(() => {
							// issue this is not persistent
							currentType = format;
							// dict[`${name}_type`] = format;
							// object only if comma separated stuff and then the stuff should be rendered to object (need an extra function - to do later)
							// console.log(format);
						}),
				);
			}
		});

		// menu.addItem((item) =>
		// 	item
		// 		.setTitle("Cut")
		// 		.setIcon("pencil")
		// 		.onClick(() => console.log("clicked 1")),
		// );

		// menu.addItem((item) =>
		// 	item
		// 		.setTitle("Copy")
		// 		.setIcon("pencil")
		// 		.onClick(() => console.log("clicked 1")),
		// );
		menu.addItem((item) =>
			item
				.setTitle("GetType")
				.setIcon("trash")
				.onClick(() => console.log(currentType)),
		);

		menu.addSeparator();

		menu.addItem((item) =>
			item
				.setTitle("Remove")
				.setIcon("trash")
				.onClick(() => triggerDelete(name)),
		);

		menu.showAtMouseEvent(event);
	}
</script>

<div class="metadata-property" data-property-key={name}>
	<!-- KEY PART -->
	<div class="metadata-property-key">
		<!-- ICON -->
		<span class="metadata-property-icon" aria-disabled="false">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="svg-icon lucide-text"
				onclick={(e) => openMenu(e)}
				><path d="M21 5H3"></path><path d="M15 12H3"></path><path
					d="M17 19H3"
				></path></svg
			>
		</span>
		<!-- Input should vary here depending on name data type!, so I should do something with name before passing it down
		 How can I do that? Using onMount. Infer type? Or should I also store in some way the type for each of those metadata?
		 The second, like there should be an automatic and a get from the metadata, that since we are working with typescript
		 the property should be stored. Then I set the type below.-->
		<input
			class="metadata-property-key-input"
			autocapitalize="none"
			enterkeyhint="next"
			type="text"
			aria-label="duration"
			list="all-properties-no-reserved"
			bind:value={name}
		/>
		<datalist id="all-properties-no-reserved">
			{#each allProperties.slice(0, 10) as id}
				<option value={id}></option>
			{/each}
		</datalist>
	</div>
	<!-- VALUE PART -->
	<div class="metadata-property-value" data-property-type="multitext">
		{#if currentType != "object"}
			{#if name == "fx" || name == "fy"}
				<input
					class="metadata-input-text"
					type="number"
					bind:value={dict[name]}
					onkeydown={onKeydown}
				/>
			{:else}
				<input
					class="metadata-input-text"
					type={currentType}
					bind:value={dict[name]}
					onkeydown={onKeydown}
					list="metadata-values-{name}"
				/>
				{#if currentType == "string"}
					<datalist id="metadata-values-{name}">
						{#each allPropertyValues.slice(0, 10) as nd}
							<option value={nd}></option>
						{/each}
					</datalist>
				{/if}
			{/if}
		{:else}
			<!-- This part should be added systematically with a function, ah ok if class Object, decompose it in its parts  -->
			<div class="multi-select-container" tabindex="-1">
				{#each Array.from(dict[name]).unique() as item}
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<div class="multi-select-pill" tabindex="0">
						<div class="multi-select-pill-content">{item}</div>
						<div class="multi-select-pill-remove-button">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="svg-icon lucide-x"
								onclick={() => removePill(item)}
								><path d="M18 6 6 18"></path><path
									d="m6 6 12 12"
								></path></svg
							>
						</div>
					</div>
				{/each}
				<!-- This has to be made interactive now -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					class="multi-select-input"
					contenteditable="true"
					tabindex="0"
					placeholder=""
				></div>
			</div>
		{/if}
	</div>
</div>
