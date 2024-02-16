// Grid size constants
const gridSize = 10;
const bounds = 400;
const cellSize = bounds/gridSize;

// Arrays for lists of ship positions
let p1Ships = [];
let p2Ships = [];

// References to static elements on the page
const grid1 = document.getElementById('grid-1');
const grid2 = document.getElementById('grid-2');
const ghostShip = document.getElementById('ghost');
const statusBar = document.getElementById('status');
const turnCounter = document.getElementById('turn-counter');
const p1Health = document.getElementById('p1-health');
const p2Health = document.getElementById('p2-health');
const p1Misses = document.getElementById('p1-misses');
const p2Misses = document.getElementById('p2-misses');
const p1Hits = document.getElementById('p1-hits');
const p2Hits = document.getElementById('p2-hits');

// Variable reference to a ship being moved
let dragShip;

// Flags
let mouseHeld = false;
let rotated = false;
let dragEnabled = true;
let playerCanShoot = false;

// Variable for storing a ship's previous position during a rotation operation
let tempPrevPos;

// Timer for temporary status messages
let statusTimeout;
// Current status text
let statusText = "";

// Turn counter
let turn = 0;

let sizes = [];

// Sound effects
const boom = new Audio("./assets/audio/boom.mp3");
const splash = new Audio("./assets/audio/splash.mp3");
const err = new Audio("./assets/audio/err.mp3");
const snap = new Audio("./assets/audio/snap.mp3");
const spin = new Audio("./assets/audio/spin.mp3");
const victory = new Audio("./assets/audio/victory.mp3");
const loss = new Audio("./assets/audio/loss.mp3");
const begin = new Audio("./assets/audio/begin.mp3");

// Function to initialize the game
function init() {
    // Match the UI theme to the user's system (light/dark)
    setTheme();
    // Create the grids on which the game is played
    generateGrid(grid1);
    generateGrid(grid2);
    // Spawn in the ships on both grids
    getShipConfig();
    // Reset the turn counter
    turn = 0;
    clearCounters();

    // Prompt the player to begin moving their ships into position
    setStatus("Position your ships! Press 'R' while moving a ship to rotate.");
    // Enable ship movement
    dragEnabled = true;
    // Reset temporary ship position
    tempPrevPos = [];
    // Show the "Ready" button and ship menu, hide the "Reset" button
    document.querySelectorAll('.ship-count').forEach(input => input.disabled = false);
    document.getElementById('randomize-button').style.display = 'block';
    document.getElementById('ready-button').style.display = 'block';
    document.getElementById('reset-button').style.display = 'none';
}

// Function to start the game.
function runGame() {
    // Failsafe ship overlap check
    if (failsafe()) {return;};

    // Play sound
    begin.currentTime = 0;
    begin.play();

    // Update the on-screen counters
    incrementTurnCounter();
    updateHitMissCount();

    // Hide the 'Ready' button and ship menu
    document.getElementById('ready-button').style.display = 'none';
    document.querySelectorAll('.ship-count').forEach(input => input.disabled = true);
    document.getElementById('randomize-button').style.display = 'none';
    // Allow the user to click cells on the CPU's grid
    grid2.classList.add("selectable");
    playerCanShoot = true;   
    // Disallow the user from moving their ships
    dragEnabled = false;
    grid1.querySelectorAll('.ship').forEach(ship => {ship.classList.remove('draggable')});
    // Prompt the user to begin playing
    setStatus("Choose a target on the computers grid..."); 
}

/* Function to end the game
    victor: A string, either 'p1' or 'p2', representing who won */
function gameOver(victor){
    // Pick which message to display, depending on the winner
    const msg = victor == 'p1' ? "Player wins!" : "Computer wins!";
    const sfx = victor == 'p1' ? victory : loss;
    // Display the message
    setStatus(msg);
    // Play the win/loss sound effect
    sfx.currentTime = 0;
    sfx.play();
    // Add the 'revealed' class to the CPU's ships, so that the player can see where they were.
    grid2.querySelectorAll('.ship').forEach(ship => {ship.classList.add('revealed')});
    // Remove the player's ability to shoot.
    grid2.classList.remove("selectable");
    playerCanShoot = false;
    // Show the 'Reset' button
    document.getElementById('reset-button').style.display = 'block';
}

