document.addEventListener('DOMContentLoaded', () => {
    // Global variables
    let gridSize = 10;
    let animationSpeed = 20; // ms between animations (lower = faster)
    let isAutoMode = true;
    let currentTool = 'wall'; // Default tool
    let isMouseDown = false;
    let weightValue = 5; // Default weight value
    
    // Create the two grids
    const dijkstraGrid = new Grid(gridSize, gridSize);
    const astarGrid = new Grid(gridSize, gridSize);
    
    // Step-by-step visualization variables
    let dijkstraAnimationHistory = [];
    let astarAnimationHistory = [];
    let currentStep = 0;
    let maxSteps = 0;
    
    // DOM Elements
    const dijkstraGridElement = document.getElementById('dijkstra-grid');
    const astarGridElement = document.getElementById('astar-grid');
    const dijkstraVisitedElement = document.getElementById('dijkstra-visited');
    const dijkstraLengthElement = document.getElementById('dijkstra-length');
    const astarVisitedElement = document.getElementById('astar-visited');
    const astarLengthElement = document.getElementById('astar-length');
    const helpModal = document.getElementById('help-modal');
    const weightModal = document.getElementById('weight-modal');
    const saveModal = document.getElementById('save-modal');
    const loadModal = document.getElementById('load-modal');
    const customGridModal = document.getElementById('custom-grid-modal');
    const configPanel = document.getElementById('config-panel');
    const actionsBar = document.getElementById('actions-bar');
    
    // Dropdown elements
    const gridSizeSelect = document.getElementById('grid-size-select');
    const speedSelect = document.getElementById('speed-select');
    const modeSelect = document.getElementById('mode-select');
    
    // Initialize grids
    createGridDOM(dijkstraGridElement, dijkstraGrid);
    createGridDOM(astarGridElement, astarGrid);
    
    // Set default start and end nodes
    setStartAndEndNodes(dijkstraGrid, astarGrid);
    
    // Initialize buttons
    initButtons();
    
    // Add event listeners for keyboard shortcuts
    initKeyboardShortcuts();
    
    // Initialize config panel toggle
    initConfigPanel();
    
    // Function to create the grid DOM elements
    function createGridDOM(gridElement, grid) {
        gridElement.innerHTML = '';
        
        // Use grid-template-columns and grid-template-rows with fr units for perfect square cells
        gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        gridElement.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add event listeners for cell interactions
                cell.addEventListener('mousedown', (e) => {
                    e.preventDefault(); // Prevent default drag behavior
                    isMouseDown = true;
                    handleCellInteraction(cell, grid);
                });
                
                cell.addEventListener('mouseenter', () => {
                    if (isMouseDown) {
                        handleCellInteraction(cell, grid);
                    }
                });
                
                cell.addEventListener('mouseup', () => {
                    isMouseDown = false;
                });
                
                gridElement.appendChild(cell);
            }
        }
        
        // Ensure square proportions are maintained
        const gridContainer = gridElement.parentElement;
        gridContainer.style.aspectRatio = '1 / 1';
        
        // Prevent dragging issues
        gridElement.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        gridElement.addEventListener('mouseleave', () => {
            isMouseDown = false;
        });
        
        updateGridDisplay(gridElement, grid);
    }
    
    // Function to initialize the config panel
    function initConfigPanel() {
        const collapseBtn = document.getElementById('collapse-config');
        const configHeader = document.querySelector('.config-header');
        
        // Set initial state to expanded
        configPanel.classList.add('expanded');
        
        // Toggle panel when toggle button is clicked
        collapseBtn.addEventListener('click', toggleConfigPanel);
        
        // Make header clickable too (for large screens)
        configHeader.addEventListener('click', toggleConfigPanel);
        
        function toggleConfigPanel() {
            configPanel.classList.toggle('expanded');
            
            // Highlight the settings icon when panel is expanded
            if (configPanel.classList.contains('expanded')) {
                collapseBtn.style.color = '#4CAF50';
            } else {
                collapseBtn.style.color = '#333';
            }
        }
        
        // Initialize dropdowns
        initDropdowns();
    }
    
    // Function to initialize dropdowns
    function initDropdowns() {
        // Grid size dropdown
        gridSizeSelect.value = gridSize;
        gridSizeSelect.addEventListener('change', () => {
            const selectedValue = gridSizeSelect.value;
            if (selectedValue === 'custom') {
                customGridModal.style.display = 'block';
            } else {
                resizeGrid(parseInt(selectedValue));
            }
        });
        
        // Speed dropdown
        speedSelect.value = animationSpeed.toString();
        speedSelect.addEventListener('change', () => {
            animationSpeed = parseInt(speedSelect.value);
        });
        
        // Mode dropdown
        modeSelect.value = isAutoMode ? 'auto' : 'step';
        modeSelect.addEventListener('change', () => {
            isAutoMode = (modeSelect.value === 'auto');
        });
    }
    
    // Function to handle cell interactions based on current tool
    function handleCellInteraction(cell, grid) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        switch (currentTool) {
            case 'start':
                grid.setStartNode(row, col);
                syncGrids(dijkstraGrid, astarGrid);
                break;
            case 'end':
                grid.setEndNode(row, col);
                syncGrids(dijkstraGrid, astarGrid);
                break;
            case 'wall':
                grid.toggleWall(row, col);
                syncGrids(dijkstraGrid, astarGrid);
                break;
            case 'weight':
                // Show weight modal
                showWeightModal(() => {
                    grid.setWeight(row, col, weightValue);
                    syncGrids(dijkstraGrid, astarGrid);
                });
                break;
            case 'erase':
                // Reset the cell
                const node = grid.getNode(row, col);
                if (!node.isStart && !node.isEnd) {
                    node.isWall = false;
                    node.weight = 1;
                }
                syncGrids(dijkstraGrid, astarGrid);
                break;
        }
        
        updateGridDisplay(dijkstraGridElement, dijkstraGrid);
        updateGridDisplay(astarGridElement, astarGrid);
    }
    
    // Function to sync both grids (keep them identical)
    function syncGrids(sourceGrid, targetGrid) {
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const sourceNode = sourceGrid.getNode(row, col);
                const targetNode = targetGrid.getNode(row, col);
                
                targetNode.isStart = sourceNode.isStart;
                targetNode.isEnd = sourceNode.isEnd;
                targetNode.isWall = sourceNode.isWall;
                targetNode.weight = sourceNode.weight;
                
                if (sourceNode.isStart) {
                    targetGrid.startNode = targetNode;
                }
                if (sourceNode.isEnd) {
                    targetGrid.endNode = targetNode;
                }
            }
        }
    }
    
    // Function to update the grid display
    function updateGridDisplay(gridElement, grid) {
        const cells = gridElement.querySelectorAll('.cell');
        
        cells.forEach((cell) => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const node = grid.getNode(row, col);
            
            // Reset all classes
            cell.className = 'cell';
            
            // Add appropriate classes based on node state
            if (node.isStart) {
                cell.classList.add('start');
            } else if (node.isEnd) {
                cell.classList.add('end');
            } else if (node.isWall) {
                cell.classList.add('wall');
            } else if (node.weight > 1) {
                cell.classList.add('weight');
                cell.setAttribute('data-weight', node.weight);
            }
            
            if (node.isVisited && !node.isStart && !node.isEnd) {
                cell.classList.add('visited');
            }
            
            // Display path if applicable
            if (node.isInPath && !node.isStart && !node.isEnd) {
                cell.classList.add('path');
            }
        });
    }
    
    // Function to initialize default start and end nodes
    function setStartAndEndNodes(dijkstraGrid, astarGrid) {
        // Set start node (top-left corner)
        dijkstraGrid.setStartNode(1, 1);
        astarGrid.setStartNode(1, 1);
        
        // Set end node (bottom-right corner)
        dijkstraGrid.setEndNode(gridSize - 2, gridSize - 2);
        astarGrid.setEndNode(gridSize - 2, gridSize - 2);
        
        updateGridDisplay(dijkstraGridElement, dijkstraGrid);
        updateGridDisplay(astarGridElement, astarGrid);
    }
    
    // Function to clear visualization (keep walls and weights)
    function clearVisualization() {
        // Reset all nodes (except walls and weights)
        dijkstraGrid.resetNodes();
        astarGrid.resetNodes();
        
        // Clear visited and path visualization
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('visited', 'path');
        });
        
        // Reset step controls
        document.getElementById('prev-step').disabled = true;
        document.getElementById('next-step').disabled = true;
        
        // Reset stats
        dijkstraVisitedElement.textContent = '0';
        dijkstraLengthElement.textContent = '0';
        astarVisitedElement.textContent = '0';
        astarLengthElement.textContent = '0';
        
        // Reset step-by-step visualization variables
        dijkstraAnimationHistory = [];
        astarAnimationHistory = [];
        currentStep = 0;
        maxSteps = 0;
    }
    
    // Function to clear the entire grid
    function clearGrid() {
        dijkstraGrid.clearBoard();
        astarGrid.clearBoard();
        
        // Reset start and end nodes
        setStartAndEndNodes(dijkstraGrid, astarGrid);
        
        clearVisualization();
        
        updateGridDisplay(dijkstraGridElement, dijkstraGrid);
        updateGridDisplay(astarGridElement, astarGrid);
    }
    
    // Function to visualize the algorithms
    function visualizeAlgorithms() {
        if (!dijkstraGrid.startNode || !dijkstraGrid.endNode) {
            alert('Please set start and end points');
            return;
        }
        
                clearVisualization();
        
        // Prepare nodes for pathfinding
        dijkstraGrid.resetNodes();
        astarGrid.resetNodes();
        
        // Run Dijkstra's algorithm
        const dijkstraResult = dijkstra(dijkstraGrid, dijkstraGrid.startNode, dijkstraGrid.endNode);
        
        // Run A* algorithm
        const astarResult = astar(astarGrid, astarGrid.startNode, astarGrid.endNode);
        
        // Update stats
        dijkstraVisitedElement.textContent = dijkstraResult.visitedNodes.length;
        dijkstraLengthElement.textContent = dijkstraResult.path.length > 0 ? dijkstraResult.path.length - 1 : 0;
        
        astarVisitedElement.textContent = astarResult.visitedNodes.length;
        astarLengthElement.textContent = astarResult.path.length > 0 ? astarResult.path.length - 1 : 0;
        
        if (isAutoMode) {
            // Animate the algorithms automatically
            animateAlgorithm(dijkstraGridElement, dijkstraGrid, dijkstraResult);
            animateAlgorithm(astarGridElement, astarGrid, astarResult);
        } else {
            // Prepare for step-by-step visualization
            prepareStepByStepVisualization(dijkstraResult, astarResult);
        }
    }
    
    // Function to animate the algorithm
    function animateAlgorithm(gridElement, grid, result) {
        const { visitedNodes, path } = result;
        
        // Animate visited nodes
        for (let i = 0; i <= visitedNodes.length; i++) {
            if (i === visitedNodes.length) {
                // Animate path after all nodes are visited
                setTimeout(() => {
                    animatePath(gridElement, grid, path);
                }, i * animationSpeed);
            } else {
                setTimeout(() => {
                    const node = visitedNodes[i];
                    const row = node.row;
                    const col = node.col;
                    const cellElement = gridElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                    
                    if (cellElement && !node.isStart && !node.isEnd) {
                        cellElement.classList.add('visited');
                    }
                }, i * animationSpeed);
            }
        }
    }
    
    // Function to animate the path
    function animatePath(gridElement, grid, path) {
        for (let i = 0; i < path.length; i++) {
            setTimeout(() => {
                const node = path[i];
                node.isInPath = true;
                const row = node.row;
                const col = node.col;
                const cellElement = gridElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                
                if (cellElement && !node.isStart && !node.isEnd) {
                    cellElement.classList.add('path');
                }
            }, i * animationSpeed * 2); // Path animation is slower
        }
    }
    
    // Function to prepare step-by-step visualization
    function prepareStepByStepVisualization(dijkstraResult, astarResult) {
        // Create animation history for step-by-step visualization
        dijkstraAnimationHistory = createAnimationHistory(dijkstraResult);
        astarAnimationHistory = createAnimationHistory(astarResult);
        
        // Determine the maximum number of steps
        maxSteps = Math.max(dijkstraAnimationHistory.length, astarAnimationHistory.length);
        
        // Enable the next step button
        document.getElementById('next-step').disabled = false;
    }
    
    // Function to create animation history for step-by-step visualization
    function createAnimationHistory(result) {
        const { visitedNodes, path } = result;
        const history = [];
        
        // Add each visited node as a step
        for (let i = 0; i < visitedNodes.length; i++) {
            history.push({
                type: 'visited',
                node: visitedNodes[i]
            });
        }
        
        // Add each path node as a step
        for (let i = 0; i < path.length; i++) {
            history.push({
                type: 'path',
                node: path[i]
            });
        }
        
        return history;
    }
    
    // Function to handle next step in step-by-step mode
    function nextStep() {
        if (currentStep < maxSteps) {
            // Increment the current step
            currentStep++;
            
            // Process Dijkstra's algorithm step
            if (currentStep <= dijkstraAnimationHistory.length) {
                const { type, node } = dijkstraAnimationHistory[currentStep - 1];
                const row = node.row;
                const col = node.col;
                const cellElement = dijkstraGridElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                
                if (cellElement && !node.isStart && !node.isEnd) {
                    if (type === 'visited') {
                        cellElement.classList.add('visited');
                        dijkstraVisitedElement.textContent = currentStep;
                    } else if (type === 'path') {
                        cellElement.classList.add('path');
                        dijkstraLengthElement.textContent = parseInt(dijkstraLengthElement.textContent) + 1;
                    }
                }
            }
            
            // Process A* algorithm step
            if (currentStep <= astarAnimationHistory.length) {
                const { type, node } = astarAnimationHistory[currentStep - 1];
                const row = node.row;
                const col = node.col;
                const cellElement = astarGridElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                
                if (cellElement && !node.isStart && !node.isEnd) {
                    if (type === 'visited') {
                        cellElement.classList.add('visited');
                        astarVisitedElement.textContent = currentStep;
                    } else if (type === 'path') {
                        cellElement.classList.add('path');
                        astarLengthElement.textContent = parseInt(astarLengthElement.textContent) + 1;
                    }
                }
            }
            
            // Enable the previous step button
            document.getElementById('prev-step').disabled = false;
            
            // Disable the next step button if we're at the last step
            if (currentStep === maxSteps) {
                document.getElementById('next-step').disabled = true;
            }
        }
    }
    
    // Function to handle previous step in step-by-step mode
    function prevStep() {
        if (currentStep > 0) {
            // Process Dijkstra's algorithm step
            if (currentStep <= dijkstraAnimationHistory.length) {
                const { type, node } = dijkstraAnimationHistory[currentStep - 1];
                const row = node.row;
                const col = node.col;
                const cellElement = dijkstraGridElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                
                if (cellElement && !node.isStart && !node.isEnd) {
                    if (type === 'visited') {
                        cellElement.classList.remove('visited');
                        dijkstraVisitedElement.textContent = currentStep - 1;
                    } else if (type === 'path') {
                        cellElement.classList.remove('path');
                        dijkstraLengthElement.textContent = parseInt(dijkstraLengthElement.textContent) - 1;
                    }
                }
            }
            
            // Process A* algorithm step
            if (currentStep <= astarAnimationHistory.length) {
                const { type, node } = astarAnimationHistory[currentStep - 1];
                const row = node.row;
                const col = node.col;
                const cellElement = astarGridElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                
                if (cellElement && !node.isStart && !node.isEnd) {
                    if (type === 'visited') {
                        cellElement.classList.remove('visited');
                        astarVisitedElement.textContent = currentStep - 1;
                    } else if (type === 'path') {
                        cellElement.classList.remove('path');
                        astarLengthElement.textContent = parseInt(astarLengthElement.textContent) - 1;
                    }
                }
            }
            
            // Decrement the current step
            currentStep--;
            
            // Enable the next step button
            document.getElementById('next-step').disabled = false;
            
            // Disable the previous step button if we're at the first step
            if (currentStep === 0) {
                document.getElementById('prev-step').disabled = true;
            }
        }
    }
    
    // Function to resize the grid
    function resizeGrid(newSize) {
        gridSize = newSize;
        
        // Resize both grids
        dijkstraGrid.resizeGrid(gridSize, gridSize);
        astarGrid.resizeGrid(gridSize, gridSize);
        
        // Recreate the DOM
        createGridDOM(dijkstraGridElement, dijkstraGrid);
        createGridDOM(astarGridElement, astarGrid);
        
        // Set default start and end nodes
        setStartAndEndNodes(dijkstraGrid, astarGrid);
    }
    
    // Function to handle custom grid size
    function handleCustomGridSize() {
        const customGridSizeInput = document.getElementById('custom-grid-size');
        const customGridSizeYInput = document.getElementById('custom-grid-size-y');
        
        const newSize = parseInt(customGridSizeInput.value);
        
        if (newSize >= 5 && newSize <= 50) {
            resizeGrid(newSize);
            customGridModal.style.display = 'none';
            
            // Update the dropdown to reflect the custom size
            const customOption = document.createElement('option');
            customOption.value = newSize;
            customOption.textContent = `${newSize}x${newSize} (Custom)`;
            
            // Remove old custom options
            Array.from(gridSizeSelect.options).forEach(option => {
                if (option.textContent.includes('Custom') && option.value !== 'custom') {
                    gridSizeSelect.removeChild(option);
                }
            });
            
            gridSizeSelect.insertBefore(customOption, gridSizeSelect.querySelector('option[value="custom"]'));
            gridSizeSelect.value = newSize;
            
        } else {
            alert('Please enter a valid grid size between 5 and 50.');
        }
    }
    
    // Function to show the weight modal
    function showWeightModal(callback) {
        weightModal.style.display = 'block';
        
        const confirmButton = document.getElementById('confirm-weight');
        const cancelButton = document.getElementById('cancel-weight');
        
        const confirmHandler = () => {
            const weightInput = document.getElementById('weight-input');
            weightValue = parseInt(weightInput.value);
            
            if (weightValue >= 2 && weightValue <= 10) {
                weightModal.style.display = 'none';
                callback();
            } else {
                alert('Please enter a valid weight between 2 and 10.');
            }
            
            confirmButton.removeEventListener('click', confirmHandler);
            cancelButton.removeEventListener('click', cancelHandler);
        };
        
        const cancelHandler = () => {
            weightModal.style.display = 'none';
            confirmButton.removeEventListener('click', confirmHandler);
            cancelButton.removeEventListener('click', cancelHandler);
        };
        
        confirmButton.addEventListener('click', confirmHandler);
        cancelButton.addEventListener('click', cancelHandler);
    }
    
    // Function to save the current grid to local storage
    function saveGrid() {
        saveModal.style.display = 'block';
        
        const confirmButton = document.getElementById('confirm-save');
        const cancelButton = document.getElementById('cancel-save');
        
        const confirmHandler = () => {
            const saveName = document.getElementById('save-name').value.trim();
            
            if (saveName) {
                // Get the grid data
                const gridData = {
                    size: gridSize,
                    nodes: []
                };
                
                for (let row = 0; row < gridSize; row++) {
                    for (let col = 0; col < gridSize; col++) {
                        const node = dijkstraGrid.getNode(row, col);
                        if (node.isStart || node.isEnd || node.isWall || node.weight > 1) {
                            gridData.nodes.push({
                                row,
                                col,
                                isStart: node.isStart,
                                isEnd: node.isEnd,
                                isWall: node.isWall,
                                weight: node.weight
                            });
                        }
                    }
                }
                
                // Save to local storage
                let savedGrids = JSON.parse(localStorage.getItem('pathfinder-grids') || '{}');
                savedGrids[saveName] = gridData;
                localStorage.setItem('pathfinder-grids', JSON.stringify(savedGrids));
                
                saveModal.style.display = 'none';
                alert(`Grid "${saveName}" saved successfully!`);
            } else {
                alert('Please enter a name for your grid.');
            }
            
            confirmButton.removeEventListener('click', confirmHandler);
            cancelButton.removeEventListener('click', cancelHandler);
        };
        
        const cancelHandler = () => {
            saveModal.style.display = 'none';
            confirmButton.removeEventListener('click', confirmHandler);
            cancelButton.removeEventListener('click', cancelHandler);
        };
        
        confirmButton.addEventListener('click', confirmHandler);
        cancelButton.addEventListener('click', cancelHandler);
    }
    
    // Function to load a grid from local storage
    function loadGrid() {
        const savedGridsList = document.getElementById('saved-grids-list');
        
        // Get saved grids from local storage
        const savedGrids = JSON.parse(localStorage.getItem('pathfinder-grids') || '{}');
        
        if (Object.keys(savedGrids).length === 0) {
            savedGridsList.innerHTML = '<p>No saved grids found</p>';
        } else {
            savedGridsList.innerHTML = '';
            
            for (const gridName in savedGrids) {
                const gridButton = document.createElement('button');
                gridButton.textContent = gridName;
                gridButton.classList.add('grid-button');
                
                gridButton.addEventListener('click', () => {
                    const gridData = savedGrids[gridName];
                    
                    // Resize grid if necessary
                    if (gridData.size !== gridSize) {
                        resizeGrid(gridData.size);
                        // Update dropdown to match
                        gridSizeSelect.value = gridData.size.toString();
                    } else {
                        clearGrid();
                    }
                    
                    // Load the nodes
                    for (const nodeData of gridData.nodes) {
                        const { row, col, isStart, isEnd, isWall, weight } = nodeData;
                        
                        if (isStart) {
                            dijkstraGrid.setStartNode(row, col);
                            astarGrid.setStartNode(row, col);
                        } else if (isEnd) {
                            dijkstraGrid.setEndNode(row, col);
                            astarGrid.setEndNode(row, col);
                        } else if (isWall) {
                            dijkstraGrid.toggleWall(row, col);
                            astarGrid.toggleWall(row, col);
                        } else if (weight > 1) {
                            dijkstraGrid.setWeight(row, col, weight);
                            astarGrid.setWeight(row, col, weight);
                        }
                    }
                    
                    updateGridDisplay(dijkstraGridElement, dijkstraGrid);
                    updateGridDisplay(astarGridElement, astarGrid);
                    
                    loadModal.style.display = 'none';
                });
                
                savedGridsList.appendChild(gridButton);
            }
        }
        
        loadModal.style.display = 'block';
        
        const cancelButton = document.getElementById('cancel-load');
        cancelButton.addEventListener('click', () => {
            loadModal.style.display = 'none';
        });
    }
    
    // Function to initialize buttons
    function initButtons() {
        // Drawing tool buttons
        document.getElementById('set-start').addEventListener('click', () => {
            document.querySelectorAll('.tool').forEach(btn => btn.classList.remove('active'));
            document.getElementById('set-start').classList.add('active');
            currentTool = 'start';
        });
        
        document.getElementById('set-end').addEventListener('click', () => {
            document.querySelectorAll('.tool').forEach(btn => btn.classList.remove('active'));
            document.getElementById('set-end').classList.add('active');
            currentTool = 'end';
        });
        
        document.getElementById('add-walls').addEventListener('click', () => {
            document.querySelectorAll('.tool').forEach(btn => btn.classList.remove('active'));
            document.getElementById('add-walls').classList.add('active');
            currentTool = 'wall';
        });
        
        document.getElementById('add-weights').addEventListener('click', () => {
            document.querySelectorAll('.tool').forEach(btn => btn.classList.remove('active'));
            document.getElementById('add-weights').classList.add('active');
            currentTool = 'weight';
        });
        
        document.getElementById('erase').addEventListener('click', () => {
            document.querySelectorAll('.tool').forEach(btn => btn.classList.remove('active'));
            document.getElementById('erase').classList.add('active');
            currentTool = 'erase';
        });
        
        // Action buttons
        document.getElementById('find-path').addEventListener('click', visualizeAlgorithms);
        document.getElementById('clear-grid').addEventListener('click', clearGrid);
        document.getElementById('save-grid').addEventListener('click', () => {
            // Show menu with save/load options
            const rect = document.getElementById('save-grid').getBoundingClientRect();
            
            // Show either save or load modal based on user preference
            const wantsToSave = confirm("Choose an action:\n- OK to Save grid\n- Cancel to Load grid");
            
            if (wantsToSave) {
                saveGrid();
            } else {
                loadGrid();
            }
        });
        document.getElementById('help').addEventListener('click', () => {
            helpModal.style.display = 'block';
        });
        
        // Randomizer buttons
        document.getElementById('random-maze').addEventListener('click', () => {
            clearVisualization();
            // Clear existing walls first before creating a new maze
            clearWalls(dijkstraGrid);
            generateRandomMaze(dijkstraGrid);
            syncGrids(dijkstraGrid, astarGrid);
            updateGridDisplay(dijkstraGridElement, dijkstraGrid);
            updateGridDisplay(astarGridElement, astarGrid);
        });
        
        document.getElementById('random-weights').addEventListener('click', () => {
            clearVisualization();
            // Clear existing weights first
            clearWeights(dijkstraGrid);
            generateRandomWeights(dijkstraGrid);
            syncGrids(dijkstraGrid, astarGrid);
            updateGridDisplay(dijkstraGridElement, dijkstraGrid);
            updateGridDisplay(astarGridElement, astarGrid);
        });
        
        document.getElementById('random-points').addEventListener('click', () => {
            clearVisualization();
            generateRandomStartEnd(dijkstraGrid);
            syncGrids(dijkstraGrid, astarGrid);
            updateGridDisplay(dijkstraGridElement, dijkstraGrid);
            updateGridDisplay(astarGridElement, astarGrid);
        });
        
        // Step controls (hidden but still functional)
        document.getElementById('next-step').addEventListener('click', nextStep);
        document.getElementById('prev-step').addEventListener('click', prevStep);
        
        // Custom grid modal
        document.getElementById('apply-custom-grid').addEventListener('click', handleCustomGridSize);
        document.getElementById('cancel-custom-grid').addEventListener('click', () => {
            customGridModal.style.display = 'none';
        });
        
        // Close buttons for modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                helpModal.style.display = 'none';
                weightModal.style.display = 'none';
                saveModal.style.display = 'none';
                loadModal.style.display = 'none';
                customGridModal.style.display = 'none';
            });
        });
    }
    
    // Function to clear all walls from grid
    function clearWalls(grid) {
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const node = grid.getNode(row, col);
                if (!node.isStart && !node.isEnd) {
                    node.isWall = false;
                }
            }
        }
    }
    
    // Function to clear all weights from grid
    function clearWeights(grid) {
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const node = grid.getNode(row, col);
                if (!node.isStart && !node.isEnd && !node.isWall) {
                    node.weight = 1;
                }
            }
        }
    }
    
    // Function to initialize keyboard shortcuts
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT') return;
            
            switch (e.key.toLowerCase()) {
                case 's':
                    document.getElementById('set-start').click();
                    break;
                case 'e':
                    document.getElementById('set-end').click();
                    break;
                case 'w':
                    document.getElementById('add-walls').click();
                    break;
                case 'd':
                    document.getElementById('erase').click();
                    break;
                case 'c':
                    document.getElementById('clear-grid').click();
                    break;
                case 'r':
                    document.getElementById('random-maze').click();
                    break;
                case ' ': // Space
                    e.preventDefault(); // Prevent page scrolling
                    document.getElementById('find-path').click();
                    break;
                case 'arrowright':
                    if (!isAutoMode && !document.getElementById('next-step').disabled) {
                        nextStep();
                    }
                    break;
                case 'arrowleft':
                    if (!isAutoMode && !document.getElementById('prev-step').disabled) {
                        prevStep();
                    }
                    break;
                case 'h':
                    document.getElementById('help').click();
                    break;
                case 'escape':
                    helpModal.style.display = 'none';
                    weightModal.style.display = 'none';
                    saveModal.style.display = 'none';
                    loadModal.style.display = 'none';
                    customGridModal.style.display = 'none';
                    break;
            }
        });
    }
}); 