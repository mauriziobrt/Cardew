export class MetadataState {
    selectedNode: Node | undefined;
    // copyMetatada = $state<Record<string, any>>({});
    private reservedKeys = new Set([
        "id",
        "name",
        "x",
        "y",
        "vx",
        "vy",
        "index",
        "__indexColor",
        "vx",
        "vy",
        "fx",
        "fy",
        "__initialDragPos",
        "__dragged",
    ]);

    constructor(private getSelectedNode: () => Node | null) {
        this.selectedNode = this.getSelectedNode; 
     }

    //================================================================
    // Functions
    //================================================================

    retrieveNodeCleanMetadata() {
        if (!this.selectedNode) return;
        //Check ReservedKeys and remove
        // Helper to check for empty values, including empty arrays
        const isEmpty = (val: any) =>
            val === undefined ||
            val === null ||
            val === '' ||
            (Array.isArray(val) && val.filter((item) => item !== '' && item !== null && item !== undefined).length === 0); //fix this now I have array with length 1
        // but the value contained is "" so [""] and then I get 1

        // Remove empty non-reserved keys from selectedNode
        // I need to make a copy though
        const localNode: Node = { ...this.selectedNode };
        for (const key of Object.keys(this.selectedNode)) {
            if (!this.reservedKeys.has(key) && isEmpty(localNode[key])) {
                delete localNode[key];
            }
        }
        //Save this somewhere no? maybe 
        this.copyMetatada = localNode;
    }

    applyMetadata() {
        if (!this.selectedNode) return;
        // this.pushUndo();
        const isEmpty = (val: any) =>
            val === undefined ||
            val === null ||
            val === '' ||
            (Array.isArray(val) && val.filter((item) => item !== '' && item !== null && item !== undefined).length === 0);
        for (const key of Object.keys(this.selectedNode)) {
            if (!this.reservedKeys.has(key) && isEmpty(this.selectedNode[key])) {
                delete this.selectedNode[key];
            }
        }
        for (const key of Object.keys(this.copyMetatada)) {
            if (this.reservedKeys.has(key)) continue;
            this.selectedNode[key] = this.copyMetatada[key];
        }
        // this.updateGraphData();
    }

    applyNodeClass(className: string | number) {
        if (!this.selectedNode || !this.nodeClasses[className]) return;
        // this.pushUndo();

        const template = this.nodeClasses[className];
        // Add any other immutable system keys here

        // Helper to check for empty values, including empty arrays
        const isEmpty = (val: any) =>
            val === undefined ||
            val === null ||
            val === '' ||
            (Array.isArray(val) && val.length === 0);

        // Step 1: Remove empty non-reserved keys from selectedNode
        for (const key of Object.keys(this.selectedNode)) {
            if (!this.reservedKeys.has(key) && isEmpty(this.selectedNode[key])) {
                delete this.selectedNode[key];
            }
        }

        // Step 2: Assign template values for missing keys
        for (const key of Object.keys(template)) {
            if (this.reservedKeys.has(key)) continue;

            if (!(key in this.selectedNode)) {
                this.selectedNode[key] = template[key];
            }
        }
        this.selectedNode.className = className;
        // this.updateGraphData();
    }

    saveNodeAsClass(className: string, overwrite: boolean) {
        // if overwrite on I can saveToExistingClas
        if (!this.selectedNode || !this.graphData) return [];
        const fields = { ...this.selectedNode };
        for (const reservedKey of this.reservedKeys) {
            delete fields[reservedKey];
        }
        //make all fields empty
        for (const key of Object.keys(fields)) {
            // here depending on the type I should empty them
            fields[key] = null;
        }
        // console.log("New class",className);
        this.nodeClasses[className] = fields;

        // delete RESERVED/RESERVEDEXTRA fields.className. 
        // If !overwrite && this.nodeClasses[className] exists
        // return early (or confirm()). 
        // this.nodeClasses[className] = fields; 
        // await fileLoader.saveNodeClasses(filePath, this.nodeClasses);
    }

    removeMetadata(metaName: any) {
        if (!this.graphData) return;
        // this.pushUndo();
        // here I have to pass the exact instance of link: {source: ...; target: ...}
        if (!this.selectedNode) return;
        console.log(this.selectedNode[metaName]);
        delete this.selectedNode[metaName];

        // this.updateGraphData();
    }
}