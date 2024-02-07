const gridSize = 10;
const bounds = 400;

let p1Ships = [];
let p2Ships = [];

const grid1 = document.getElementById('grid-1');
const grid2 = document.getElementById('grid-2');

const ghostShip = document.getElementById('ghost');


let mouseHeld = false;
let dragShip;
let rotated = false;

let dragEnabled = true;

const statusBar = document.getElementById('status');
let statusTimeout;
let statusText = "";

let playerCanShoot = false;


const p1Health = document.getElementById('p1-health');
const p2Health = document.getElementById('p2-health');

const boom = new Audio("./assets/audio/boom.mp3");
const splash = new Audio("./assets/audio/splash.mp3");

function generateGrid(target) {
    target.innerHTML = "";
    const owner = target.getAttribute('owner');
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const cell = document.createElement('div');
            cell.style.gridColumnStart = x+1;
            cell.style.gridRowStart = y+1;
            cell.classList.add('cell');
            cell.id = `${owner}-[${x},${y}]`;
            cell.addEventListener('click', cellClicked);

            target.appendChild(cell);
        }
    }
}

function spawnShips(target) {
    removeExistingShips(target);
    const sizes = [[1,1], [1,1], [1,1], [1,1], [2,1], [2,1], [2,1], [3,1], [3,1], [4,1]];

    const owner = target.getAttribute('owner');
    let i = 0;
    sizes.forEach(size => {

        let x, y = 0;
        let [w, l] = size;

        let orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
        if (orientation == 'vertical') { [l,w] = size };

        const otherShips = owner == 'p1' ? p1Ships : p2Ships;
        
        do {
            x = rng(gridSize - w);
            y = rng(gridSize - l);
        } while (checkOverlapping(otherShips, x, y, x+w, y+l));
        const ship = document.createElement('div');
        ship.classList.add("ship", owner);
        ship.style.gridColumnStart = x;
        ship.style.gridColumnEnd = x + w;
        ship.style.gridRowStart = y;
        ship.style.gridRowEnd = y + l;
        ship.setAttribute('index', i);
        i++;
        otherShips.push([x ,y, x+w, y+l]);

        ship.addEventListener('mousedown', dragStart);
        target.appendChild(ship);
    });
}

function dragStart(e) {
    e.preventDefault();
    if (e.which == 1 && dragEnabled) {
        dragShip = e.target;
        dragShip.classList.add('dragging');
        mouseHeld = true;
        setGhostShip(dragShip);
        
        dragHandler(e);
    }
}

function setGhostShip(mimic){
    ghostShip.classList = mimic.classList;
    ghostShip.style.visibility = "visible";
    width = (bounds/gridSize) * (mimic.style.gridColumnEnd - mimic.style.gridColumnStart);
    height = (bounds/gridSize) * (mimic.style.gridRowEnd - mimic.style.gridRowStart);
    ghostShip.style.width = `${width}px`;
    ghostShip.style.height = `${height}px`;
}

function dragHandler(e) {
    e.preventDefault();
    if (e.which == 1 && mouseHeld) {
        let x = e.pageX - parseInt(ghostShip.style.width) / 2;
        let y = e.pageY - parseInt(ghostShip.style.height) / 2;

        // let offsetX = grid1.offsetWidth % 40;
        // let offsetY = grid1.offsetHeight % 40;
        // x = offsetX - 40 + Math.ceil(x / 40) * 40;
        // y = offsetY - 15 + Math.ceil(y / 40) * 40;
        ghostShip.style.left = `${x}px`;
        ghostShip.style.top = `${y}px`; 
    }
}

