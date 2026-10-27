// config.ts
export interface PluginConfig {
    textDisplayProperty: string;
    dagMode: string;
    osc: {
        localPort: number;
        remoteAddress: string;
        remotePort: number;
        ipVersion: 'udp4' | 'udp6';
    };
    graph: {
        nodeSize: number;
        linkWidth: number;
        alphaDecay: number;
        velocityDecay: number;
        cooldownTicks: number;
    };
    paths: {
        defaultDataPath: string;
    };
    mappings: { property: string; rules: { value: string; shape: string; color: string }[] };
    colors: {
        gold: string;
        green: string;
        diamond: string;
        closed: string;
        hybrid: string;
    };
    creative: {
        modeEnabled: boolean
    };
    centerAtNode: {
        modeEnabled: boolean
    };
    newName: string;
    hasEdits: boolean;
    physicsOn: boolean;
    navMode: string;
    directionToggle: boolean;
}

export const DEFAULT_CONFIG: PluginConfig = {
    textDisplayProperty: "",
    osc: {
        localPort: 57122,
        remoteAddress: '127.0.0.1',
        remotePort: 57120,
        ipVersion: 'udp4'
    },
    graph: {
        nodeSize: 6,
        linkWidth: 4.0,
        alphaDecay: 0.02,
        velocityDecay: 0.3,
        cooldownTicks: 200
    },
    paths: {
        defaultDataPath: '/path/to/data'
    },
    colors: {
        gold: "#fff260a7",
        green: "#cdfec5a6",
        diamond: "#1eeff6a1",
        closed: "#d4d4d466",
        hybrid: "#cf6acc7e"
    },
    creative: {
        modeEnabled: true
    },
    centerAtNode: {
        modeEnabled: true
    },
    newName: "gennarino_",
    dagMode: "null",
    hasEdits: false,
    physicsOn: true,
    navMode: "free",
    directionToggle: true,
    mappings: {
        property: "",
        rules: []
    }
};

// Reactive config class
export class Config {
    config = $state<PluginConfig>(structuredClone(DEFAULT_CONFIG));
    private listeners: Set<(config: PluginConfig) => void> = new Set();

    get current(): PluginConfig {
        return this.config;
    }

    update(updates: Partial<PluginConfig>) {
        this.config = { ...this.config, ...updates };
        this.notifyListeners();
    }

    updateMappings(m: PluginConfig['mappings']) {
        this.config.mappings = m;
        this.notifyListeners();
    }

    updateOSC(oscConfig: Partial<PluginConfig['osc']>) {
        this.config.osc = { ...this.config.osc, ...oscConfig };
        this.notifyListeners();
    }

    updateGraph(graphConfig: Partial<PluginConfig['graph']>) {
        this.config.graph = { ...this.config.graph, ...graphConfig };
        this.notifyListeners();
    }

    onChange(callback: (config: PluginConfig) => void) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private notifyListeners() {
        this.listeners.forEach(cb => cb(this.config));
    }

    async save(plugin: any) {
        await plugin.saveData(this.config);
    }

    async load(plugin: any) {
        const data = await plugin.loadData();
        if (data) {
            this.config = { ...DEFAULT_CONFIG, ...data };
        }
    }
}