// Define the Node class for the grid
class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.isStart = false;
        this.isEnd = false;
        this.isWall = false;
        this.weight = 1; // Default weight
        this.distance = Infinity; // For Dijkstra's Algorithm
        this.fScore = Infinity; // For A* Algorithm (f = g + h)
        this.gScore = Infinity; // For A* Algorithm (cost from start to current node)
        this.hScore = 0; // For A* Algorithm (heuristic: estimated cost to end)
        this.previous = null; // Used to reconstruct the path
        this.isVisited = false; // Track if this node has been visited
    }

    reset() {
        this.distance = Infinity;
        this.fScore = Infinity;
        this.gScore = Infinity;
        this.hScore = 0;
        this.previous = null;
        this.isVisited = false;
    }
}

// Define the Grid class that will hold all nodes and manage interactions
class Grid {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.nodes = [];
        this.startNode = null;
        this.endNode = null;
        this.createGrid();
    }

    createGrid() {
        this.nodes = [];
        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            for (let col = 0; col < this.cols; col++) {
                currentRow.push(new Node(row, col));
            }
            this.nodes.push(currentRow);
        }
    }

    getNode(row, col) {
        return this.nodes[row][col];
    }

    setStartNode(row, col) {
        if (this.startNode) {
            this.startNode.isStart = false;
        }
        const node = this.getNode(row, col);
        node.isStart = true;
        this.startNode = node;
    }

    setEndNode(row, col) {
        if (this.endNode) {
            this.endNode.isEnd = false;
        }
        const node = this.getNode(row, col);
        node.isEnd = true;
        this.endNode = node;
    }

    toggleWall(row, col) {
        const node = this.getNode(row, col);
        if (!node.isStart && !node.isEnd) {
            node.isWall = !node.isWall;
            if (node.isWall) {
                node.weight = 1; // Reset weight if it becomes a wall
            }
        }
    }

    setWeight(row, col, weight) {
        const node = this.getNode(row, col);
        if (!node.isStart && !node.isEnd && !node.isWall) {
            node.weight = weight;
        }
    }

    resetNodes() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.getNode(row, col).reset();
            }
        }
    }

    getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;
        
        // Check in all four directions (up, right, down, left)
        if (row > 0) neighbors.push(this.getNode(row - 1, col)); // Up
        if (col < this.cols - 1) neighbors.push(this.getNode(row, col + 1)); // Right
        if (row < this.rows - 1) neighbors.push(this.getNode(row + 1, col)); // Down
        if (col > 0) neighbors.push(this.getNode(row, col - 1)); // Left
        
        // Filter out walls
        return neighbors.filter(neighbor => !neighbor.isWall);
    }

    clearBoard() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.getNode(row, col);
                node.isWall = false;
                node.weight = 1;
                node.reset();
            }
        }
    }

    resizeGrid(newRows, newCols) {
        this.rows = newRows;
        this.cols = newCols;
        this.startNode = null;
        this.endNode = null;
        this.createGrid();
    }
}

// PriorityQueue for Dijkstra's and A* Algorithms
class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.elements.shift().element;
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}

// Dijkstra's Algorithm
function dijkstra(grid, startNode, endNode) {
    const visitedNodesInOrder = [];
    startNode.distance = 0;
    const unvisitedNodes = getAllNodes(grid);
    
    while (unvisitedNodes.length) {
        sortNodesByDistance(unvisitedNodes);
        const closestNode = unvisitedNodes.shift();
        
        // If we encounter a wall, skip it
        if (closestNode.isWall) continue;
        
        // If the closest node is at a distance of infinity, we're trapped
        if (closestNode.distance === Infinity) return { visitedNodes: visitedNodesInOrder, path: [] };
        
        closestNode.isVisited = true;
        visitedNodesInOrder.push(closestNode);
        
        // If we've reached the end node, we're done
        if (closestNode === endNode) {
            return { 
                visitedNodes: visitedNodesInOrder, 
                path: getNodesInShortestPathOrder(endNode)
            };
        }
        
        updateUnvisitedNeighbors(closestNode, grid);
    }
    
    // If we get here, there's no path
    return { visitedNodes: visitedNodesInOrder, path: [] };
}

