import type { NodeObject } from 'force-graph';
import { Notice } from 'obsidian';

export class MetadataState {
    // selectedNode: Node | undefined;
    copyMetatada = <Record<string, any>>({});
    copyClass: string = "";
    // nodeClasses = $state<Record<string, any>>({
    //     "bibliometrics": {
    //         "id": "",
    //         "user": "",
    //         "description": "",
    //         "year": "",
    //         "openacces": "",
    //         "citations": 0,
    //         "subject areas": [],
    //         "scival topics cluster": [],
    //         "scival topics": []
    //     },
    //     "notes": {
    //     },
    //     "granulator": {
    //         "grainSize": 0,
    //     }
    // });

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

    constructor(private getSelectedNode: () => NodeObject | null) {
        // this.getSelectedNode;
    }
    // get selectedNode() { return this.getSelectedNode; }

    //================================================================
    // Functions
    //================================================================

    retrieveNodeClass(selectedNode: NodeObject) {
        if (!selectedNode) return;
        if (!selectedNode.className) {
            new Notice("Element doesn't have a class yet");
            return
        }
        this.copyClass = selectedNode.className;
    }

    retrieveNodeCleanMetadata(selectedNode: NodeObject) {
        if (!selectedNode) return;
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
        const localNode: NodeObject = { ...selectedNode };
        for (const key of Object.keys(selectedNode)) {
            if (!this.reservedKeys.has(key) && isEmpty(localNode[key])) {
                delete localNode[key];
            }
        }
        //Save this somewhere no? maybe 
        this.copyMetatada = localNode;
    }

    applyMetadata(selectedNode: NodeObject) {
        if (!selectedNode) return;
        console.log("SELECTED", selectedNode)
        console.log(this.copyMetatada)
        const isEmpty = (val: any) =>
            val === undefined ||
            val === null ||
            val === '' ||
            (Array.isArray(val) && val.filter((item) => item !== '' && item !== null && item !== undefined).length === 0);
        for (const key of Object.keys(selectedNode)) {
            if (!this.reservedKeys.has(key) && isEmpty(selectedNode[key])) {
                delete selectedNode[key];
            }
        }
        for (const key of Object.keys(this.copyMetatada)) {
            if (this.reservedKeys.has(key)) continue;
            selectedNode[key] = this.copyMetatada[key];
        }
    }

    applyRetrievedNodeClass(selectedNode: NodeObject, template: Record<string, any>){
        if (!this.copyClass) return;
        this.applyNodeClass(selectedNode, this.copyClass, template[this.copyClass])
    }

    applyNodeClass(selectedNode: NodeObject, className: string | number, template: Record<string, any>) {
        if (!selectedNode) return;
        // console.log("This is the node!!", selectedNode)
        // const template = this.nodeClasses[className];
        // Add any other immutable system keys here

        // Helper to check for empty values, including empty arrays
        const isEmpty = (val: any) =>
            val === undefined ||
            val === null ||
            val === '' ||
            (Array.isArray(val) && val.length === 0);

        // Remove empty non-reserved keys from selectedNode
        for (const key of Object.keys(selectedNode)) {
            if (!this.reservedKeys.has(key) && isEmpty(selectedNode[key])) {
                delete selectedNode[key];
            }
        }

        // Assign template values for missing keys
        for (const key of Object.keys(template)) {
            if (this.reservedKeys.has(key)) continue;

            if (!(key in selectedNode)) {
                selectedNode[key] = template[key];
            }
        }
        selectedNode.className = className;
        // console.log("This is the node!!", selectedNode)
    }

    getEmptyFields(selectedNode: NodeObject) {
        // if overwrite on I can saveToExistingClas
        if (!selectedNode) return [];
        const fields = { ...selectedNode };
        for (const reservedKey of this.reservedKeys) {
            delete fields[reservedKey];
        }
        //make all fields empty
        for (const key of Object.keys(fields)) {
            // here depending on the type I should empty them
            fields[key] = null;
        }
        // console.log("New class",className);
        // console.log(fields);
        // nodeClasses[className] = fields;
        return fields;
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