// Function to generate the grids for the two players.
function generateGrid(target) {
    // Clear the grid of any existing cells.
    target.innerHTML = "";
    // Get the "owner" attribute of the grid: either p1 or p2.
    const owner = target.getAttribute('owner');
    // Iterate over the grid...
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {

            // Create a cell for this position.
            const cell = document.createElement('div');
            cell.style.gridColumnStart = x+1;
            cell.style.gridRowStart = y+1;
            cell.classList.add('cell');
            // Add attributes to the cell for easy identification
            cell.id = `${owner}-[${x},${y}]`;
            cell.title = `[${x+1}, ${y+1}]`;

            // If this cell is on the CPU's grid, add the click event listener.
            if (target == grid2) {
                cell.addEventListener('click', cellClicked);
            }

            // Add the cell to the grid.
            target.appendChild(cell);
        }
    }
}

// Function to spawn the player's ships in randomized positions.
function spawnShips(target) {
    // Hardcoded ship dimensions.
    // const sizes = [[1,1], [2,1], [2,1], [2,1], [3,1], [3,1], [4,1], [4,1], [5,1]];

    // const sizes = [ [5,1], [4,1], [3,1], [3,1], [2,1] ];

    // Get the 'owner' of the grid we're placing ships on: either p1 or p2.
    const owner = target.getAttribute('owner');

    // Ship indexer.
    let i = 0;

    let overflowWarn = false;

    // Delete any existing ships.
    removeExistingShips(target);

    sizes.forEach(size => {
        // Initial x,y pos of ship
        let x, y = 0;

        // Get individual width and length values
        let [w, l] = size;

        // 50/50 chance to place ship vertically instead of horizontally.
        // Achieved by swapping the width and length values.
        let orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
        if (orientation == 'vertical') { [l,w] = size };

        // Grab the list of the player's other ships currently on the board
        const otherShips = owner == 'p1' ? p1Ships : p2Ships;
        
        // Continually generate a random set of coordinates to place this ship at
        // until a position is found that doesn't overlap other ships.
        let attempts = 0;
        do {
            x = rng(gridSize - w);
            y = rng(gridSize - l);
            attempts++;
        } while (checkOverlapping(otherShips, [x, y, x+w, y+l]) && attempts < 10000);

        if (attempts >= 10000) {
            overflowWarn = true;
        }
        // Create a ship element
        const ship = document.createElement('div');
        // Give it a class of 'p1' or 'p2', we style ships differently depending on who they belong to.
        ship.classList.add("ship", owner);
        // Set it's visual position on the grid
        ship.style.gridColumnStart = x;
        ship.style.gridColumnEnd = x + w;
        ship.style.gridRowStart = y;
        ship.style.gridRowEnd = y + l;
        // Set it's index value
        ship.setAttribute('index', i);
        // Add it to the grid.
        target.appendChild(ship);

        // Add this ship's position to the list.
        otherShips.push([x, y, x+w, y+l]);

        // Make the ship draggable if it belongs to the player.
        if (owner == 'p1') {
            ship.addEventListener('mousedown', dragStart);
            ship.classList.add('draggable');
        }
        
        // Increment counter
        i++;
    });

    if (overflowWarn) {
        err.currentTime = 0;
        err.play();
        setTempStatus("WARNING: The board is overfilled. The CPU may have overlapping ships.");
    }
}

/* Function to check if a given rectangle overlaps a ship in a given list of ships.
Used for checking ship positions, as well as hit-detection.

    ships: A list of ships, defined as a list of 4 ints [x1, y1, x2, y2]
    pos: A list of ints, forming the corners of a rectangle
    ignore: Optional. An int, the index number of a ship to ignore in the 'ships' list. Typically used when moving ships, as we don't care if a ship's new position overlaps it's current one.
*/
function checkOverlapping(ships, pos, ignore) {
    // Flag
    let overlapping = false;
    // Counter
    let i = 0;

    // Fetch individual values of the ship's corners
    const [x1, y1, x2, y2] = pos;

    // Iterate over each ship in the list
    ships.forEach(ship => {
        // Grab the individual x and y values
        const [shipX1, shipY1, shipX2, shipY2] = ship;
        // Check if the given position overlaps with the ship
        if ((x1 < shipX2 && x2 > shipX1) && (y1 < shipY2 && y2 > shipY1)) {
            // Check if we're supposed to ignore this ship
            if (i != ignore) {
                overlapping = true;
            }
        }
        // Increment counter
        i++;
    });

    // Return the value of the overlapping flag
    return overlapping;
}

