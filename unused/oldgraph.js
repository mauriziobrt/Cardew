"use strict"

let linkStaticColor = 'rgba(104, 100, 100, 0.3)';

function ForceGraphController(client) {
  this.graph = null
  this.selectedNode = null
  this.selectedNodes = []
  this.highlightedPath = []
  this.maxWeight = 0
  this.maxDegree = 0
  this.maxCitations = 0
  this.degree = {}
  this.colorScale = null
  this.data = null
  this.animationTimer = null
  this.animationInProgress = false
  this.activeTimeouts = []
  this.keyboardController = null // Will be set after keyboard controller is created
  this.mousePosition = { x: 0, y: 0 }
  this.isDrawingArrow = false
  this.colorMap = {
    'gold': '#fff260a7',
    'green': '#cdfec5a6',
    'diamond': '#7bf3e56c',
    'closed': '#84848466',
    'hybrid': '#cf6acc7e'
  };
  this.boxSelection = { active: false, start: null, end: null }

  // Config
  this.config = {
    onHover: false,
    onWasd: true,
    onTransition: true,
    onSpace: true,
    currentWeight: 0,
    currentWeightTime: 1000,
    repulsionVal: 20
  }

  this.initialize = function (data) {
    this.data = data
    this.calculateDegrees()
    this.calculateMaxValues()
    this.setupGraph()
    this.setupInteractions()
    this.displayInfo()
  }

  this.calculateDegrees = function () {
    this.degree = {}
    this.data.links.forEach(link => {
      this.degree[link.source] = (this.degree[link.source] || 0) + 1
      this.degree[link.target] = (this.degree[link.target] || 0) + 1
    })
  }

  this.calculateMaxValues = function () {
    const max = this.data.links.reduce((prev, current) => (prev && prev.weight > current.weight) ? prev : current)
    this.maxWeight = max.weight
    this.maxDegree = Math.max(...Object.values(this.degree))
    this.maxCitations = Math.max(...this.data.nodes.map(node => node.citations))
    console.log('Max Weight is:', this.maxWeight, '. Max Degree is: ', this.maxDegree, '. Max Citations are', this.maxCitations)
  }

  this.setupGraph = function () {
    const elem = document.getElementById('graph')
    if (!this.graph) {
      this.graph = new ForceGraph(elem)
        .width(window.innerWidth)
        .height(window.innerHeight)
      this.configureGraph()
      this.setupMouseTracking()  // Add this line

      const self = this
      window.addEventListener('resize', () => {
        self.graph.width(window.innerWidth).height(window.innerHeight)
      })
    }
    this.graph.graphData(this.data)
  }

  this.configureGraph = function () {
    const self = this
    this.graph
      .backgroundColor('#000000ff')
      .nodeRelSize(6)
      .nodeLabel(node => `${node.user}: ${node.description}`)
      .linkCurvature(0.2)
      .linkWidth(link => link.weight / 2.0)
      .linkColor(() => linkStaticColor)
      .nodeVal(node => self.degree[node.id] || 1)
      .d3Force('charge', d3.forceManyBody().strength(node => -self.degree[node.id] * self.config.repulsionVal))
      .d3Force('collision', d3.forceCollide(node => self.degree[node.id] * 2))
      .linkDirectionalParticles(2)
      .autoPauseRedraw(false)
      .onNodeHover(node => self.handleNodeHover(node))
      .nodeCanvasObject((node, ctx, globalScale) => self.drawCustomNode(node, ctx, globalScale))
      .nodeCanvasObjectMode(() => 'replace')
  }

  this.handleNodeHover = function (node) {
    if (node && this.config.onHover) {
      this.selectNode(node, false)
      // document.getElementById('content').innerText = node.description
      // sendOSCMessage(node, '/control', this.degree[node.id])
    }
  }

  this.setupInteractions = function () {
    this.setupNodeSelection()
    this.setupColorScale()
    this.setupBackgroundClick()
    this.setupParameters()
    this.setupBoxSelection()
  }

  this.displayInfo = function () {
    // console.log('Nodes:', this.data.nodes.length, 'Links:', this.data.links.length)
    document.getElementById("nodes_amount_visual").innerHTML = this.data.nodes.length
    document.getElementById("links_amount_visual").innerHTML = this.data.links.length
  }
  this.setupNodeSelection = function () {
    const self = this
    this.graph.onNodeClick((node, event) => self.handleNodeClick(node))
  }
  
  // Update the handleNodeClick method:
  this.handleNodeClick = function (node) {
    this.updateNodeInfo(node)
    this.sendNodeData(node)

    const shiftPressed = this.keyboardController ? this.keyboardController.getShiftState() : false
    const spacePressed = this.keyboardController ? this.keyboardController.getSpaceState() : false

    if (shiftPressed) {
      this.shiftSelection(node)
      this.clearActiveAnimations()
    } else {
      this.selectNode(node, true)
      this.clearActiveAnimations()
      if (spacePressed) {
        this.highlightNeighborsGradually(node)
      }
    }
  }

  this.updateNodeInfo = function (node) {

  }

  this.sendNodeData = function (node) {
    const tmpmsg = [node.id, node.openacces, node.citations, this.degree[node.id],
    node.year, node.x, node.y, 1, this.maxDegree, this.maxCitations]
    // console.log("Triggered", tmpmsg);
    client.io.osc.play({ path: '/wasd', msg: tmpmsg })
    client.io.midi.outputDevice().send([0x90 + 1, 70, 127])
  }

  this.setupColorScale = function () {
    // const nodes = this.graph.graphData().nodes
    // const userValues = [...new Set(nodes.map(node => node.openacces))]
    // this.colorScale = d3.scaleOrdinal().domain(userValues).range(d3.schemePaired)
    // this.graph.nodeColor(node => this.colorScale(node.openacces))
    this.graph.nodeColor(node => this.colorMap[node.openacces] || '#999999');
  }

  this.setupBackgroundClick = function () {
    const self = this
    this.graph.onBackgroundClick(() => self.handleBackgroundClick())
  }

  this.handleBackgroundClick = function () {
    this.selectedNodes = []
    this.selectedNode = null
    this.highlightedPath = []
    this.clearActiveAnimations()
    this.clearTransitionAnimations()
    // this.graph.nodeColor(node => this.colorScale(node.openacces))
    this.setupColorScale()
    this.updateArrowState()  // Add this line here
    this.graph.linkCurvature(0.2)
    this.graph.linkWidth(node => node.weight / 2.0)
  }

  this.setupParameters = function () {
    const self = this
    const node_size = document.querySelector("#node_size_visual");
    node_size.addEventListener("input", (event) => {
      // console.log("Value ", event.target.value)
      this.graph.nodeRelSize(event.target.value);
    });
    const link_size = document.querySelector("#link_size_visual");
    link_size.addEventListener("input", (event) => {
      // console.log("Value ", event.target.value)
      this.graph.linkWidth(link => link.weight / event.target.value);
    });
    const repulsion_val = document.querySelector("#repulsion_val_visual");
    repulsion_val.addEventListener("input", (event) => {
      // console.log("Value ", event.target.value)
      this.graph.d3Force('charge', d3.forceManyBody().strength(node => -self.degree[node.id] * event.target.value))
        ;
    });
    const searchInput = document.querySelector("#search_input");
    searchInput.addEventListener("input", (event) => {
      this.searchNodes(event.target.value);
    });
  }

  this.searchNodes = function (query) {
    if (!query || query.trim() === '') {
      this.clearSearch()
      return []
    }

    // Split by | or , and trim each term
    const searchTerms = query.toLowerCase().split(/[|,]/).map(t => t.trim()).filter(t => t)

    this.searchResults = this.data.nodes.filter(node => {
      return node.description &&
        searchTerms.some(term => node.description.toLowerCase().includes(term))
    })

    console.log(`Found ${this.searchResults.length} nodes matching "${query}"`)

    this.highlightSearchResults()
    return this.searchResults
  }

  this.highlightSearchResults = function () {
    const self = this

    this.graph.nodeColor(n => {
      // Priority: selected nodes > search results > default
      if (self.selectedNodes.length > 0 && self.selectedNodes.includes(n)) {
        return 'red'
      } else if (n === self.selectedNode) {
        return 'red'
      } else if (self.searchResults && self.searchResults.includes(n)) {
        return 'orange' // or any color to distinguish search results
      } else {
        return 'gray'
      }
    })

    // Keep link colors as they are (for highlighted paths)
    // this.updateNodeColors()
  }

  this.clearSearch = function () {
    this.searchResults = []
    this.updateNodeColors() // Reset to normal coloring
  }

  this.setKeyboardController = function (keyboardController) {
    this.keyboardController = keyboardController
    console.log('Keyboard controller linked to graph controller')
  }

  this.findClosestNodeInDirection = function (currentNodeId, direction) {
    if (!this.config.onWasd) return null
    if (!currentNodeId || !direction) return null
    if (!['up', 'down', 'left', 'right'].includes(direction)) return null

    const nodes = this.graph.graphData().nodes
    if (!nodes || nodes.length === 0) return null

    const currentNode = nodes.find(node => node.id === currentNodeId)
    if (!currentNode || currentNode.x === undefined || currentNode.y === undefined) return null

    const currentX = currentNode.x ?? 0
    const currentY = currentNode.y ?? 0

    const ranges = {
      'right': [7 * Math.PI / 4, Math.PI / 4],
      'up': [Math.PI / 4, 3 * Math.PI / 4],
      'left': [3 * Math.PI / 4, 5 * Math.PI / 4],
      'down': [5 * Math.PI / 4, 7 * Math.PI / 4]
    }

    function isInDirection(angle, targetDirection) {
      const a = (angle + 2 * Math.PI) % (2 * Math.PI)
      const [start, end] = ranges[targetDirection]
      return start < end ? (a >= start && a <= end) : (a >= start || a <= end)
    }

    let closest = null
    let closestDistanceSquared = Infinity

    for (const node of nodes) {
      if (node.id === currentNodeId) continue

      const dx = (node.x ?? 0) - currentX
      const dy = (node.y ?? 0) - currentY
      const distanceSquared = dx * dx + dy * dy

      if (distanceSquared < 0) continue

      const angle = Math.atan2(-dy, dx)

      if (isInDirection(angle, direction) && distanceSquared < closestDistanceSquared) {
        closest = node
        closestDistanceSquared = distanceSquared
      }
    }

    return closest
  }

  // Update the shiftSelection method:
  this.shiftSelection = function (node) {
    if (!this.config.onTransition) return null

    const shiftPressed = this.keyboardController ? this.keyboardController.getShiftState() : false

    if (shiftPressed) {
      if (this.animationInProgress) {
        this.selectedNodes = []
        this.selectedNode = null
        this.highlightedPath = []
        this.clearActiveAnimations()
        this.clearTransitionAnimations()
        this.animationInProgress = false
      }

      const index = this.selectedNodes.indexOf(node)
      if (index !== -1) {
        this.selectedNodes.splice(index, 1)
      } else {
        if (this.selectedNodes.length < 2) {
          this.selectedNodes.push(node)
        } else {
          this.selectedNodes[1] = node
        }
      }

      this.updateNodeColors()

      this.updateArrowState()  // Add this line here

      if (this.selectedNodes.length === 2) {
        this.connectSelectedNodes()
      }
    } else {
      this.selectNode(node, true)
    }
  }

  this.selectNode = function (node, centerView) {
    if (this.animationInProgress) {
      clearTimeout(this.animationTimer)
      this.animationInProgress = false
      this.highlightedPath = []
    }
    this.selectedNodes = []
    this.selectedNode = node
    this.updateNodeColors()
    this.updateArrowState()  // Add this line here
    if (centerView) {
      this.graph.centerAt(node.x, node.y, 300)
    }
  }

  this.updateNodeColors = function () {
    const self = this
    this.graph.nodeColor(n => {
      if (self.selectedNodes.length > 0) {
        return self.selectedNodes.includes(n) ? 'red' : '#84848466'
      } else {
        return n === self.selectedNode ? 'red' : '#84848466'
      }
    })

    this.graph.linkColor(link => {
      return self.highlightedPath.some(pathLink =>
        (pathLink.source === link.source && pathLink.target === link.target) ||
        (pathLink.source === link.target && pathLink.target === link.source)
      ) ? 'rgba(236, 131, 139, 0.5)' : linkStaticColor
    })
  }

  this.findShortestPath = function (startNode, endNode) {
    const nodes = this.graph.graphData().nodes
    const links = this.graph.graphData().links

    const adjacencyList = {}
    nodes.forEach(node => { adjacencyList[node.id] = [] })

    links.forEach(link => {
      const source = typeof link.source === 'object' ? link.source.id : link.source
      const target = typeof link.target === 'object' ? link.target.id : link.target
      adjacencyList[source].push({ node: target, link: link })
      adjacencyList[target].push({ node: source, link: link })
    })

    const queue = [{ node: startNode.id, path: [], links: [] }]
    const visited = new Set([startNode.id])

    while (queue.length > 0) {
      const { node, path, links } = queue.shift()

      if (node === endNode.id) {
        return { path: [...path, node], links: links }
      }

      adjacencyList[node].forEach(neighbor => {
        if (!visited.has(neighbor.node)) {
          visited.add(neighbor.node)
          queue.push({
            node: neighbor.node,
            path: [...path, node],
            links: [...links, neighbor.link]
          })
        }
      })
    }

    return { path: [], links: [] }
  }

  this.connectSelectedNodes = function () {
    const nodes = this.selectedNodes
    console.log('Two nodes selected:', nodes)

    const { path, links } = this.findShortestPath(nodes[0], nodes[1])

    if (path.length === 0) {
      console.log('No path found between selected nodes')
      return
    }

    console.log('Shortest path:', path)
    // sendOSCMessage(nodes[0], '/additive', this.degree[nodes[0].id])
    this.animatePathTraversal(path, links)
  }

  this.animatePathTraversal = function (nodePath, linkPath) {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer)
    }

    this.animationInProgress = true
    this.highlightedPath = []
    let currentStep = 0

    const nodeObjects = this.graph.graphData().nodes
    const nodeMap = {}
    nodeObjects.forEach(node => { nodeMap[node.id] = node })

    const self = this

    function animateStep() {
      if (currentStep >= linkPath.length) {
        self.animationInProgress = false
        // sendOSCStopMessage('/additive')
        return
      }

      self.highlightedPath.push(linkPath[currentStep])

      const currentNodeId = nodePath[currentStep + 1]
      const currentNode = nodeMap[currentNodeId]
      // document.getElementById('content').innerText = currentNode.description

      self.config.currentWeight = self.getWeightBetweenNodes(nodePath[currentStep], currentNodeId)
      self.config.currentWeightTime = mapNumRange(self.config.currentWeight, 0, self.maxWeight, 500, 20000)
      
      // sendOSCMessage(currentNode, '/additive', self.degree[currentNode.id])

      self.graph.centerAt(currentNode.x, currentNode.y, 300)
      self.selectedNodes.push(currentNode)
      self.updateNodeColors()

      const nextDelay = self.config.currentWeightTime
      currentStep++

      self.animationTimer = setTimeout(animateStep, nextDelay)
    }

    const firstWeight = this.getWeightBetweenNodes(nodePath[0], nodePath[1])
    const firstDelay = mapNumRange(firstWeight, 0, this.maxWeight, 500, 20000)

    this.animationTimer = setTimeout(animateStep, firstDelay)
  }

  // this.highlightNeighborsGradually = function (node) {
  //   if (!this.config.onSpace) return null
  //   this.clearActiveAnimations()

  //   const connectedLinks = this.data.links
  //     .filter(link => link.source.id === node.id || link.target.id === node.id)

  //   const connectedNodes = connectedLinks
  //     .map(link => link.source.id === node.id ? link.target : link.source)

  //   const tmpMaxWeight = Math.max(...connectedLinks.map(link => link.weight))

  //   this.data.nodes.forEach(n => { n.highlighted = false })
  //   node.highlighted = true

  //   this.graph.nodeColor(n => n === node ? 'yellow' : 'gray')

  //   const self = this
  //   connectedNodes.forEach((neighbor, index) => {
  //     const weight = self.getWeightBetweenNodes(node.id, neighbor.id)
  //     const delay = Math.pow(1 - (weight / tmpMaxWeight), 3.2) * 5000

  //     const timeoutId = setTimeout(() => {
  //       neighbor.highlighted = true
  //       self.graph.nodeColor(n => n.highlighted ? 'red' : 'gray')
  //       // sendOSCMessage(neighbor, '/bubbles', self.degree[neighbor.id], weight)
  //     }, delay)

  //     self.activeTimeouts.push(timeoutId)
  //   })
  // }

  this.clearTransitionAnimations = function () {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer)
      // sendOSCStopMessage('/additive')
    }
  }

  this.clearActiveAnimations = function () {
    this.activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
    this.activeTimeouts = []
  }

  this.getWeightBetweenNodes = function (sourceId, targetId) {
    const link = this.data.links.find(link =>
      (link.source.id === sourceId && link.target.id === targetId) ||
      (link.source.id === targetId && link.target.id === sourceId)
    )
    return link ? link.weight : 0
  }
  this.setupMouseTracking = function () {
    const self = this
    const elem = document.getElementById('graph')
    elem.addEventListener('mousemove', (event) => {
      const rect = elem.getBoundingClientRect()
      self.mousePosition.x = event.clientX - rect.left
      self.mousePosition.y = event.clientY - rect.top
      self.updateArrowState()
    })
  }

  this.updateArrowState = function () {
    const shiftPressed = this.keyboardController ? this.keyboardController.getShiftState() : false
    this.isDrawingArrow = shiftPressed && this.selectedNodes.length === 1
  }

  this.drawCustomNode = function (node, ctx, globalScale) {
    // Draw the node first
    const size = Math.sqrt(this.degree[node.id] || 1) * 6
    ctx.fillStyle = this.graph.nodeColor()(node)
    ctx.beginPath()
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
    ctx.fill()

    // Draw arrow (only once for selected node)
    if (this.isDrawingArrow && this.selectedNodes[0] === node) {
      ctx.save()
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      ctx.beginPath()
      ctx.moveTo(node.x, node.y)

      const mouseGraphCoords = this.graph.screen2GraphCoords(this.mousePosition.x, this.mousePosition.y)
      ctx.lineTo(mouseGraphCoords.x, mouseGraphCoords.y)
      ctx.stroke()

      const angle = Math.atan2(mouseGraphCoords.y - node.y, mouseGraphCoords.x - node.x)
      const arrowLength = 15 / globalScale
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(mouseGraphCoords.x, mouseGraphCoords.y)
      ctx.lineTo(mouseGraphCoords.x - arrowLength * Math.cos(angle - Math.PI / 6),
        mouseGraphCoords.y - arrowLength * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(mouseGraphCoords.x, mouseGraphCoords.y)
      ctx.lineTo(mouseGraphCoords.x - arrowLength * Math.cos(angle + Math.PI / 6),
        mouseGraphCoords.y - arrowLength * Math.sin(angle + Math.PI / 6))
      ctx.stroke()
      ctx.restore()
    }

    // Draw box selection (only once, check if first node)
    if (this.boxSelection.active && this.boxSelection.start && this.boxSelection.end && node === this.data.nodes[0]) {
      ctx.save()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.52)'
      ctx.fillStyle = 'rgba(75, 2, 2, 0.43)'
      ctx.lineWidth = 2 / globalScale

      const x = Math.min(this.boxSelection.start.x, this.boxSelection.end.x)
      const y = Math.min(this.boxSelection.start.y, this.boxSelection.end.y)
      const w = Math.abs(this.boxSelection.end.x - this.boxSelection.start.x)
      const h = Math.abs(this.boxSelection.end.y - this.boxSelection.start.y)

      ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)
      ctx.restore()
    }
  }

  this.setupBoxSelection = function () {
    const self = this
    let isBoxSelecting = false

    const elem = document.getElementById('graph')

    elem.addEventListener('mousedown', (e) => {
      if (e.button !== 2) return

      isBoxSelecting = true
      const rect = elem.getBoundingClientRect()
      self.boxSelection.start = self.graph.screen2GraphCoords(e.clientX - rect.left, e.clientY - rect.top)
      self.boxSelection.end = self.boxSelection.start
      self.boxSelection.active = true
      e.preventDefault()
    })

    elem.addEventListener('mousemove', (e) => {
      if (!isBoxSelecting) return
      const rect = elem.getBoundingClientRect()
      self.boxSelection.end = self.graph.screen2GraphCoords(e.clientX - rect.left, e.clientY - rect.top)

      const minX = Math.min(self.boxSelection.start.x, self.boxSelection.end.x)
      const maxX = Math.max(self.boxSelection.start.x, self.boxSelection.end.x)
      const minY = Math.min(self.boxSelection.start.y, self.boxSelection.end.y)
      const maxY = Math.max(self.boxSelection.start.y, self.boxSelection.end.y)

      self.selectedNodes = self.data.nodes.filter(n =>
        n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY
      )
      self.updateNodeColors()
    })

    elem.addEventListener('mouseup', (e) => {
      if (e.button !== 2) return
      isBoxSelecting = false
      self.boxSelection.active = false
    })

    elem.addEventListener('contextmenu', (e) => e.preventDefault())
  }
}