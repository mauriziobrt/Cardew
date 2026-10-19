import type { NodeObject } from "force-graph";
import { prepareSimpleSearch, prepareFuzzySearch, sortSearchResults } from "obsidian";
import type { SearchResult } from "obsidian";

type Result = { id: string; item: string; match: SearchResult };

export class FilteringState {
    // only the search/filtering happens here, whichever selection happens after it depends on graphState
    searchType = "simple";

    constructor() {

    }

    search(nodes: NodeObject[], property: string, query: string | number) {
        const procNodes = this.processNodes(nodes, property);
        const propertyType = typeof nodes[0][property];
        if (propertyType == "string") {
            console.log("STRING");
            const filteredNodes = this.searchThroughNodes(query, procNodes, this.searchType);
            return filteredNodes
        } else if (propertyType == "number") {
            console.log("NUMBER");
            // if (typeof query === 'number') {
            console.log("NUMBER QUERY");
            const filteredNodes = this.searchThroughNodesExpression(procNodes, query);
            console.log(filteredNodes)
            return filteredNodes;
            // }
        } else if (propertyType == "object") {
            console.log("OBJECTS")
            return nodes.slice(0, 10);
        }
    }

    private processNodes(nodes: NodeObject[], property: string) {
        return nodes.map((n) => ({
            id: n.id,
            prop: n[property],
        })) ?? []
    }

    private searchThroughNodes(query: string, items: {}, searchType: string) {
        let matcher;
        if (searchType == "fuzzy") {
            matcher = prepareFuzzySearch(query);

        } else if (searchType == "simple") {
            matcher = prepareSimpleSearch(query);
        }
        const out: Result[] = [];
        for (const { id, prop } of items) {
            const match = matcher(prop);
            if (match) out.push({ id, item: prop, match });
        }
        sortSearchResults(out);
        return out;
    }

    private searchThroughNodesExpression(procNodes: NodeObject[], query: number, mode: string) {
        console.log(procNodes);
        // =, <, >, ><, <>
        if (mode == "=") {
            procNodes.filter((node) => node.prop == query)
        } else if (mode == "<") {
            procNodes.filter((node) => node.prop < query)
        } else if (mode == ">") {
            procNodes.filter((node) => node.prop > query)
        } else if (mode == "><") {
            procNodes.filter((node) => node.prop > query[0] && node.prop < query[0])
        } else if (mode == "<>") {
            procNodes.filter((node) => node.prop > query[0] && node.prop < query[0])
        }
        // add return to the other properties, though it should be put after like
        // search citations 50 >
        // search citations 50 >=
        // search citations 50 <
        // search citations 50 <=
        // search citations 50 =
        // search citations 50 <> 20
        // search citations 50 >< 20
        return procNodes.filter((node) => node.prop > query);

        // well it doesn't have to like circle through everything, it should be simpler
        // it just sees the values and then filter by the values with simple operations

    }
}