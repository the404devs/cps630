const gridSize = 10;
const bounds = 400;
const cellSize = bounds/gridSize;

//TODO: ship shrink bug when rotating vertical to horizontal on left side

let p1Ships = [];
let p2Ships = [];

const grid1 = document.getElementById('grid-1');
const grid2 = document.getElementById('grid-2');

const ghostShip = document.getElementById('ghost');


let mouseHeld = false;
let dragShip;
let rotated = false;

let tempPrevPos;

let dragEnabled = true;

const statusBar = document.getElementById('status');
let statusTimeout;
let statusText = "";

let playerCanShoot = false;


const p1Health = document.getElementById('p1-health');
const p2Health = document.getElementById('p2-health');

const p1Misses = document.getElementById('p1-misses');
const p2Misses = document.getElementById('p2-misses');

const p1Hits = document.getElementById('p1-hits');
const p2Hits = document.getElementById('p2-hits');

const turnCounter = document.getElementById('turn-counter');
let turn = 0;

const boom = new Audio("./assets/audio/boom.mp3");
const splash = new Audio("./assets/audio/splash.mp3");


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
    const sizes = [[1,1], [1,1], [1,1], [1,1], [2,1], [2,1], [2,1], [3,1], [3,1], [4,1]];

    // Get the 'owner' of the grid we're placing ships on: either p1 or p2.
    const owner = target.getAttribute('owner');

    // Ship indexer.
    let i = 0;

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
        do {
            x = rng(gridSize - w);
            y = rng(gridSize - l);
        } while (checkOverlapping(otherShips, [x, y, x+w, y+l]));

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
            // ship.addEventListener('click', shipSelect);
            ship.addEventListener('mousedown', dragStart);
            ship.addEventListener('touchstart', dragStart);
        }
        
        // Increment counter
        i++;
    });
}

function rotateButton() {
    const selectedShip = grid1.querySelector('.ship.selected');
    rotateShip(selectedShip);
}

