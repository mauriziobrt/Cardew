import { GraphState } from '../state/graphState.svelte';
import * as fs from 'fs/promises';

export class FileLoader {
    private graphState: GraphState;
    private loadingCache: Map<string, Promise<any>> = new Map();

    constructor(graphState: GraphState) {
        this.graphState = graphState;
    }

    /**
     * Load graph data from a JSON file
     * Returns a promise that resolves when loading is complete
     */
    async loadGraphData(filePath: string): Promise<void> {
        //  Check cache to prevent duplicate loads
        if (this.loadingCache.has(filePath)) {
            console.log(`Already loading ${filePath}, waiting...`);
            return this.loadingCache.get(filePath);
        }

        // Create loading promise
        const loadPromise = this._loadGraphDataInternal(filePath);
        this.loadingCache.set(filePath, loadPromise);

        try {
            await loadPromise;
        } finally {
            // Clear cache after load completes (success or failure)
            this.loadingCache.delete(filePath);
        }
    }

    private async _loadGraphDataInternal(filePath: string): Promise<void> {
        console.time(`Loading ${filePath}`);

        try {
            //  Read file asynchronously
            const fileContent = await fs.readFile(filePath, 'utf-8');

            //  Parse JSON
            const data = JSON.parse(fileContent);

            // Validate data structure
            if (!data.nodes || !Array.isArray(data.nodes)) {
                throw new Error('Invalid graph data: missing or invalid nodes array');
            }
            if (!data.links || !Array.isArray(data.links)) {
                throw new Error('Invalid graph data: missing or invalid links array');
            }

            console.log(`Loaded ${data.nodes.length} nodes and ${data.links.length} links`);

            // Update graph state (this triggers the graph render)
            this.graphState.updateData(data);

            console.timeEnd(`Loading ${filePath}`);

        } catch (error) {
            console.error(`Failed to load graph data from ${filePath}:`, error);

            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            } else if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in file: ${filePath}`);
            } else {
                throw error;
            }
        }
    }

    /**
     * Load multiple graph files and merge them
     */
    async loadMultipleGraphs(filePaths: string[]): Promise<void> {
        const allData = await Promise.all(
            filePaths.map(path => this._loadSingleFile(path))
        );

        // Merge all graphs
        const mergedNodes = [];
        const mergedLinks = [];
        const nodeIds = new Set();

        for (const data of allData) {
            for (const node of data.nodes) {
                if (!nodeIds.has(node.id)) {
                    mergedNodes.push(node);
                    nodeIds.add(node.id);
                }
            }
            mergedLinks.push(...data.links);
        }

        this.graphState.updateData({
            nodes: mergedNodes,
            links: mergedLinks
        });
    }

    private async _loadSingleFile(filePath: string): Promise<any> {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    }

    /**
     * Preload and cache a graph file without updating the UI
     */
    async preloadGraph(filePath: string): Promise<any> {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    }


    //============================================================
    // Function to edit a json file
    //============================================================

    async readJsonFile(filePath: string): Promise<void> {
        const raw = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(raw);
    }

    async writeJsonFile(filePath: string, data: unknown): Promise<void> {
        return fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    async editJsonFile(filePath: string): Promise<void> {
        //https://www.geeksforgeeks.org/javascript/how-to-update-data-in-json-file-using-javascript/

        // Read the JSON file
        const jsonDataBefore = require(filePath);

        // Print JSON data before updating
        console.log('Before updating JSON:');
        console.log(JSON.stringify(jsonDataBefore, null, 2));

        // Update the data
        jsonDataBefore[0].programmingLanguage.push("JavaScript");
        jsonDataBefore[1].programmingLanguage.push("JavaScript");

        // Write the updated data back to the JSON file
        fs.writeFileSync('./data.json', JSON.stringify(jsonDataBefore, null, 2));

        // Print JSON data after updating
        console.log('\nAfter updating JSON:');
        console.log(JSON.stringify(jsonDataBefore));

        console.log('\nData updated successfully.');
    }
}