// Function to act as a failsafe check when the game starts.
// It runs a ship overlap check, and highlights any problematic placements.
// Returns true/false, depending on whether the ship placement is valid.
// In theory, it's impossible for the user to place ships in an invalid position, but it doesn't hurt to check.
function failsafe() {
    // Remove any existing warning markings
    grid1.querySelectorAll('.warn').forEach(ship => {ship.classList.remove('warn')});

    // Initialize vars
    let i = 0;
    let playerPlacementInvalid = false;

    if (p1Ships.length <= 0) {
        setTempStatus('You must have ships on the board!');
        // Play sound
        err.currentTime = 0;
        err.play();
        return true;
    }

    // Iterate over each of the players ships
    p1Ships.forEach(ship => {
        // Get individual x/y values.
        const [x1, y1, x2, y2] = ship;
        // Check if it overlaps any other ships
        if (checkOverlapping(p1Ships, [x1, y1, x2, y2], i)){
            playerPlacementInvalid = true;

            // Get a reference to the overlapping ship
            const badShip = grid1.getElementsByClassName('ship')[i];
            // Add the 'warn' class to the ship: this makes it red, showing the user where the problem is.
            badShip.classList.add('warn');
        }
        i++;
    });
    // If there are any invalid placements, flash a message to the user and return the appropriate true/false value
    if (playerPlacementInvalid) {
        setTempStatus('You have overlapping ships! Please move them.');
        // Play sound
        err.currentTime = 0;
        err.play();
    }

    return playerPlacementInvalid;
}

// Function that runs whenever the player clicks on a cell
function cellClicked(e) {
    // Do nothing if the game has not yet started.
    if (playerCanShoot) {
        const cell = e.target;
        // Check the classes of the clicked cell: if it only has the class "cell" it has not yet been shot.
        if (cell.className == "cell") {
            // Disable player interaction
            playerCanShoot = false;
            // Obtain the coords of the cell.
            const [x, y] = [parseInt(cell.style.gridColumnStart), parseInt(cell.style.gridRowStart)];
            // Check if the cell's coordinates overlap any of p2's ships
            if (checkOverlapping(p2Ships, [x, y, x+1, y+1])) {
                // Display message indicating success
                setTempStatus(`BANG! Hit at [${x}, ${y}]`);
                // Mark cell as hit
                cell.classList.add('bang');
                // Play sound
                boom.currentTime = 0;
                boom.play();
                // Win condition check
                if (countDeadShips('p2', p2Ships) == p2Ships.length) {
                    gameOver('p1');
                    return;
                }
            } else {
                // Display message indicating miss
                setTempStatus(`Miss at [${x}, ${y}]`);
                // Mark cell as miss
                cell.classList.add('miss');
                // Play sound
                splash.currentTime = 0;
                splash.play();
            }

            updateHitMissCount();

            // The player has taken their turn, so now it's the computer's turn.
            setTimeout(cpuTurn, 1500);
        } else {
            // This cell has previously been shot.
            setTempStatus("Cannot shoot there!");
        }
    }
}