function shipSelect(e) {
    alert("sus");
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


// Function called when a ship begins to be dragged.
function dragStart(e) {
    e.preventDefault();
    // Ensure the user is using the left mouse button, and that they are allowed to drag ships right now.
    if (e.which == 1 && dragEnabled) {
        // Assign the targeted ship to the global dragShip variable.
        dragShip = e.target;

        grid1.querySelectorAll('.ship').forEach(ship => {ship.classList.remove('selected')});
        // Give it the 'dragging' class, this visually hides it while the drag is in effect.
        dragShip.classList.add('dragging', 'selected');
        // Mark the mouse as currently held down.
        mouseHeld = true;
        // Enable the ghost ship to mimic the ship being moved.
        setGhostShip(dragShip);
        // Call the dragHandler function to begin drag operations.
        dragHandler(e);
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


// Function called whenever the mouse is moved. Used while a ship is being dragged around, and simulates a snap-to-grid effect while moving the ship
function dragHandler(e) {
    e.preventDefault();
    // Ensure that the mouse is held.
    if (e.which == 1 && mouseHeld) {
        // Get the ghost ship's dimensions
        const w = parseInt(ghostShip.style.width);
        const l = parseInt(ghostShip.style.height);

        const leftBound = parseInt(grid1.offsetLeft);
        const topBound = parseInt(grid1.offsetTop);
        const rightBound = leftBound + bounds - cellSize;
        const bottomBound = topBound + bounds - cellSize;

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
        x = (Math.round(x / cellSize) * cellSize) + offsetX;
        y = (Math.floor(y / cellSize) * cellSize) + offsetY;
        // Why do we round for x, but floor for y? idk, but this makes it work
        
        // Set the ghost ship's position
        ghostShip.style.left = `${x}px`;
        ghostShip.style.top = `${y}px`; 
    }
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

// Function called when a drag operation ends (drop)
function drop(e) {
    e.preventDefault();
    // Ensure the mouse was held
    if (e.which == 1 && mouseHeld) {
        // Get the index of the ship being moved.
        const shipIndex = dragShip.getAttribute('index');
        // Get the list of other ships owned by this player.
        const otherShips = dragShip.classList.contains('p1') ? p1Ships : p2Ships;

        // Get the coords of where the mouse was released.
        const releaseX = e.pageX;
        const releaseY = e.pageY;
        const targetedElems = document.elementsFromPoint(releaseX, releaseY);

        // Find the cell under the mouse.
        const targetedCell = targetedElems.filter(elem => elem.classList.contains('cell'))[0];

        // If there is a cell under the mouse, proceed.
        if (targetedCell) {
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

            // Check if the new position is valid...
            if (!checkOverlapping(otherShips, [newX1, newY1, newX2, newY2], shipIndex)) {
                // ...and set the ship in the new position
                setShipPosition(dragShip, newX1, newY1, newX2, newY2, shipIndex, otherShips);
            } else {
                // If the new spot is invalid, flash a message to the user.
                setTempStatus("Invalid placement: The ship overlaps another.");
                // If the ship was rotated during this drag operation, we need to put it back to how it was before.
                if (rotated) {
                    // Restore the ship to it's pre-rotation position
                    setShipPosition(dragShip, tempPrevPos[0], tempPrevPos[1], tempPrevPos[2], tempPrevPos[3], shipIndex, otherShips);
                }
            }
        } else {
            // There is no cell under the mouse. The user attempted to place the ship out-of-bounds.
            setTempStatus("Invalid placement: The ship is out-of-bounds.");
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

        // Check if the given position is out of bounds
        if ((x1 < 1 || x2 > 11) || (y1 < 1 || y2 > 11)) {
            overlapping = true;
        }

        // Increment counter
        i++;
    });

    // Return the value of the overlapping flag
    return overlapping;
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

    // Attempt to place the ship in the rotated position
    setShipPosition(ship, newX1, newY1, newX2, newY2, shipIndex, otherShips);
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

// Function to initialize the game
function init() {
    generateGrid(grid1);
    generateGrid(grid2);
    spawnShips(grid1);
    spawnShips(grid2);
    turn = 0;
    incrementTurnCounter();
    updateHitMissCount();
    p1Health.innerText = `${p1Ships.length} ships remaining.`;
    p2Health.innerText = `${p2Ships.length} ships remaining.`;
    setStatus("Position your ships! Press 'R' while moving a ship to rotate.");
    dragEnabled = true;
    tempPrevPos = [];
    document.getElementById('ready-button').style.display = 'block';
    document.getElementById('reset-button').style.display = 'none';
}

function setTempStatus(msg) {
    clearTimeout(statusTimeout);
    statusBar.innerText = msg;

    statusTimeout = setTimeout(() => {
        statusBar.innerText = statusText;
    }, 2000);
}

function setStatus(msg) {
    statusText = msg;
    statusBar.innerText = msg;
}

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

function cpuTurn() {
    grid2.classList.remove("selectable");
    setTempStatus("Awaiting computer's move...");
    setTimeout(cpuShoot, 2000);
}

function cpuShoot() {
    if (    
        grid1.querySelectorAll('.cell:not(.bang):not(.miss)').length == 0 || 
        grid1.querySelectorAll('.ship:not(.dead)').length == 0
        ) {
        return;
    }

    console.log("");
    console.log("");
    console.log("");

    let hits = Array.from(grid1.querySelectorAll('.cell.bang:not(.dead)'));
    hits.sort(() => Math.random() - 0.5);
    let x, y, targetedCell;
    let foundSmartTarget = false;

    hits.forEach((searchSpot) => {

        if (foundSmartTarget) { return; }
        
        console.log('Looking near: ');
        console.log(searchSpot);
        console.log("------------------");

        const searchX = parseInt(searchSpot.style.gridColumnStart);
        const searchY = parseInt(searchSpot.style.gridRowStart);

        let potentialTargets = [
            [searchX+1, searchY],
            [searchX, searchY+1],
            [searchX-1, searchY],
            [searchX, searchY-1]
        ];

        potentialTargets.sort(() => Math.random() - 0.5);

        for (let i = 0; i < potentialTargets.length; i++) {
            const [targetX, targetY] = potentialTargets[i];
            console.log(`Targeting ${targetX}, ${targetY}`);

            if (targetX < 1 || targetX >= 11 || targetY < 1 || targetY >= 11) {
                console.log("Can't shoot here, oob.");
                continue;
            } else {
                targetedCell = document.getElementById(`p1-[${targetX-1},${targetY-1}]`);
                console.log(targetedCell);
                if (targetedCell.className == 'cell') {
                    x = targetX;
                    y = targetY;
                    console.log("Found unshot tile, breaking");
                    foundSmartTarget = true;
                    break;
                } else {
                    console.log("Can't shoot here, already shot.");
                }
            }
        }
    });
            
    if (!foundSmartTarget) {
        console.log('Shooting blind');
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

    // Return control to the player.
    playerCanShoot = true;
    grid2.classList.add("selectable");
    updateHitMissCount();
    incrementTurnCounter();
}

function incrementTurnCounter() {
    turn++;
    turnCounter.innerText = `Turn ${turn}`;
}

function countDeadShips(prefix, ships) {
    let index = 0;
    let destroyedShips = 0;
    const grid = prefix == 'p1' ? grid1 : grid2;
    const health = prefix == 'p1' ? p1Health : p2Health;
    ships.forEach(ship => {
        const [x1, y1, x2, y2] = ship;
        let totalCells = (x2-x1) * (y2-y1);
        let hitCells = 0;

        let cells = [];
        for (let i = x1; i < x2; i++) {
            for (let j = y1; j < y2; j++) {
                const occupiedCell = document.getElementById(`${prefix}-[${i-1},${j-1}]`);

                if (occupiedCell.classList.contains("bang")) {
                    hitCells++;
                    cells.push(occupiedCell);
                }
            }
        }

        if (totalCells == hitCells) {
            const target = grid.getElementsByClassName('ship')[index];
            target.classList.add('dead');
            destroyedShips++;

            cells.forEach(cell => {cell.classList.add('dead')});
        }
        index++;
    });

    health.innerText = `${ships.length - destroyedShips} ships remaining.`;

    return destroyedShips;
}

function failsafe() {
    document.querySelectorAll('.warn').forEach(cell => {cell.classList.remove('warn')});
    let i = 0;
    let playerPlacementInvalid = false;

    p1Ships.forEach(ship => {
        const [x1, y1, x2, y2] = ship;
        if (checkOverlapping(p1Ships, [x1, y1, x2, y2], i)){
            playerPlacementInvalid = true;
            const badShip = grid1.getElementsByClassName('ship')[i];
            badShip.classList.add('warn');
        }
        i++;
    });
    if (playerPlacementInvalid) {
        setTempStatus('You have overlapping ships! Please move them.');
        return true;
    } else {
        return false;
    }
}

function runGame() {
    if (failsafe()) {return;};

    document.getElementById('ready-button').style.display = 'none';
    grid2.classList.add("selectable");
    dragEnabled = false;
    setStatus("Choose a target on the computers grid..."); 
    playerCanShoot = true;   
}

function gameOver(victor){
    const msg = victor == 'p1' ? "Player wins!" : "Computer wins!";
    setStatus(msg);
    grid2.querySelectorAll('.ship').forEach(ship => {ship.classList.add('revealed')});
    playerCanShoot = false;
    document.getElementById('reset-button').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() { init(); });
document.addEventListener('mousemove', dragHandler);
document.addEventListener('touchmove', dragHandler);
document.addEventListener('mouseup', drop);
document.addEventListener('touchend', drop);
document.addEventListener('keydown', keyHandler);
