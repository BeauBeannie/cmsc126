document.addEventListener('DOMContentLoaded', () => {
    // Global variables
    let gridSize = 10;
    let animationSpeed = 20; // ms between animations (lower = faster)
    let isAutoMode = true;
    let currentTool = 'wall'; // Default tool
    let isMouseDown = false;
    let weightValue = 5; // Default weight value
    
    // Store wall images for each cell
    const wallImageMap = new Map();
    
    // Create the two grids
    const dijkstraGrid = new Grid(gridSize, gridSize);
    const astarGrid = new Grid(gridSize, gridSize);
    
    // Step-by-step visualization variables
    let dijkstraAnimationHistory = [];
    let astarAnimationHistory = [];
    let currentStep = 0;
    let maxSteps = 0;
    
    // Asset paths for tiles and obstacles
    const tiles = [
        'assets/Tile1_16-export.png',
        'assets/Tile2_16-export.png',
        'assets/Tile3_16-export.png',
        'assets/Tile4_16-export.png',
    ];
    
    const obstacles = [
        'assets/Obstacle-export.png',
        'assets/Obstacle1-export.png',
        'assets/Obstacle2-export.png',
        'assets/Obstacle3-export.png'
    ];
    
    const spriteImg = 'assets/Sprite-export.png';
    const spriteImg1 = 'assets/Enchiridion.png';
    
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
    const introModal = document.getElementById('intro-modal');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const configPanel = document.getElementById('config-panel');
    const actionsBar = document.getElementById('actions-bar');
    
    // Settings elements
    const settingsButton = document.getElementById('settings-button');
    const closePanel = document.getElementById('close-panel');
    
    // Dropdown selects
    const gridSizeSelect = document.getElementById('grid-size-select');
    const speedSelect = document.getElementById('speed-select');
    const modeSelect = document.getElementById('mode-select');
    
    // The assets are already defined above
    // Initialize grids
    createGridDOM(dijkstraGridElement, dijkstraGrid);
    createGridDOM(astarGridElement, astarGrid);
    
    // Set default start and end nodes
    setStartAndEndNodes(dijkstraGrid, astarGrid);
    
    // Initialize buttons
    initButtons();
    
    // Add event listeners for keyboard shortcuts
    initKeyboardShortcuts();
    
    // Initialize settings panel
    initSettingsPanel();
    
    // Show intro modal on first visit
    showIntroOnFirstVisit();
    
    // Add window resize handler to maintain grid proportions
    window.addEventListener('resize', () => {
        // Ensure grid containers maintain perfect square ratio after resize
        document.querySelectorAll('.grid-container').forEach(container => {
            container.style.aspectRatio = '1 / 1';
        });
    });
    
    // Function to show the intro modal on first visit
    function showIntroOnFirstVisit() {
        // Check if this is the first visit
        if (!localStorage.getItem('lich-dungeon-intro-shown')) {
            // Show the intro modal
            introModal.style.display = 'block';
            
            // Set up the proceed button
            const proceedButton = document.getElementById('proceed-intro');
            const closeButton = introModal.querySelector('.close');
            
            proceedButton.addEventListener('click', () => {
                introModal.style.display = 'none';
                // Mark as shown in localStorage
                localStorage.setItem('lich-dungeon-intro-shown', 'true');
            });
            
            closeButton.addEventListener('click', () => {
                introModal.style.display = 'none';
                // Mark as shown in localStorage
                localStorage.setItem('lich-dungeon-intro-shown', 'true');
            });
        }
    }
    
    // Function to initialize settings panel
    function initSettingsPanel() {
        // Settings button click handler is now in initButtons() to avoid conflicts
        
        // Close settings panel
        closePanel.addEventListener('click', () => {
            configPanel.classList.remove('expanded');
            settingsButton.classList.remove('active');
        });
        
        // Handle tool buttons
        document.getElementById('set-start').addEventListener('click', () => {
            currentTool = 'start';
            setActiveToolButton('set-start');
        });
        
        document.getElementById('set-end').addEventListener('click', () => {
            currentTool = 'end';
            setActiveToolButton('set-end');
        });
        
        document.getElementById('add-walls').addEventListener('click', () => {
            currentTool = 'wall';
            setActiveToolButton('add-walls');
        });
        
        document.getElementById('add-weights').addEventListener('click', () => {
            document.querySelectorAll('.tool').forEach(btn => btn.classList.remove('active'));
            document.getElementById('add-weights').classList.add('active');
            
            // Show weight modal immediately when weight tool is selected
            showWeightModal(() => {
                currentTool = 'weight';
            });
        });
        
        document.getElementById('erase').addEventListener('click', () => {
            currentTool = 'erase';
            setActiveToolButton('erase');
        });
        
        // Initialize dropdowns
        initDropdowns();
    }
    
    // Function to set active tool button
    function setActiveToolButton(buttonId) {
        document.querySelectorAll('.tool').forEach(btn => btn.classList.remove('active'));
        document.getElementById(buttonId).classList.add('active');
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
                
                // Apply random tile background
                const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
                cell.style.backgroundImage = `url('${randomTile}')`;
                
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
        
        // Ensure parent container maintains square proportions
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
                // Toggle the wall state
                const isBecomingWall = !grid.getNode(row, col).isWall;
                grid.toggleWall(row, col);
                
                // If becoming a wall, assign a random obstacle image and store it
                if (isBecomingWall) {
                    const nodeKey = `${row}-${col}`;
                    const randomObstacle = obstacles[Math.floor(Math.random() * obstacles.length)];
                    wallImageMap.set(nodeKey, randomObstacle);
                }
                
                syncGrids(dijkstraGrid, astarGrid);
                break;
            case 'weight':
                // Directly set weight without showing modal again
                grid.setWeight(row, col, weightValue);
                syncGrids(dijkstraGrid, astarGrid);
                break;
            case 'erase':
                // Reset the cell
                const node = grid.getNode(row, col);
                if (!node.isStart && !node.isEnd) {
                    node.isWall = false;
                    node.weight = 1;
                    
                    // Remove the wall image mapping
                    const nodeKey = `${row}-${col}`;
                    wallImageMap.delete(nodeKey);
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
                
                // Copy all node properties
                targetNode.isStart = sourceNode.isStart;
                targetNode.isEnd = sourceNode.isEnd;
                targetNode.isWall = sourceNode.isWall;
                targetNode.weight = sourceNode.weight;
                
                // Update grid's start and end node references
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
            const nodeKey = `${row}-${col}`;
            
            // Reset all classes and additional styles
            cell.className = 'cell';
            
            // Reset the background image to just the tile
            if (cell.style.backgroundImage && cell.style.backgroundImage.includes('Tile')) {
                // Extract just the tile portion of the background
                const tileMatch = cell.style.backgroundImage.match(/url\(['"]([^'"]*Tile[^'"]*)['"]\)/);
                if (tileMatch && tileMatch[1]) {
                    // Set only the tile as background, removing any sprites
                    cell.style.backgroundImage = `url('${tileMatch[1]}')`;
                } else {
                    // Fallback to a random tile if extraction fails
                    const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
                    cell.style.backgroundImage = `url('${randomTile}')`;
                }
            } else {
                // If there's no tile background, set a random one
                const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
                cell.style.backgroundImage = `url('${randomTile}')`;
            }
            
            // Add appropriate classes based on node state
            if (node.isStart) {
                cell.classList.add('start');
                // Add the sprite overlay for start node
                cell.style.backgroundImage = `url('${spriteImg}'), ${cell.style.backgroundImage}`;
            } else if (node.isEnd) {
                cell.classList.add('end');
                // Add the sprite overlay for end node
                cell.style.backgroundImage = `url('${spriteImg1}'), ${cell.style.backgroundImage}`;
            } else if (node.isWall) {
                cell.classList.add('wall');
                // Use the stored obstacle image or assign a new one if not present
                const obstacleImage = wallImageMap.get(nodeKey) || 
                                     obstacles[Math.floor(Math.random() * obstacles.length)];
                
                // Store the image if it's not already stored
                if (!wallImageMap.has(nodeKey)) {
                    wallImageMap.set(nodeKey, obstacleImage);
                }
                
                cell.style.backgroundImage = `url('${obstacleImage}'), ${cell.style.backgroundImage}`;
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
        // Reset both grids
        dijkstraGrid.clearBoard();
        astarGrid.clearBoard();
        
        // Clear the wall image map
        wallImageMap.clear();
        
        // Reset start and end nodes
        setStartAndEndNodes(dijkstraGrid, astarGrid);
        
        // Clear visualization
        clearVisualization();
        
        // Make sure all cells are completely reset visually
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            // Remove all classes except 'cell'
            cell.className = 'cell';
            
            // Get cell coordinates
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // Reset the background to just the tile
            const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
            cell.style.backgroundImage = `url('${randomTile}')`;
        });
        
        // Fully update grid display for both grids
        updateGridDisplay(dijkstraGridElement, dijkstraGrid);
        updateGridDisplay(astarGridElement, astarGrid);
    }
    
    // Function to show notification
    function showNotification(message, isSuccess = true) {
        // Clear previous content
        notificationMessage.innerHTML = '';
        
        // Create status text element (Path Found/Path Not Found) in green
        const statusText = document.createElement('span');
        statusText.textContent = isSuccess ? 'Path Found' : 'Path Not Found';
        statusText.style.color = isSuccess ? '#3fd94c' : '#ff4d4d';
        statusText.style.fontWeight = 'bold';

        //Create line break
        const lineBreak = document.createElement('br');
        
        // Create message element in white
        const messageText = document.createElement('span');
        messageText.textContent = ' ' + message;
        messageText.style.color = 'white';
        
        // Append both elements to the notification message
        notificationMessage.appendChild(statusText);
        notificationMessage.appendChild(lineBreak);
        notificationMessage.appendChild(messageText);
        
        // Set notification class
        notification.className = 'notification ' + (isSuccess ? 'success' : 'error');
        notification.style.display = 'block';
        
        // Add click event for the close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.display = 'none';
        });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 6500);
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
        
        // Show notification based on path finding results
        if (dijkstraResult.path.length === 0 && astarResult.path.length === 0) {
            showNotification("FIND ME THE STUPID BOOK!", false);
        } else {
            showNotification("THANKS, NOW I CAN WISH TO CEASE ALL LIFE! SCREW THIS PITIFUL BODY!", true);
        }
        
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
        
        // Ensure grid containers maintain square aspect ratio
        const gridContainers = document.querySelectorAll('.grid-container');
        gridContainers.forEach(container => {
            container.style.aspectRatio = '1 / 1';
        });
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
            
            // Show weight modal immediately when weight tool is selected
            showWeightModal(() => {
                currentTool = 'weight';
            });
        });
        
        document.getElementById('erase').addEventListener('click', () => {
            document.querySelectorAll('.tool').forEach(btn => btn.classList.remove('active'));
            document.getElementById('erase').classList.add('active');
            currentTool = 'erase';
        });
        
        // Add settings button event listener
        document.getElementById('settings-button').addEventListener('click', () => {
            configPanel.classList.add('expanded');
            settingsButton.classList.add('active');
        });
        
        // Add close panel button event listener
        document.getElementById('close-panel').addEventListener('click', () => {
            configPanel.classList.remove('expanded');
            settingsButton.classList.remove('active');
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
            // Now shows the intro modal instead of help modal
            introModal.style.display = 'block';
        });
        
        // Intro modal button
        document.getElementById('proceed-intro').addEventListener('click', () => {
            introModal.style.display = 'none';
            // Mark as shown in localStorage
            localStorage.setItem('lich-dungeon-intro-shown', 'true');
        });
        
        // Randomizer buttons
        document.getElementById('random-maze').addEventListener('click', () => {
            clearVisualization();
            
            // Clear existing walls and wall images first
            clearWalls(dijkstraGrid);
            
            // Generate a new maze
            generateRandomMaze(dijkstraGrid);
            
            // Assign random obstacle images to the new walls
            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    const node = dijkstraGrid.getNode(row, col);
                    if (node.isWall) {
                        const nodeKey = `${row}-${col}`;
                        const randomObstacle = obstacles[Math.floor(Math.random() * obstacles.length)];
                        wallImageMap.set(nodeKey, randomObstacle);
                    }
                }
            }
            
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
            
            // Generate random start and end points
            generateRandomStartEnd(dijkstraGrid);
            
            // Clear wallImageMap entries for start and end positions if they were walls
            if (dijkstraGrid.startNode) {
                const startKey = `${dijkstraGrid.startNode.row}-${dijkstraGrid.startNode.col}`;
                wallImageMap.delete(startKey);
            }
            
            if (dijkstraGrid.endNode) {
                const endKey = `${dijkstraGrid.endNode.row}-${dijkstraGrid.endNode.col}`;
                wallImageMap.delete(endKey);
            }
            
            // Sync the grids and update display
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
                    
                    // Also remove from wall image map
                    const nodeKey = `${row}-${col}`;
                    wallImageMap.delete(nodeKey);
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
    
    // Override the Grid's setStartNode method
    window.Grid.prototype.setStartNode = function(row, col) {
        // Clear the old start node
        if (this.startNode) {
            this.startNode.isStart = false;
        }
        
        // Set the new start node
        const node = this.getNode(row, col);
        
        // Remove wall or weight if present
        node.isWall = false;
        node.weight = 1;
        
        // Set as start node
        node.isStart = true;
        this.startNode = node;
    };
    
    // Override the Grid's setEndNode method
    window.Grid.prototype.setEndNode = function(row, col) {
        // Clear the old end node
        if (this.endNode) {
            this.endNode.isEnd = false;
        }
        
        // Set the new end node
        const node = this.getNode(row, col);
        
        // Remove wall or weight if present
        node.isWall = false;
        node.weight = 1;
        
        // Set as end node
        node.isEnd = true;
        this.endNode = node;
    };
}); 