// Function to determine where the CPU will shoot.
function cpuShoot() {
    // Initial check: if there are no open cells or alive ships, exit.
    if (    
        grid1.querySelectorAll('.cell:not(.bang):not(.miss)').length == 0 || 
        grid1.querySelectorAll('.ship:not(.dead)').length == 0
        ) {
        return;
    }

    // Get a list of any cells marked as a 'hit', but not hits belonging to a ship that's already dead.
    let hits = Array.from(grid1.querySelectorAll('.cell.bang:not(.dead)'));
    // Randomize the list
    hits.sort(() => Math.random() - 0.5);

    // Allocate variables
    let x, y, targetedCell;
    let foundSmartTarget = false;

    // Iterate over each cell marked as a 'hit' (possibly none)
    // We are going to look for any adjacent cells that have not been shot, and attempt to shoot there instead of firing blindly: a 'smart target'
    hits.forEach((searchSpot) => {
        // If a target is already selected, don't bother calculating anything and skip
        if (foundSmartTarget) { return; }

        // Get the x and y position of the selected cell.
        const searchX = parseInt(searchSpot.style.gridColumnStart);
        const searchY = parseInt(searchSpot.style.gridRowStart);

        // Get the positions of the 4 adjacent cells on all sides
        let potentialTargets = [
            [searchX+1, searchY],
            [searchX, searchY+1],
            [searchX-1, searchY],
            [searchX, searchY-1]
        ];

        // Randomize this list: we don't want to always prioritize one direction over the others
        potentialTargets.sort(() => Math.random() - 0.5);

        // Iterate over each potential target.
        for (let i = 0; i < potentialTargets.length; i++) {
            // Get individual x and y values
            const [targetX, targetY] = potentialTargets[i];

            // Ensure target is within the bounds of the grid
            if (targetX < 1 || targetX >= 11 || targetY < 1 || targetY >= 11) {
                // Skip if out-of-bounds
                continue;
            } else {
                // Get the element representing the targeted cell
                targetedCell = document.getElementById(`p1-[${targetX-1},${targetY-1}]`);
                // Classes are added to a cell to mark it as a hit/miss
                // If the class name is just 'cell', it has not been shot yet.
                if (targetedCell.className == 'cell') {
                    // Set the coords of the cell as our target
                    x = targetX;
                    y = targetY;
                    // Skip further iterations
                    foundSmartTarget = true;
                    break;
                }
            }
        }
    });
    
    // If there are no available 'smart targets' (open cells next to hits), shoot randomly.
    if (!foundSmartTarget) {
        // Continually generate a set of random coords, until we get a set that corresponds to an empty cell
        do {
            x = rng(gridSize-1);
            y = rng(gridSize-1);
            targetedCell = document.getElementById(`p1-[${x-1},${y-1}]`);
        } while (targetedCell.className != "cell");
    }
    

    // Check if the cell's coordinates overlap any of p1's ships
    if (checkOverlapping(p1Ships, [x, y, x+1, y+1])) {
        // Display message indicating success
        setTempStatus(`BANG! Computer hit at [${x}, ${y}]`);
        // Mark cell as hit
        targetedCell.classList.add('bang');
        // Play sound
        boom.currentTime = 0;
        boom.play();
        // Win condition check
        if (countDeadShips('p1', p1Ships) == p1Ships.length) {
            gameOver('p2');
            return;
        }
    } else {
        // Display message indicating miss
        setTempStatus(`Computer miss at [${x}, ${y}]`);
        // Mark cell as miss
        targetedCell.classList.add('miss');
        // Play sound
        splash.currentTime = 0;
        splash.play();
    }

    // Update the on-screen counters
    updateHitMissCount();
    incrementTurnCounter();

    // Return control to the player.
    playerCanShoot = true;
    grid2.classList.add("selectable");
}

// Function to begin the CPU's turn.
function cpuTurn() {
    // Remove the 'selectable' class from the CPU's grid, so the player can't shoot when it's not their turn.
    grid2.classList.remove("selectable");
    // Inform the user that the computer is "thinking"
    setTempStatus("Awaiting computer's move...");
    // Delay the cpu's move by 2 seconds, so that it feels more interactive to the user.
    setTimeout(cpuShoot, 2000);
}

// Function called when a ship begins to be dragged.
function dragStart(e) {
    // Ensure the user is using the left mouse button, and that they are allowed to drag ships right now.
    e.preventDefault();
    if (e.which == 1 && dragEnabled) {
        // Assign the targeted ship to the global dragShip variable.
        dragShip = e.target;

        // Give it the 'dragging' class, this visually hides it while the drag is in effect.
        dragShip.classList.add('dragging');
        // Mark the mouse as currently held down.
        mouseHeld = true;
        // Enable the ghost ship to mimic the ship being moved.
        setGhostShip(dragShip);
        // Call the dragHandler function to begin drag operations.
        dragHandler(e);
    }
}