function dragEnd(e) {
    e.preventDefault();
    if (e.which == 1 && mouseHeld) {
        ghostShip.classList = [];
        ghostShip.style.visibility = "hidden";
        ghostShip.style.width = `0px`;
        ghostShip.style.height = `0px`;
        ghostShip.style.left = `0px`;
        ghostShip.style.top = `0px`; 

        const releaseX = e.pageX;
        const releaseY = e.pageY;
        const targetedElems = document.elementsFromPoint(releaseX, releaseY);

        let targetedCellX, targetedCellY;
        let foundCell = false;
        targetedElems.forEach(element => {
            if (element.className == 'cell' && element.parentElement.id == "grid-1") {
                foundCell = true;
                targetedCellX = parseInt(element.style.gridColumnStart);
                targetedCellY = parseInt(element.style.gridRowStart);

                const shipGridColStart = parseInt(dragShip.style.gridColumnStart);
                const shipGridColEnd = parseInt(dragShip.style.gridColumnEnd);
                const shipGridRowStart = parseInt(dragShip.style.gridRowStart);
                const shipGridRowEnd = parseInt(dragShip.style.gridRowEnd);

                const shipWidth = shipGridColEnd - shipGridColStart;
                const shipHeight = shipGridRowEnd - shipGridRowStart;

                let newGridColStart = Math.ceil(targetedCellX - (shipWidth/2));
                let newGridColEnd = Math.ceil(targetedCellX + (shipWidth/2));
                let newGridRowStart = Math.ceil(targetedCellY - (shipHeight/2));
                let newGridRowEnd = Math.ceil(targetedCellY + (shipHeight/2));

                if ((shipGridColEnd - shipGridColStart) % 2 === 0) {
                    newGridColStart++;
                    newGridColEnd++;
                }
                if ((shipGridRowEnd - shipGridRowStart) % 2 === 0) {
                    newGridRowStart++;
                    newGridRowEnd++;
                }

                let i = dragShip.getAttribute('index');
                const otherShips = dragShip.classList.contains('p1') ? p1Ships : p2Ships;

                if (!checkOverlapping(otherShips, newGridColStart, newGridRowStart, newGridColEnd, newGridRowEnd, i)) {
                    dragShip.style.gridColumnStart = newGridColStart;
                    dragShip.style.gridColumnEnd = newGridColEnd;
                    dragShip.style.gridRowStart = newGridRowStart;
                    dragShip.style.gridRowEnd = newGridRowEnd;
                    
                    otherShips[i] = [newGridColStart, newGridRowStart, newGridColEnd, newGridRowEnd];
                } else {
                    console.log("cant drop there!");
                    setTempStatus("Invalid placement: The ship overlaps another.");
                    if(rotated) {
                        rotateShip(dragShip);
                    }
                }
            }
        });
        if (!foundCell) {
            setTempStatus("Invalid placement: The ship is out-of-bounds.");
            if(rotated) {
                rotateShip(dragShip);
            }
        }
        
        dragShip.classList.remove('dragging');
        mouseHeld = false;
        rotated = false;
        dragShip = null;
    }
}

function checkOverlapping(ships, x1, y1, x2, y2, ignore) {
    let overlapping = false;
    let i = 0;
    ships.forEach(ship => {
        const [shipX1, shipY1, shipX2, shipY2] = ship;
        if ((x1 < shipX2 && x2 > shipX1) && (y1 < shipY2 && y2 > shipY1)) {
            if (i != ignore) {
                overlapping = true;
            }
        }

        if ((x1 < 1 || x2 > 11) || (y1 < 1 || y2 > 11)) {
            overlapping = true;
        }

        i++;
    });
    return overlapping;
}

function removeExistingShips(target) {
    target.querySelectorAll(".ship").forEach(ship => ship.remove())

    if (target.id == "grid-1") {
        p1Ships = [];
    } else {
        p2Ships = [];
    }
}