// A* Algorithm
function astar(grid, startNode, endNode) {
    const visitedNodesInOrder = [];
    startNode.gScore = 0;
    startNode.fScore = heuristic(startNode, endNode);
    const openSet = new PriorityQueue();
    openSet.enqueue(startNode, startNode.fScore);
    
    while (!openSet.isEmpty()) {
        const currentNode = openSet.dequeue();
        
        // Skip walls
        if (currentNode.isWall) continue;
        
        // If we've already visited this node, continue
        if (currentNode.isVisited) continue;
        
        currentNode.isVisited = true;
        visitedNodesInOrder.push(currentNode);
        
        // If we've reached the end node, we're done
        if (currentNode === endNode) {
            return { 
                visitedNodes: visitedNodesInOrder, 
                path: getNodesInShortestPathOrder(endNode)
            };
        }
        
        // Check all neighbors
        const neighbors = grid.getNeighbors(currentNode);
        for (const neighbor of neighbors) {
            // Calculate tentative gScore (distance from start to neighbor through current)
            const tentativeGScore = currentNode.gScore + neighbor.weight;
            
            // If this path to neighbor is better than any previous one, record it
            if (tentativeGScore < neighbor.gScore) {
                neighbor.previous = currentNode;
                neighbor.gScore = tentativeGScore;
                neighbor.fScore = neighbor.gScore + heuristic(neighbor, endNode);
                
                // If the neighbor is not in the openSet, add it
                if (!neighbor.isVisited) {
                    openSet.enqueue(neighbor, neighbor.fScore);
                }
            }
        }
    }
    
    // If we get here, there's no path
    return { visitedNodes: visitedNodesInOrder, path: [] };
}

// Manhattan distance heuristic for A*
function heuristic(nodeA, nodeB) {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

// Helper function to get all nodes from the grid
function getAllNodes(grid) {
    const nodes = [];
    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            nodes.push(grid.getNode(row, col));
        }
    }
    return nodes;
}

// Helper function to sort nodes by distance
function sortNodesByDistance(nodes) {
    nodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
}

// Helper function to update unvisited neighbors
function updateUnvisitedNeighbors(node, grid) {
    const neighbors = grid.getNeighbors(node);
    for (const neighbor of neighbors) {
        if (!neighbor.isVisited) {
            const tentativeDistance = node.distance + neighbor.weight;
            if (tentativeDistance < neighbor.distance) {
                neighbor.distance = tentativeDistance;
                neighbor.previous = node;
            }
        }
    }
}

// Helper function to get nodes in shortest path order
function getNodesInShortestPathOrder(finishNode) {
    const nodesInShortestPathOrder = [];
    let currentNode = finishNode;
    while (currentNode !== null) {
        nodesInShortestPathOrder.unshift(currentNode);
        currentNode = currentNode.previous;
    }
    return nodesInShortestPathOrder;
}

// Function to generate a random maze
function generateRandomMaze(grid, wallDensity = 0.3) {
    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            const node = grid.getNode(row, col);
            if (!node.isStart && !node.isEnd && Math.random() < wallDensity) {
                node.isWall = true;
            }
        }
    }
}

// Function to generate random weights
function generateRandomWeights(grid, probability = 0.2, minWeight = 2, maxWeight = 10) {
    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            const node = grid.getNode(row, col);
            if (!node.isStart && !node.isEnd && !node.isWall && Math.random() < probability) {
                const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
                node.weight = weight;
            }
        }
    }
}

// Function to generate random start and end points
function generateRandomStartEnd(grid) {
    // Reset existing start and end
    if (grid.startNode) grid.startNode.isStart = false;
    if (grid.endNode) grid.endNode.isEnd = false;
    
    // Generate random positions
    let startRow, startCol, endRow, endCol;
    
    do {
        startRow = Math.floor(Math.random() * grid.rows);
        startCol = Math.floor(Math.random() * grid.cols);
        endRow = Math.floor(Math.random() * grid.rows);
        endCol = Math.floor(Math.random() * grid.cols);
    } while (
        (startRow === endRow && startCol === endCol) || // Ensure start and end are different
        grid.getNode(startRow, startCol).isWall || // Ensure start is not a wall
        grid.getNode(endRow, endCol).isWall // Ensure end is not a wall
    );
    
    // Set new start and end
    grid.setStartNode(startRow, startCol);
    grid.setEndNode(endRow, endCol);
}

// Export all functions and classes
window.Node = Node;
window.Grid = Grid;
window.PriorityQueue = PriorityQueue;
window.dijkstra = dijkstra;
window.astar = astar;
window.generateRandomMaze = generateRandomMaze;
window.generateRandomWeights = generateRandomWeights;
window.generateRandomStartEnd = generateRandomStartEnd; 