// Function called whenever the mouse is moved. Used while a ship is being dragged around, and simulates a snap-to-grid effect while moving the ship
function dragHandler(e) {
    // Ensure that the mouse is held.
    e.preventDefault();
    if (mouseHeld) {
        // Get the ghost ship's dimensions
        const w = parseInt(ghostShip.style.width);
        const l = parseInt(ghostShip.style.height);

        const leftBound = parseInt(grid1.offsetLeft);
        const topBound = parseInt(grid1.offsetTop);
        const rightBound = leftBound + bounds - w;
        const bottomBound = topBound + bounds - l;

        // Use the grid's offset from the top left, as we're aligning the ship based on the cell size. 
        let offsetX = (leftBound % cellSize);
        let offsetY = (topBound % cellSize);

        // Calculate the preliminary x/y coords for the ship, based on the mouse position. We want the center of the ship on the cursor.
        let x = e.pageX - (w / 2);
        let y = e.pageY - (l / 2);

        // Cap the position of the ghost ship to within the bounds of the grid
        if (x < leftBound) {x = leftBound;}
        if (y < topBound) {y = topBound;}
        if (x > rightBound) {x = rightBound;}
        if (y > bottomBound) {y = bottomBound;}
        
        // Fun math: capping the x and y to the nearest multiple of the cellSize, adjusting for the grid's offset
        x = (Math.round((x - offsetX) / cellSize) * cellSize) + offsetX;
        y = (Math.round((y - offsetY) / cellSize) * cellSize) + offsetY;
        
        // Set the ghost ship's position
        ghostShip.style.left = `${x}px`;
        ghostShip.style.top = `${y}px`; 
    }
}

// Function called when a drag operation ends
function drop(e) {
    // Ensure the mouse was held
    if (e.which == 1 && mouseHeld) {
        e.preventDefault();
        // Get the index of the ship being moved.
        const shipIndex = dragShip.getAttribute('index');
        // Get the list of other ships owned by this player.
        const otherShips = dragShip.classList.contains('p1') ? p1Ships : p2Ships;
        // Get the coords of where the mouse was released.
        let releaseX = e.pageX;
        let releaseY = e.pageY;

        // Get the bounds of the grid
        const leftBound = parseInt(grid1.offsetLeft) + 2;
        const topBound = parseInt(grid1.offsetTop) + 2;
        const rightBound = leftBound + bounds - 4;
        const bottomBound = topBound + bounds - 4;

        // Cap the position of the mouse to within the bounds of the grid
        if (releaseX < leftBound) {releaseX = leftBound;}
        if (releaseY < topBound) {releaseY = topBound;}
        if (releaseX > rightBound) {releaseX = rightBound;}
        if (releaseY > bottomBound) {releaseY = bottomBound;}

        const targetedElems = document.elementsFromPoint(releaseX, releaseY);

        // Find the cell under the mouse.
        const targetedCell = targetedElems.filter(elem => elem.classList.contains('cell'))[0];

        // If there is a cell under the mouse, proceed.
        // Ensure the cell belongs to grid1, otherwise the player can cheat and find where p2's ships are via the "overlapping ship" warning
        if (targetedCell && targetedCell.parentElement == grid1) {
            // Get the grid x,y coords of this cell.
            const targetedCellX = parseInt(targetedCell.style.gridColumnStart);
            const targetedCellY = parseInt(targetedCell.style.gridRowStart);
            
            // Get the coords of the ship
            const shipX1 = parseInt(dragShip.style.gridColumnStart);
            const shipX2 = parseInt(dragShip.style.gridColumnEnd);
            const shipY1 = parseInt(dragShip.style.gridRowStart);
            const shipY2 = parseInt(dragShip.style.gridRowEnd);
            
            // Get the width and height of the ship
            const shipWidth = shipX2 - shipX1;
            const shipHeight = shipY2 - shipY1;

            // Calculate the new position of the ship
            let newX1 = Math.ceil(targetedCellX - (shipWidth/2));
            let newX2 = Math.ceil(targetedCellX + (shipWidth/2));
            let newY1 = Math.ceil(targetedCellY - (shipHeight/2));
            let newY2 = Math.ceil(targetedCellY + (shipHeight/2));

            // With ships of even-numbered length (2, 4), they may end up 1 cell over from where they should be. Manual adjustment here. 
            if (shipWidth % 2 === 0 && releaseX > targetedCell.offsetLeft + 20) {
                newX1++;
                newX2++;
            }
            if (shipHeight % 2 === 0 && releaseY > targetedCell.offsetTop + 20) {
                newY1++;
                newY2++;
            }

            // Nudge the ship back in bounds if it sticks out a bit
            if (newX1 < 1) {newX1 = 1; newX2 = newX1+shipWidth}
            if (newY1 < 1) {newY1 = 1; newY2 = newY1+shipHeight}
            if (newX2 > 11) {newX2 = 11; newX1 = newX2-shipWidth}
            if (newY2 > 11) {newY2 = 11; newY1 = newY2-shipHeight}

            // Check if the new position is valid...
            if (!checkOverlapping(otherShips, [newX1, newY1, newX2, newY2], shipIndex)) {
                // ...and set the ship in the new position
                setShipPosition(dragShip, newX1, newY1, newX2, newY2, shipIndex, otherShips);
                // Play sound
                snap.currentTime = 0;
                snap.play();
            } else {
                // If the new spot is invalid, flash a message to the user.
                setTempStatus("Invalid placement: The ship overlaps another.");
                // Play sound
                err.currentTime = 0;
                err.play();
                // If the ship was rotated during this drag operation, we need to put it back to how it was before.
                if (rotated) {
                    // Restore the ship to it's pre-rotation position
                    setShipPosition(dragShip, tempPrevPos[0], tempPrevPos[1], tempPrevPos[2], tempPrevPos[3], shipIndex, otherShips);
                }
            }
        } else {
            // There is no cell under the mouse. The user attempted to place the ship out-of-bounds.
            setTempStatus("Invalid placement: The ship is out-of-bounds.");
            // Play sound
            err.currentTime = 0;
            err.play();
            // If the ship was rotated during this drag operation, we need to put it back to how it was before.
            if(rotated) {
                // Restore the ship to it's pre-rotation position
                setShipPosition(dragShip, tempPrevPos[0], tempPrevPos[1], tempPrevPos[2], tempPrevPos[3], shipIndex, otherShips);
            }
        }
        
        // Remove the ghost ship.
        unsetGhostShip();

        // Remove the 'dragging' class from the ship, making it visible once again.
        dragShip.classList.remove('dragging');

        // Unset the mouseHeld and rotation flags
        mouseHeld = false;
        rotated = false;

        // Remove the reference to the ship we just moved
        dragShip = null;
    }
}