function rotateShip(ship) {
    const shipGridColStart = parseInt(dragShip.style.gridColumnStart);
    const shipGridColEnd = parseInt(dragShip.style.gridColumnEnd);
    const shipGridRowStart = parseInt(dragShip.style.gridRowStart);
    const shipGridRowEnd = parseInt(dragShip.style.gridRowEnd);

    const centerX = (shipGridColStart + shipGridColEnd) / 2;
    const centerY = (shipGridRowStart + shipGridRowEnd) / 2;

    let newGridColStart = Math.round(centerX - (shipGridRowEnd - centerY));
    let newGridColEnd = Math.round(centerX - (shipGridRowStart - centerY));
    let newGridRowStart = Math.round(centerY + (shipGridColStart - centerX));
    let newGridRowEnd = Math.round(centerY + (shipGridColEnd - centerX));

    // Check if the ship length is even, adjust for 180-degree rotation
    if ((shipGridColEnd - shipGridColStart) % 2 === 0) {
        newGridColStart--;
        newGridColEnd--;
        newGridRowStart--;
        newGridRowEnd--;
    }

    while (newGridColEnd > 11) {
        newGridColEnd--;
        newGridColStart--;
    } 
    while (newGridRowEnd > 11) {
        newGridRowEnd--;
        newGridRowStart--;
    } 

    while (newGridColStart < 1) {
        newGridColEnd++;
        newGridColStart++;
    } 

    while (newGridRowStart < 1) {
        newGridRowEnd++;
        newGridRowStart++;
    } 

    
    let i = dragShip.getAttribute('index');
    const otherShips = dragShip.classList.contains('p1') ? p1Ships : p2Ships;

    // if (!checkOverlapping(otherShips, newGridColStart, newGridRowStart, newGridColEnd, newGridRowEnd, i)) {
    dragShip.style.gridColumnStart = newGridColStart;
    dragShip.style.gridColumnEnd = newGridColEnd;
    dragShip.style.gridRowStart = newGridRowStart;
    dragShip.style.gridRowEnd = newGridRowEnd;

    otherShips[i] = [newGridColStart, newGridRowStart, newGridColEnd, newGridRowEnd];
    // }
}

function keyHandler(e) {
    if (mouseHeld && e.key == 'r') {
        rotated = !rotated;
        e.preventDefault();
        rotateShip(dragShip);
        setGhostShip(dragShip);
        dragStart(e);
    }
}

function rng(max) {
    return Math.floor(Math.random() * (max+1) + 1);
}


function init() {
    generateGrid(grid1);
    generateGrid(grid2);
    spawnShips(grid1);
    spawnShips(grid2);

    p1Health.innerText = `${p1Ships.length} ships remaining.`;
    p2Health.innerText = `${p2Ships.length} ships remaining.`;
    setStatus("Position your ships! Press 'R' while moving a ship to rotate.");
    dragEnabled = true;
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
            if (checkOverlapping(p2Ships, x, y, x+1, y+1)) {
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
    if (grid1.querySelectorAll('.cell:not(.bang):not(.miss)').length == 0) {
        return;
    }
    let x, y, targetedCell;
    do {
        x = rng(gridSize-1);
        y = rng(gridSize-1);
        targetedCell = document.getElementById(`p1-[${x-1},${y-1}]`);
    } while (targetedCell.className != "cell");

    // Check if the cell's coordinates overlap any of p2's ships
    if (checkOverlapping(p1Ships, x, y, x+1, y+1)) {
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
        for (let i = x1; i < x2; i++) {
            for (let j = y1; j < y2; j++) {
                const occupiedCell = document.getElementById(`${prefix}-[${i-1},${j-1}]`);

                if (occupiedCell.classList.contains("bang")) {
                    hitCells++;
                }
            }
        }

        if (totalCells == hitCells) {
            const target = grid.getElementsByClassName('ship')[index];
            target.classList.add('dead');
            destroyedShips++;
        }
        index++;
    });

    health.innerText = `${ships.length - destroyedShips} ships remaining.`;

    return destroyedShips;
}

function failsafe() {
    document.querySelectorAll('.warn').forEach(cell => {cell.classList.remove('warn')});
    let playerPlacementInvalid = false;
    let i = 0;
    p1Ships.forEach(ship => {
        const [x1, y1, x2, y2] = ship;
        if (checkOverlapping(p1Ships, x1, y1, x2, y2, i)){
            playerPlacementInvalid = true;
            const badShip = grid1.getElementsByClassName('ship')[i];
            badShip.classList.add('warn');
        }
        i++;
    });
    if (playerPlacementInvalid) {
        setTempStatus('You have overlapping ships! Please move them.');
        return;
    }
}

function runGame() {
    failsafe();

    document.getElementById('ready-button').style.display = 'none';
    grid2.classList.add("selectable");
    dragEnabled = false;
    setStatus("Choose a target on the computers grid..."); 
    playerCanShoot = true;   
}

function gameOver(victor){
    const msg = victor == 'p1' ? "Player wins!" : "Computer wins!"
    setStatus(msg);
    playerCanShoot = false;
    document.getElementById('reset-button').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() { init(); });
document.addEventListener('mousemove', dragHandler);
document.addEventListener('mouseup', dragEnd);
document.addEventListener('keydown', keyHandler);
