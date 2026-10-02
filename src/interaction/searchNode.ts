export class searchEngine {
  searchResults = []
  data: any;
  graph: any;
  selectedNodes: any;

  constructor() {
    const searchInput = document.querySelector("#search_input");
    searchInput.addEventListener("input", (event) => {
      this.searchNodes(event.target.value);
    });
  };

  searchNodes(query: string) {
    if (!query || query.trim() === '') {
      this.clearSearch()
      return []
    }

    // Split by | or , and trim each term
    const searchTerms = query.toLowerCase().split(/[|,]/).map(t => t.trim()).filter(t => t)

    this.searchResults = this.data.nodes.filter((node: { description: string; }) => {
      return node.description &&
        searchTerms.some(term => node.description.toLowerCase().includes(term))
    })

    console.log(`Found ${this.searchResults.length} nodes matching "${query}"`)

    this.highlightSearchResults()
    return this.searchResults
  }

  highlightSearchResults() {
    const self = this

    this.graph.nodeColor((n: any) => {
      // Priority: selected nodes > search results > default
      if (self.selectedNodes.length > 0 && self.selectedNodes.includes(n)) {
        return 'red'
      } else if (n === self.selectedNodes) {
        return 'red'
      } else if (self.searchResults && self.searchResults.includes(n)) {
        return 'orange' // or any color to distinguish search results
      } else {
        return 'gray'
      }
    })
  }

  clearSearch() {
    this.searchResults = []
    // this.updateNodeColors() // Reset to normal coloring
  }
}