// Function to use a fake ship to mimic the one the player is attempting to move.
// The 'ghost ship' is not grid-allinged, allowing us to make it follow the user's mouse easier, while keeping the real ship in it's correct position until we're sure the user is putting it in a valid place.
function setGhostShip(mimic){
    // Copy the classes of the ship to mimic.
    ghostShip.classList = mimic.classList;
    // Calculate the width and height in pixels of the ship to mimic.
    width = cellSize * (mimic.style.gridColumnEnd - mimic.style.gridColumnStart);
    height = cellSize * (mimic.style.gridRowEnd - mimic.style.gridRowStart);
    ghostShip.style.width = `${width}px`;
    ghostShip.style.height = `${height}px`;

    // Make the ship ghost ship visible
    ghostShip.style.visibility = "visible";
}

// Function to hide the ghost ship once a ship has finished being moved.
function unsetGhostShip() {
    // Clear the ghost ship's class list
    ghostShip.classList = [];
    // Hide the ship
    ghostShip.style.visibility = "hidden";
    // Reset it's size and position.
    ghostShip.style.width = `0px`;
    ghostShip.style.height = `0px`;
    ghostShip.style.left = `0px`;
    ghostShip.style.top = `0px`; 
}

/* Function to rotate a ship 90 degrees
    ship: A reference to a ship element on the grid
*/
function rotateShip(ship) {
    // Get the ship's x/y coords
    const shipX1 = parseInt(ship.style.gridColumnStart);
    const shipX2 = parseInt(ship.style.gridColumnEnd);
    const shipY1 = parseInt(ship.style.gridRowStart);
    const shipY2 = parseInt(ship.style.gridRowEnd);

    // Store it's current position, in case the rotation results in an invalid position and we need to put the ship back.
    tempPrevPos = [shipX1, shipY1, shipX2, shipY2];

    // Calculate the ship's center
    const centerX = (shipX1 + shipX2) / 2;
    const centerY = (shipY1 + shipY2) / 2;

    // Quick maths to turn the ship 90 degrees
    let newX1 = Math.round(centerX - (shipY2 - centerY));
    let newX2 = Math.round(centerX - (shipY1 - centerY));
    let newY1 = Math.round(centerY + (shipX1 - centerX));
    let newY2 = Math.round(centerY + (shipX2 - centerX));

    // Even-length ships can be positioned 1 cell off in the x/y direction.
    // Manually move it back. 
    // I love rounding.
    if ((shipX2 - shipX1) % 2 === 0) {
        newX1--;
        newX2--;
        newY1--;
        newY2--;
    }

    // If the rotated ship sticks out of the grid a bit, nudge it back into place
    while (newX1 < 1) {newX1++; newX2++;}
    while (newY1 < 1) {newY1++; newY2++;}
    while (newX2 > 11) {newX1--; newX2--;}
    while (newY2 > 11) {newY1--; newY2--;}
    
    // Get the ship's index number
    const shipIndex = ship.getAttribute('index');
    // Get the list of other ships owned by this player
    const otherShips = ship.classList.contains('p1') ? p1Ships : p2Ships;

    // Play sound
    spin.currentTime = 0;
    spin.play();

    // Attempt to place the ship in the rotated position
    setShipPosition(ship, newX1, newY1, newX2, newY2, shipIndex, otherShips);
}

