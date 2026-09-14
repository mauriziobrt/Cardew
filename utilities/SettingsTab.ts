// SettingsTab.ts
import { App, PluginSettingTab, Setting } from 'obsidian';
import type ExamplePlugin from '../main';

export class ForceGraphSettingTab extends PluginSettingTab {
    plugin: ExamplePlugin;

    constructor(app: App, plugin: ExamplePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // OSC Settings Section
        containerEl.createEl('h2', { text: 'OSC Settings' });

        new Setting(containerEl)
            .setName('Local Port')
            .setDesc('Port to listen on for incoming OSC messages')
            .addText(text => text
                .setPlaceholder('57122')
                .setValue(this.plugin.config.current.osc.localPort.toString())
                .onChange(async (value) => {
                    const port = parseInt(value);
                    if (port >= 0 && port <= 65535) {
                        this.plugin.config.updateOSC({ localPort: port });
                        await this.plugin.config.save(this.plugin);
                        // Restart OSC with new port
                        await this.plugin.restartOSC();
                    }
                }));

        new Setting(containerEl)
            .setName('Remote Address')
            .setDesc('IP address to send OSC messages to')
            .addText(text => text
                .setPlaceholder('127.0.0.1')
                .setValue(this.plugin.config.current.osc.remoteAddress)
                .onChange(async (value) => {
                    this.plugin.config.updateOSC({ remoteAddress: value });
                    await this.plugin.config.save(this.plugin);
                    await this.plugin.restartOSC();
                }));

        new Setting(containerEl)
            .setName('Remote Port')
            .setDesc('Port to send OSC messages to')
            .addText(text => text
                .setPlaceholder('57120')
                .setValue(this.plugin.config.current.osc.remotePort.toString())
                .onChange(async (value) => {
                    const port = parseInt(value);
                    if (port >= 0 && port <= 65535) {
                        this.plugin.config.updateOSC({ remotePort: port });
                        await this.plugin.config.save(this.plugin);
                        await this.plugin.restartOSC();
                    }
                }));

        new Setting(containerEl)
            .setName('IP Version')
            .setDesc('UDP protocol version')
            .addDropdown(dropdown => dropdown
                .addOption('udp4', 'IPv4')
                .addOption('udp6', 'IPv6')
                .setValue(this.plugin.config.current.osc.ipVersion)
                .onChange(async (value: 'udp4' | 'udp6') => {
                    this.plugin.config.updateOSC({ ipVersion: value });
                    await this.plugin.config.save(this.plugin);
                    await this.plugin.restartOSC();
                }));

        // Graph Settings Section
        containerEl.createEl('h2', { text: 'Graph Settings' });

        new Setting(containerEl)
            .setName('Node Size')
            .setDesc('Relative size of nodes in the graph')
            .addSlider(slider => slider
                .setLimits(1, 20, 1)
                .setValue(this.plugin.config.current.graph.nodeSize)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.config.updateGraph({ nodeSize: value });
                    await this.plugin.config.save(this.plugin);
                    this.plugin.graphState.graph?.nodeRelSize(value);
                }));

        new Setting(containerEl)
            .setName('Link Width Divisor')
            .setDesc('Divides link weight to determine width')
            .addSlider(slider => slider
                .setLimits(1, 10, 0.5)
                .setValue(this.plugin.config.current.graph.linkWidth)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.config.updateGraph({ linkWidth: value });
                    await this.plugin.config.save(this.plugin);
                    this.plugin.graphState.graph?.linkWidth((node: any) => node.weight / value);
                }));

        new Setting(containerEl)
            .setName('Alpha Decay')
            .setDesc('Speed of physics simulation cooldown (higher = faster)')
            .addSlider(slider => slider
                .setLimits(0.01, 0.1, 0.01)
                .setValue(this.plugin.config.current.graph.alphaDecay)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.config.updateGraph({ alphaDecay: value });
                    await this.plugin.config.save(this.plugin);
                    this.plugin.graphState.graph?.d3AlphaDecay(value);
                }));

        new Setting(containerEl)
            .setName('Velocity Decay')
            .setDesc('Friction in the simulation (higher = more friction)')
            .addSlider(slider => slider
                .setLimits(0.1, 0.9, 0.1)
                .setValue(this.plugin.config.current.graph.velocityDecay)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.config.updateGraph({ velocityDecay: value });
                    await this.plugin.config.save(this.plugin);
                    this.plugin.graphState.graph?.d3VelocityDecay(value);
                }));

        // Paths Section
        containerEl.createEl('h2', { text: 'Paths' });

        new Setting(containerEl)
            .setName('Default Data Path')
            .setDesc('Default directory for graph data files')
            .addText(text => text
                .setPlaceholder('/path/to/data')
                .setValue(this.plugin.config.current.paths.defaultDataPath)
                .onChange(async (value) => {
                    this.plugin.config.update({
                        paths: { defaultDataPath: value }
                    });
                    await this.plugin.config.save(this.plugin);
                }));

        // Colors Section
        containerEl.createEl('h2', { text: 'Open Access Colors' });

        const colorSettings = [
            { key: 'gold', name: 'Gold OA', desc: 'Color for gold open access' },
            { key: 'green', name: 'Green OA', desc: 'Color for green open access' },
            { key: 'diamond', name: 'Diamond OA', desc: 'Color for diamond open access' },
            { key: 'closed', name: 'Closed', desc: 'Color for closed access' },
            { key: 'hybrid', name: 'Hybrid', desc: 'Color for hybrid access' }
        ];

        colorSettings.forEach(({ key, name, desc }) => {
            new Setting(containerEl)
                .setName(name)
                .setDesc(desc)
                .addText(text => text
                    .setPlaceholder('#ffffffff')
                    .setValue(this.plugin.config.current.colors[key as keyof typeof this.plugin.config.current.colors])
                    .onChange(async (value) => {
                        this.plugin.config.update({
                            colors: {
                                ...this.plugin.config.current.colors,
                                [key]: value
                            }
                        });
                        await this.plugin.config.save(this.plugin);
                        // Trigger graph color update
                        if (this.plugin.graphState.graphData) {
                            this.plugin.graphState.updateData(this.plugin.graphState.graphData);
                        }
                    }));
        });


        // Creative Mode
        containerEl.createEl('h2', { text: 'Creative Mode' });
        // Enable Creative Mode
        new Setting(containerEl)
            .setName('Enable Creative Mode')
            .setDesc('Enable the creation of new nodes using background click or OSC.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.config.current.creative.modeEnabled)
                // when changing update the config value so that it is saved
                .onChange(async (value) => {
                    this.plugin.config.update({
                        creative: {
                            modeEnabled: value,
                        }
                    });
                    await this.plugin.config.save(this.plugin);
                }));
        // Creative Mode
        containerEl.createEl('h2', { text: 'Reset' });

        // Reset to defaults button
        new Setting(containerEl)
            .setName('Reset to Defaults')
            .setDesc('Reset all settings to their default values')
            .addButton(button => button
                .setButtonText('Reset')
                .setWarning()
                .onClick(async () => {
                    this.plugin.config.update(this.plugin.DEFAULT_CONFIG);
                    await this.plugin.config.save(this.plugin);
                    await this.plugin.restartOSC();
                    this.display(); // Refresh UI
                }));

    }
}