// Function to update a position of a ship on the grid
function setShipPosition(shipElem, x1, y1, x2, y2, index, ships) {
    // Set it's visual position
    shipElem.style.gridColumnStart = x1;
    shipElem.style.gridColumnEnd = x2;
    shipElem.style.gridRowStart = y1;
    shipElem.style.gridRowEnd = y2;

    // Update the position in memory
    ships[index] = [x1, y1, x2, y2];
}

/* Function to count how many ships a player has remaining.
    prefix: A string, either "p1" or "p2"
    ships: An array, representing the ships belonging to the player. */
function countDeadShips(prefix, ships) {
    // Initialize some counters
    let index = 0;
    let destroyedShips = 0;
    // Get references to the grid and healthbar of whichever player we're looking at
    const grid = prefix == 'p1' ? grid1 : grid2;
    const health = prefix == 'p1' ? p1Health : p2Health;

    // Iterate over each ship belonging to the player
    ships.forEach(ship => {
        // Get individual x/y values of the ship's position
        const [x1, y1, x2, y2] = ship;
        // Calculate the number of cells this ship occupies.
        let totalCells = (x2-x1) * (y2-y1);
        // Counter for the number of cells within the ship that have been hit
        let hitCells = 0;
        // List for references to each cell occupied by the ship
        let cells = [];

        // Double for loop to iterate over the cells covered by the ship
        for (let i = x1; i < x2; i++) {
            for (let j = y1; j < y2; j++) {

                // Get a reference to the cell
                const occupiedCell = document.getElementById(`${prefix}-[${i-1},${j-1}]`);

                // Check if this cell has been struck
                if (occupiedCell.classList.contains("bang")) {
                    // Increment counter
                    hitCells++;
                    // Add this cell to the list
                    cells.push(occupiedCell);
                }
            }
        }

        // If the number of hit cells matches the total number of cells covered by the ship, the ship has been sunk
        if (totalCells == hitCells) {
            // Get a reference to the ship
            const target = grid.getElementsByClassName('ship')[index];
            // Add the 'dead' class to it
            target.classList.add('dead');
            // Increment the dead ships counter.
            destroyedShips++;
            // Mark all the cells covered by the ship as dead, so we can differentiate between them and hits belonging to unsunk ships
            cells.forEach(cell => {cell.classList.add('dead')});
        }
        index++;
    });

    // Update the player's health to reflect the number of ships left
    health.innerText = `${ships.length - destroyedShips} ships remaining.`;

    // Return the number of destroyed ships
    return destroyedShips;
}

/* Function to remove ships from a given grid
    target: A reference to either grid1 or grid2
 */
function removeExistingShips(target) {
    // Iterate over each ship element and destroy it.
    target.querySelectorAll(".ship").forEach(ship => ship.remove());

    // Clear the appropriate ships list.
    if (target.id == "grid-1") {
        p1Ships = [];
    } else {
        p2Ships = [];
    }
}

// Function to temporarily change the status message 
function setTempStatus(msg) {
    // Clear any existing temporary status
    clearTimeout(statusTimeout);

    // Change the text in the status bar
    statusBar.innerText = msg;

    // Schedule the status bar to revert to it's initial text in 2 seconds
    statusTimeout = setTimeout(() => {
        statusBar.innerText = statusText;
    }, 2000);
}

// Function to permanently change the status message
function setStatus(msg) {
    statusText = msg;
    statusBar.innerText = msg;
}

// Function to update the hit/miss counters based on the cells on the board.
function updateHitMissCount() {
    // Count up the number of hit and missed cells on each grid....
    const p1HitCount = grid2.querySelectorAll('.cell.bang').length;
    const p1MissCount = grid2.querySelectorAll('.cell.miss').length;
    const p2HitCount = grid1.querySelectorAll('.cell.bang').length;
    const p2MissCount = grid1.querySelectorAll('.cell.miss').length;

    // .... and display the value in the counters.
    p1Hits.innerText = `${p1HitCount} hits`;
    p1Misses.innerText = `${p1MissCount} misses`;
    p2Hits.innerText = `${p2HitCount} hits`;
    p2Misses.innerText = `${p2MissCount} misses`;
}

// Function to increment the turn counter.
function incrementTurnCounter() {
    turn++;
    turnCounter.innerText = `Turn ${turn}`;
}

function clearCounters(){
    turnCounter.innerText = '';
    p1Hits.innerText = '';
    p1Misses.innerText = '';
    p2Hits.innerText = '';
    p2Misses.innerText = '';
}

function getShipConfig() {
    const carriers = document.getElementById('carriers').value;
    const battleships = document.getElementById('battleships').value;
    const bases = document.getElementById('bases').value;
    const cruisers = document.getElementById('cruisers').value;
    const destroyers = document.getElementById('destroyers').value;
    const submarines = document.getElementById('submarines').value;

    sizes = [];

    for (let i = 0; i < carriers; i++) { sizes.push([5,1]); }
    for (let i = 0; i < battleships; i++) { sizes.push([4,1]); }
    for (let i = 0; i < cruisers; i++) { sizes.push([3,1]); }
    for (let i = 0; i < destroyers; i++) { sizes.push([2,1]); }
    for (let i = 0; i < submarines; i++) { sizes.push([1,1]); }
    for (let i = 0; i < bases; i++) { sizes.push([2,2]); }

    // Spawn in the ships on both grids
    spawnShips(grid1);
    spawnShips(grid2);
    p1Health.innerText = `${p1Ships.length} ships remaining.`;
    p2Health.innerText = `${p2Ships.length} ships remaining.`;
}

// Function to detect keypresses. Used to trigger rotation when R is pressed.
function keyHandler(e) {
    // Only do something if a drag operation is underway and the user presses R
    if (mouseHeld && e.key == 'r') {
        e.preventDefault();
        // Toggle the rotation flag
        rotated = !rotated;
        // Flip
        rotateShip(dragShip);
        // Reset the ghost ship, as the ship it's mimicing has changed
        setGhostShip(dragShip);
        // Restart the drag operation with the ship's new dimensions
        dragStart(e);
    }
}

// Random number generator
function rng(max) {
    return Math.floor(Math.random() * (max+1) + 1);
}

// Function to set the UI to light or dark mode, depending on the user's system
function setTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.replace('theme-light', 'theme-dark');
    } else {
        document.body.classList.replace('theme-dark', 'theme-light');
    }
}

document.addEventListener('DOMContentLoaded', function() { init(); });
document.addEventListener('mousemove', dragHandler);
document.addEventListener('mouseup', drop);
document.addEventListener('touchend', drop, {passive: false});
document.addEventListener('keydown', keyHandler);

// Detect system light/dark mode change 
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    setTheme();
});