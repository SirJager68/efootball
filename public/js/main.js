// =================== main.js
//
console.log('=====================');
console.log('==ELECTRIK FOOTBALL==');
console.log('====HAL 9001 =========');
console.log('======================');
console.log('Loading main.js...');
console.log('=====================');

// =================== SETUP CANVAS AND WEBSOCKET
// **
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
//const ws = new WebSocket('ws://localhost:8080');
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}`;
const ws = new WebSocket(wsUrl);
const gameID = 'abcdef';
let players = [];
let gameRunning = false;
let clockSeconds = 600; // Default until server update
let playClock = 25; // Default until server update

// ==================== FIELD DIMESIONS
// ** should server give us this on startup?
const FIELD_WIDTH = 140;
const FIELD_HEIGHT = 80;
const PLAYABLE_WIDTH = 120;
const PLAYABLE_HEIGHT = 63;
const PLAYABLE_X_OFFSET = (FIELD_WIDTH - PLAYABLE_WIDTH) / 2; // 10
const PLAYABLE_Y_OFFSET = (FIELD_HEIGHT - PLAYABLE_HEIGHT) / 2; // 3.5
const pixelsPerYard = canvas.width / FIELD_WIDTH;


// ===== MOVING AND ZOOMING THE FIELD EVENT LISTENERS
let zoom = 1; // Initial zoom
const ZOOM_MIN = 0.9; // Min zoom (half size)
const ZOOM_MAX = 3; // Max zoom (triple size)
//const ZOOM_STEP = 0.1; // Zoom increment
const ZOOM_STEP = 0.01; // Zoom increment
let panX = 0; // Pan offset in pixels
let panY = 0;
let isDraggingField = false;
let isDraggingPlayer = false;
let isDragging = false;
let isAdjustingDial = false;
let isRotatePlayer = false;
let selectedPlayer = null;
let selectedPlayerR = null;
let selectedPlayerDial = null;
let lastMouseX = 0;
let lastMouseY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;
let mx = 0; // Add global mouse coordinates
let my = 0;

let lastHoverCheck = 0;
const HOVER_CHECK_INTERVAL = 100;

// ========================================== PLAYER STUFF
// ** MOVE TO SERVER AND GET INITIAL LOAD
// ** for now they are here
// ** variables, images to handle client side

// ============== PLAYER VARIABLES
let hoveredPlayer = null;
let baseWidth = 4.1; // Base width of player in yards
let baseHeight = 2.5; // Base height of player in yards

let homeEndZoneColor = "#7A0019"; // Home team end zone color
let homeTeamName = "REDSKINS"; // Home team name
let awayEndZoneColor = "#041E42"; // Away team end zone color
let awayTeamName = "DALLAS"; // Away team name

const logoImage = new Image();
logoImage.src = 'images/stadium-center.png'; // Center image for the field
// ============== PLAYER IMAGES
const homeImage = new Image();
homeImage.src = 'images/ef-g-saints.png';
const awayImage = new Image();
awayImage.src = 'images/ef-g-saints.png';
// ========================================= END PLAYER STUFF

let gameState = {
    homeTeam: { name: homeTeamName, score: 0, color: homeEndZoneColor },
    awayTeam: { name: awayTeamName, score: 0, color: awayEndZoneColor },
    homeTeamColor: '#f00',
    awayTeamColor: '#0051ba',
    qtr: 1,
    gameClock: clockSeconds,
    playClock: playClock,
    possession: null,
    isRunning: gameRunning,
    los: null,
    fdl: null,
    firstDownLine: null,
    gameStart: false,
    gameState: 'unknown',
    currentPlay: null,
    homeScore: 0,
    awayScore: 0,
    currentPlay: null,
    playMode: 0,
    mySide: null, // "home" or "away"
    token: null, // Player token for authentication
    gameId: null,
    ball: {
        x: 0,
        y: 0,
        isMoving: false,
    },
    players: []
};

let msgDuration = 2500; // Message duration in milliseconds
let ballColor = 'white';
let isDraggingBand = false;
let showReceivers = false;
let showPlayerInfo = true;

let gameStarted = false;
const LOAD_TIMEOUT = 1000; // 2 seconds

// =================== TIMER TO LET GAME LOAD
setTimeout(() => {
    gameStarted = true;
    console.log('Timer complete, starting game');
    render();
}, LOAD_TIMEOUT);


// ================================= DEFINE FIELD CANVAS
const fieldCanvas = document.createElement('canvas');
const fieldCtx = fieldCanvas.getContext('2d');
fieldCanvas.width = canvas.width;
fieldCanvas.height = canvas.height;
let fieldDirty = true; // Redraw field on zoom/pan change

// ====== PERFORMANCE VARIABLES
// Performance tracking
let bytesSent = 0;
let bytesReceived = 0;
let lastMessageBytes = 0; // Per-tick bytes in KB
let frameCount = 0;
let lastFrameTime = performance.now();
let renderTimes = [];
let fps = 0;

// =============================== SOUND INFO WILL GO HERE
let vibrateSound = false; // Flag to indicate if sound is playing

// ============================== CONVERSION OF YARDS TO PIXELS AND MORE
// ** IMPORTANT: This is the conversion of yards to pixels for the field size
// ** used throughout the game
function yardsToPixels(yards) {
    return yards * pixelsPerYard * zoom;
}
function pixelsToYards(pixels) {
    return pixels / (pixelsPerYard * zoom);
}
function formatClock(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `Clock: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ============================= MESSAGE SYSTEM
// MessageCanvas class to manage and render messages on a separate canvas
class MessageCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.messages = []; // Queue of { text, type, timeout }
        this.font = 'bold 30px Arial';
        this.padding = 10;
        this.duration = msgDuration || 2500; // 3 seconds
        this.styles = {
            success: { textColor: '#00FF00', bgColor: 'rgba(0, 100, 0, 0.75)' }, // Green for First Down
            warning: { textColor: '#FF0000', bgColor: 'rgba(100, 0, 0, 0.75)' }, // Red for Turnover
            info: { textColor: '#FFFFFF', bgColor: 'rgba(0, 0, 0, 0.75)' } // White for general
        };
        this.canvas.width = 720; // Match scorebug
        this.canvas.height = 100; // Enough for multiple messages
        this.canvas.style.display = 'none'; // Hidden initially
    }

    // Add a message to the queue
    addMessage(text, type = 'info') {
        this.messages.push({
            text: text,
            type: type,
            timeout: Date.now() + this.duration
        });
        this.canvas.style.display = 'block'; // Show canvas
        console.log(`Message added: ${text}, type: ${type}, queue:`, this.messages.map(m => m.text));
    }

    // Render messages at top center
    render() {
        if (!this.ctx) {
            console.error('MessageCanvas context not available');
            return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear message canvas
        const now = Date.now();
        this.messages = this.messages.filter(msg => msg.timeout > now); // Remove expired
        if (this.messages.length === 0) return; // Skip if no messages
        //console.log('Rendering messages:', this.messages.map(m => m.text));
        this.ctx.save();
        this.ctx.font = this.font;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        let y = 20; // Start at top of messageCanvas
        this.messages.forEach(msg => {
            const style = this.styles[msg.type] || this.styles.info;
            const metrics = this.ctx.measureText(msg.text);
            const textWidth = metrics.width;
            const textHeight = 30; // Approximate height for 30px font
            const boxWidth = textWidth + this.padding * 2;
            const boxHeight = textHeight + this.padding * 2;
            // Draw background
            this.ctx.fillStyle = style.bgColor;
            this.ctx.fillRect(this.canvas.width / 2 - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);
            // Draw text
            this.ctx.fillStyle = style.textColor;
            this.ctx.fillText(msg.text, this.canvas.width / 2, y);
            y += boxHeight + 10; // Stack messages vertically
        });
        this.ctx.restore();
    }
}

const messageCanvas = new MessageCanvas('messageCanvas');
console.log('MessageCanvas initialized:', messageCanvas);

// ============================ END MESSAGE SYSTEM

//===========================================
// ============================ DEBUG OVERLAY
//==========================================
// DebugScreen class to manage overlay
class DebugScreen {
    constructor() {
        this.overlay = document.getElementById('debugOverlay');
        this.content = document.getElementById('debugContent');
        this.resetButton = document.getElementById('resetButton');
        this.toggleButton = document.getElementById('debugToggle');
        this.isVisible = false;

        // Toggle on 'D' key
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'd') {
                this.toggle();
            }
        });

        // Toggle button
        this.toggleButton.addEventListener('click', () => this.toggle());

        // Reset button
        this.resetButton.addEventListener('click', () => {
            ws.send(JSON.stringify({ type: 'reset' }));
            console.log('Reset game triggered');
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.overlay.style.display = this.isVisible ? 'block' : 'none';
        console.log(`Debug screen ${this.isVisible ? 'shown' : 'hidden'}`);
    }

    update(state, players) {
        if (!this.content) return;
        const debugText = `
Possession: ${state.possession || 'N/A'}
Home Side: ${(state.homeSide || 0).toFixed(2)} (${state.homeSide === 0 ? 'Right' : 'Left'})
Away Side: ${(state.awaySide || Math.PI).toFixed(2)} (${state.awaySide === 0 ? 'Right' : 'Left'})
Quarter: ${state.quarter || 1}
Game Clock: ${(state.gameClock || 600).toFixed(0)}s (${Math.floor(state.gameClock / 60)}:${(state.gameClock % 60).toFixed(0).padStart(2, '0')})
Play Clock: ${(state.playClock || 25).toFixed(0)}s
LOS: ${(state.los || 60)}
FDL: ${(state.firstDownLine || 70).toFixed(2)}
Home Score: ${state.homeScore || 0}
Away Score: ${state.awayScore || 0}
Down: ${state.down || 1}
Yards to Go: ${state.yardsToGo || 10}
Play State: ${state.playState || 'unknown'}
Game Running: ${state.gameRunning || false}
Current PLay : ${state.currentPlay || 'unknown'}    
Clock Running: ${state.clockRunning || false}
Play Clock Running: ${state.playClockRunning || false}
Game Started: ${state.gameStart || 'unknown'}
Home TD: ${state.homeTD || 'unknown'}
Away TD: ${state.awayTD || 'unknown'}
Ball Carrier: ${players.find(p => p.hb)?.pid || 'None'} (x=${players.find(p => p.hb)?.x?.toFixed(2) || 'N/A'}, y=${players.find(p => p.hb)?.y?.toFixed(2) || 'N/A'})
        `;
        this.content.textContent = debugText;
    }
}

// Initialize DebugScreen (after canvas setup)
//const gameCanvas = document.getElementById('gameCanvas');
//const ctx = gameCanvas.getContext('2d');
// const scorebugCanvas = document.getElementById('scorebugCanvas');
// const scorebug = new Scorebug('scorebugCanvas', {
//     width: 720,
//     height: 60,
//     pixelsPerYard: 1440 / 140
// });
//const messageCanvas = new MessageCanvas('messageCanvas');
const debugScreen = new DebugScreen();
console.log('DebugScreen initialized:', debugScreen);

// ============================ END DEBUG OVERLAY

// =============================== SERVER STUFF
// =============================== WEBSOCKET - get message from server
// *******************************************************************
ws.onconnect = () => {
    console.log('WebSocket connected');
    ws.send(JSON.stringify({ type: 'join', gameID })); // Join game on connect
}
ws.onmessage = (msg) => {
    lastMessageBytes = msg.data.length / 1024;
    bytesReceived += msg.data.length;
    //console.log('msg.data:', msg.data);
    // switch (msg.type) {
    //     case 'assignedSide':
    //         mySide = msg.side;
    //         gameState.mySide = msg.side      // "home" or "away"
    //         initControlsFor(mySide);
    //         break;
    //     case 'playerConnected':
    //         showInfo(msg.message);
    //         break;
    //     // …and so on for your game messages
    // }

    try {
        const data = JSON.parse(msg.data);
        if (data.type === 'assignedSide') {
            gameState.mySide = data.side; // "home" or "away"
            gameState.token = data.token; // Player token for authentication
            gameState.gameId = data.gameId; // Game ID for this session
            initControlsFor(gameState.mySide);
        }
        if (data.type === 'initialState') {
                console.clear();
            console.log('*************************');
            console.log('LOADING INITIAL STATE:');
            gameState.players = data.players.filter(p => p && p.pid);
            console.log('Initial state received:', JSON.stringify(data));
            // Clear out any old noise
        

            // Start a grouped log
            console.group('%c🔄 Loading Initial State', 'color: #0af; font-weight: bold;');

            // Log summary fields
            console.log('Game ID:        %s', data.i);
            console.log('Possession:     %s', data.r);
            console.log('LOS Yard Line:  %d', data.los);
            console.log('First Down:     %d', data.fdl);
            console.log('Quarter:        %d', data.qtr);
            console.log('Game Clock:     %d', data.s);
            console.log('Play Clock:     %d', data.p);

            // Show the players in a table (pick columns you care about)
            console.table(
                data.players.filter(p => p && p.pid),
                ['pid', 'name', 'x', 'y', 'speed', 'defaultSpeed', 'strength', 'mass', 'hb', 'ie']
            );

            // If you still want the raw object, pretty-print it:
            console.log('Full payload:\n', JSON.stringify(data, null, 2));

            // End the group so you can collapse it
            console.groupEnd();
        }

        if (data.type === 'playerUpdate') {
            const player = players.find(p => p.pid === data.pid);
            if (player) {
                player.x = data.x;
                player.y = data.y;
                player.h = data.h;
                player.d = data.d;
                player.dc = data.dc;
                player.hb = data.hb;
                //player.hb = data.hb;
                //console.log(`Received player update: ${data.pid}, x=${data.x}, y=${data.y}`);
            }
        } else if (data.type === 'clockUpdate') {
            clockSeconds = data.s !== undefined ? data.s : clockSeconds;
            playClock = data.p !== undefined ? data.p : playClock;
            gameRunning = data.r !== undefined ? data.r : gameRunning;
            // console.log(`Received clock update: s=${data.s}, p=${data.p}, r=${data.r}`);
            gameState.gameClock = clockSeconds;
            gameState.playClock = playClock;
            gameState.isRunning = gameRunning;
            scorebug.update(gameState);

            // ============================================= TACKLE EVENT
        } else if (data.type === 'tackle') {
            players = data.pl.filter(p => p && p.pid);
            console.log('Tackle event:', `${data.tacklerID} tackled ${data.tackledPlayerID}`);
            const updates = {
                los: v => (gameState.los = v, console.log(`Updated LOS: losYardLine=${v}`)),
                fdl: v => (gameState.firstDownLine = v, console.log(`Updated first down: first down=${v.toFixed(2)}`)),
                s: v => (clockSeconds = v, gameState.gameClock = v),
                p: v => (playClock = v, gameState.playClock = v),
                down: v => (down = v, gameState.down = v, console.log(`Updated down: down=${v}`)),
                ytg: v => (yardsToGo = Math.round(v), gameState.yardsToGo = yardsToGo, console.log(`Updated yards to go: yardsToGo=${yardsToGo}`)),
                currentPlay: v => (gameState.currentPlay = v, console.log(`Updated current play: currentPlay=${v}`)),
                r: v => (
                    gameRunning = v,
                    console.log('Play stopped due to tackle'),
                    (() => {
                        const ballCarrier = players.find(p => p.hb);
                        ballCarrier && console.log(`Tackled at x=${ballCarrier.x.toFixed(2)}, y=${ballCarrier.y.toFixed(2)}`);
                    })()
                )
            };

            for (const key in updates) {
                if (data[key] !== undefined) updates[key](data[key]);
            }
            gameState.playMode = data.m;
            gameState.ball.isMoving = false;
            ballColor = 'white';
            scorebug.update(gameState);
            //debugScreen.update(gameState, players); // Update debug screen
            if (gameStarted) render();

            // ================================================================= RESET EVENT
            // ** BROASCAST EVERYTHING
            //**
            // =============================================================================
        } else if (data.type === 'reset') {
            players = data.pl.filter(p => p && p.pid);
            console.log('Reset event received:', JSON.stringify(data));
            console.log('Reset event');
            //gameState.players = players;
            const updates = {
                los: v => (gameState.los = v, console.log(`Updated LOS: losYardLine=${v}`)),
                fdl: v => (gameState.firstDownLine = v, console.log(`Updated first down: first down=${v}`)),
                s: v => (clockSeconds = v, gameState.gameClock = v),
                qtr: v => (qtr = v, gameState.qtr = v, console.log(`Updated quarter: quarter=${v}`)),
                p: v => (playClock = v, gameState.playClock = v),
                r: v => (gameRunning = v),
                down: v => (down = v, gameState.down = v, console.log(`Updated down: down=${v}`)),
                ytg: v => (yardsToGo = Math.round(v), gameState.yardsToGo = yardsToGo, console.log(`Updated yards to go: yardsToGo=${yardsToGo}`)),
                poss: v => (gameState.possession = v, console.log(`Updated possession: possession=${v}`)),
                homeScore: v => (gameState.homeTeam.score = v, console.log(`Updated home score: homeScore=${v}`)),
                awayScore: v => (gameState.awayTeam.score = v, console.log(`Updated away score: awayScore=${v}`)),
                playState: v => (
                    gameState.playState = v,
                    v === 'touchdown' && (tdCrowd.play(), gameState.currentPlay = 'end'),
                    console.log(`Updated play state: playState=${v}`)
                ),
                currentPlay: v => (gameState.currentPlay = v, console.log(`Updated current play: currentPlay=${v}`)),
                homeTD: v => (gameState.homeTD = v, console.log(`homeTD=${v}`)),
                awayTD: v => (gameState.awayTD = v, console.log(`awayTD=${v}`)),
                gameStart: v => (v !== 'unknown' && (gameState.gameStart = v, console.log(`>Game started: ${v}`)))
            };

            for (const key in updates) {
                if (data[key] !== undefined) updates[key](data[key]);
            }

            if (data.message) {
                messageCanvas.addMessage(data.message.text, data.message.type);
                console.log(`Processed message: ${data.message.text}, type: ${data.message.type}`);
            }
            gameState.playMode = data.m;
            gameState.ball.isMoving = false;
            ballColor = 'white';
            selectedPlayerR = null;
            scorebug.update(gameState);
            //debugScreen.update(gameState, players); // Update debug screen
            //if (gameStarted) {
            fieldDirty = true; // Force redraw on reset
            render();
            //}
        } else if (data.type === 'ballState') {
            players = data.pl.filter(p => p && p.pid);
            gameState.ball = data.b;
            gameState.ball.x = data.b.x;
            gameState.ball.y = data.b.y;
            gameState.ball.isMoving = data.b.m;
            console.log('Ball state updated:', gameState.ball);
            if (data.message) {
                messageCanvas.addMessage(data.message.text, data.message.type);
                console.log(`Processed message: ${data.message.text}, type: ${data.message.type}`);
            }
            gameState.playMode = data.m;
            gameRunning = data.r;
            ballColor = 'blue';
            toggleVibrateSound();
        } else {

            //== INITIAL
            const { s, p, r: serverRunning, pl: serverPlayers } = data;
            gameRunning = serverRunning !== undefined ? serverRunning : gameRunning;
            players = serverPlayers || players;
            clockSeconds = s !== undefined ? s : clockSeconds;
            playClock = p !== undefined ? p : playClock;
            toggleVibrateSound();
            //console.log('Received full state:');
            //console.log('>>> else Received full state:', JSON.stringify(data));
            //console.log(players.map(p => `${p.pid}: x=${p.x.toFixed(2)}, y=${p.y.toFixed(2)}, h=${p.h.toFixed(2)}`));
            //== END INITIAL
        }
        if (gameStarted) render();

    } catch (error) {
        console.error('Error processing WebSocket message:', error, msg.data);
    }
};

// *************************************************************************
// =================================== END WEBSOCKET - get message to server

function toggleVibrateSound() {
    // ============================================ TOGGLE VIBRATE SOUND ON/OFF
    if (gameRunning && !vibrateSound) { // ========TOGGLE SOUND ON/OFF
        startVibratingSound();
        vibrateSound = true;
        gameState.currentPlay = 'running';
    } else if (!gameRunning && vibrateSound) {
        stopVibratingSound();
        vibrateSound = false;
    }
    // ============================================ END TOGGLE VIBRATE SOUND ON/OFF
}


// Wrap send to track bytes - send message to server
const originalSend = ws.send.bind(ws);
ws.send = (data) => {
    bytesSent += new TextEncoder().encode(JSON.stringify(data)).length;
    originalSend(data);
};

// ==================================== END SERVER STUFF
// *** END SERVER things
// ====================================================



// ================================================== EVENT LISTENERS AND KEYS
// ** keys for game switch, reste and more


// ===================================== GAME SWITCH
// ** this is where the action starts
// ** send toggle to server.js to get things going
// =================================================
document.addEventListener('keydown', (e) => {
    // == Game Switch - start and stop the game
    if (e.code === 'Space' && gameState.playState !== 'gameover') {
        e.preventDefault();
        console.log('>>>Space key pressed');
        gameState.currentPlay = 'running';
        ws.send(JSON.stringify({ type: 'toggleGame', gameID }));
        // == Reset switch - reset game after plays
    } else if (e.code === 'KeyR' && gameState.currentPlay !== 'running') {
        e.preventDefault();
        ws.send(JSON.stringify({ type: 'reset', gameID }));
        // == Start a new game
    } else if (e.code === 'KeyQ') {
        e.preventDefault();
        ws.send(JSON.stringify({ type: 'restart', gameID }));
        // == Enable Pass Mode
    } else if (e.code === 'KeyP' && gameState.playState !== 'kickoff' && gameState.currentPlay === 'running') {
        e.preventDefault();
        showReceivers = true; //== show receivers
        console.log('gamestate:', gameState);
        messageCanvas.addMessage(`Right Click to Select Receiver`, 'info', 'duration=1000');
        ws.send(JSON.stringify({ type: 'passMode', gameID }));
        console.log('===Event press p - Pass mode toggled');
    } else if (e.code === 'KeyZ') {
        resetZoom();
    } else if (e.code === 'KeyT') {
        console.log('Vairables', gameState)
        console.log('Websocket', ws)
    }


});
// ====================================== END GAME SWITCH

// ====================================== MOUSE HOVER PLAYER CHECK

function getMouseYardCoords(mx, my) {
    const canvasX = mx - canvas.width / 2;
    const canvasY = my - canvas.height / 2;
    const yardX = pixelsToYards(canvasX / zoom - panX / zoom + yardsToPixels(FIELD_WIDTH / 2));
    const yardY = (FIELD_HEIGHT) - pixelsToYards(canvasY / zoom - panY / zoom + yardsToPixels(FIELD_HEIGHT / 2));
    return { x: yardX, y: yardY };
}

function resetZoom() {
    zoom = 1;
    panX = 0;
    panY = 0;
    fieldDirty = true;
    render();
}

function isMouseHoverPlayer(mx, my, p) {
    // 0) Quick side check
    const sideChar = gameState.mySide === 'home' ? 'h' : 'a';
    if (p.pid.split('-')[1] !== sideChar) return false;

    const { x: zoomedX, y: zoomedY } = getMouseYardCoords(mx, my);
    const px = yardsToPixels(p.x);
    const py = yardsToPixels(FIELD_HEIGHT - p.y) - yardsToPixels(baseHeight);
    const cosTheta = Math.cos(-p.h);
    const sinTheta = Math.sin(-p.h);
    const dx = yardsToPixels(zoomedX) - px;
    const dy = yardsToPixels(FIELD_HEIGHT - zoomedY) - yardsToPixels(baseHeight) - py;
    const localX = dx * cosTheta + dy * sinTheta;
    const localY = -dx * sinTheta + dy * cosTheta;
    const halfW = yardsToPixels(baseWidth) / 2;
    const halfH = yardsToPixels(baseHeight) / 2;
    const isHover = localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH;
    // if (isHover) {
    //     console.log(`Hover on ${p.i}: mx=${mx.toFixed(2)}, my=${my.toFixed(2)}, zoomedX=${zoomedX.toFixed(2)}, zoomedY=${zoomedY.toFixed(2)}, px=${px.toFixed(2)}, py=${py.toFixed(2)}, localX=${localX.toFixed(2)}, localY=${localY.toFixed(2)}`);
    // }
    return isHover;
}


// ===================================== Add ZOOM with mouse wheel
let adjustMode = false;
document.addEventListener('keydown', e => {
    if (e.key === 'x' || e.key === 'X') adjustMode = true;
});
document.addEventListener('keyup', e => {
    if (e.key === 'x' || e.key === 'X') adjustMode = false;
});
canvas.addEventListener('wheel', (e) => {
    if (adjustMode && hoveredPlayer) {
        e.preventDefault();

        // lookup the full player object
        const fullP = getGamePlayer(hoveredPlayer.pid);
        if (!fullP) return;

        // tweak this factor to taste
        const wheelFactor = 0.005;
        // deltaY > 0 means scrolling down → reduce speed
        fullP.speed = Math.max(0, fullP.speed - e.deltaY * wheelFactor);

        // send the statUpdate to the server
        ws.send(JSON.stringify({
            type: 'updateSpeed',
            gameID,
            playerID: fullP.pid,
            x: fullP.x,
            y: fullP.y,
            h: fullP.h,
            speed: fullP.speed    // new field
        }));
    } else if (isDraggingPlayer && selectedPlayer) {
        selectedPlayer.h += e.deltaY * 0.001;
        e.preventDefault(); // Prevent page scrolling while rotating
        ws.send(JSON.stringify({ // send to server to broadcast to all clients
            type: 'updatePosition',
            gameID,
            playerID: selectedPlayer.pid,
            x: selectedPlayer.x,
            y: selectedPlayer.y,
            h: selectedPlayer.h
        }));
    } else {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP; // Scroll down: zoom out, up: zoom in
        zoom = Math.min(Math.max(zoom + delta, ZOOM_MIN), ZOOM_MAX); // Clamp zoom
        fieldDirty = true;
    }
    render(); // Redraw with new zoom
});

// =============================================Add drag panning of FIELD
// ============================================= MOUSE DOWN
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
    const sideChar = gameState.mySide === 'home' ? 'h' : 'a'; // pick whos side im on
    const myPlayers = players.filter(p => {
        // if your player objects already have a .side property:
        // return p.side === mySide;

        // otherwise split the pid, e.g. "abcdef-h-03"
        return p.pid.split('-')[1] === sideChar;
    });
    const candidateSet = (hoveredPlayer && hoveredPlayer.pid.split('-')[1] === sideChar)
        ? [hoveredPlayer]
        : myPlayers;
    selectedPlayer = candidateSet.find(p => isMouseHoverPlayer(mx, my, p)) || null;
    // Use hoveredPlayer.i if valid, otherwise check all players
    // selectedPlayer = hoveredPlayer && isMouseHoverPlayer(mx, my, hoveredPlayer) ?
    //     players.find(p => p.pid === hoveredPlayer.pid) :
    //     players.find(p => isMouseHoverPlayer(mx, my, p));
    //console.log(`Selected player: ${selectedPlayer ? selectedPlayer.pid : 'none'}`);
    if (selectedPlayer && !gameRunning) {
        if (e.button === 2 && showReceivers) {    // == right click to select receiver if P clicked
            e.preventDefault();
            selectedPlayerR = selectedPlayer.pid;
            gameState.dragStart = { x: gameState.ball.x, y: gameState.ball.y };
            gameState.dragCurrent = getMouseYardCoords(mx, my);
            ws.send(JSON.stringify({ // send to server to broadcast to all clients
                type: 'passMode',
                selectedPlayerR: selectedPlayerR
            }));
            console.log('Selected player for pass:', selectedPlayerR);
            console.log('dragStart:', gameState.dragStart.x, gameState.dragStart.y);
            //lastMouseX = mx;
        } else if (e.button === 0 && selectedPlayerR) { // == left click to adjust dial
            isDraggingBand = true;
        } else if (e.button === 2 && gameState.currentPlay !== 'running') { // == left click to drag player
            selectedPlayerDial = selectedPlayer.pid
            isAdjustingDial = true;
            console.log('Selected player for dial adjustment:', selectedPlayerR);
            render();
        } else {
            isDraggingPlayer = true;
            isRotatePlayer = true;
            //console.log('Selected player:', selectedPlayer.pid);
        }
    } else {
        isDraggingField = true;
        lastMouseX = mx;
        lastMouseY = my;
    }

    if (e.button === 1) {
        zoom = 1;
        panX = 0;
        panY = 0;
        fieldDirty = true;
        render();
    }
});
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Prevent browser context menu
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
    const now = performance.now();
    if (!gameRunning && now - lastHoverCheck >= HOVER_CHECK_INTERVAL) {
        hoveredPlayer = players.find(p => isMouseHoverPlayer(mx, my, p)) || null;
        //console.log(`Hovered player: ${hoveredPlayer ? hoveredPlayer.pid : 'none'}`);
        lastHoverCheck = now;
    }
    if (isAdjustingDial && selectedPlayer) {
        const dx = mx - lastMouseX;
        const dialChange = dx * 0.5;
        selectedPlayer.d = Math.max(0, Math.min(100, selectedPlayer.d + dialChange));
        ws.send(JSON.stringify({
            type: 'updateDial',
            gameID,
            playerID: selectedPlayer.i,
            dialValue: selectedPlayer.d
        }));
        lastMouseX = mx;
    } else if (isDraggingPlayer && selectedPlayer && gameState.currentPlay !== 'running') {
        const { x: yardX, y: yardY } = getMouseYardCoords(mx, my);
        //console.log(`Dragging player: ${selectedPlayer.pid} to (${yardX.toFixed(2)}, ${yardY.toFixed(2)})`);
        selectedPlayer.x = Math.max(3, Math.min(135, yardX));
        selectedPlayer.y = Math.max(3, Math.min(77, yardY));
        ws.send(JSON.stringify({ // send to server to broadcast to all clients
            type: 'updatePosition',
            gameID,
            playerID: selectedPlayer.pid,
            x: selectedPlayer.x,
            y: selectedPlayer.y,
            //h: selectedPlayer.h
        }));
    } else if (isDraggingField) {
        const dx = mx - lastMouseX;
        const dy = my - lastMouseY;
        panX += dx;
        panY += dy;
        lastMouseX = mx;
        lastMouseY = my;
        fieldDirty = true;
    } else if (selectedPlayerR) {
        gameState.dragCurrent = getMouseYardCoords(mx, my);
    }

    if (gameStarted) render();
});

canvas.addEventListener('mouseup', () => {
    // == let go of band and throw pass
    if (isDraggingBand) {
        isDraggingBand = false;
        const dx = gameState.dragStart.x - gameState.dragCurrent.x;
        const dy = gameState.dragStart.y - gameState.dragCurrent.y;
        const angle = Math.atan2(dy, dx);
        const power = Math.min(Math.hypot(dx, dy), 200) * 0.15;
        const ballx = gameState.dragStart.x;
        const bally = gameState.dragStart.y;
        const ballvx = Math.cos(angle) * power;
        const ballvy = Math.sin(angle) * power;
        showReceivers = false; //== stop highlighting receivers
        selectedPlayerR = null;
        ws.send(JSON.stringify({
            type: 'passMoving',
            ballx: gameState.dragStart.x,
            bally: gameState.dragStart.y,
            balldx: dx,
            balldy: dy,
            ballvx: ballvx,
            ballvy: ballvy,
            selectedPlayerR: selectedPlayerR
        }));
        messageCanvas.addMessage(`TEAM just threw a pass`, 'info');
        console.log(`Pass thrown with angle: ${angle.toFixed(2)}, power: ${power.toFixed(2)}`);
        console.log('=======pass variables', ballx, bally, dx, dy, ballvx, ballvy);
    }
    isDraggingField = false;
    isDraggingPlayer = false;
    isAdjustingDial = false;
    selectedPlayer = null;
});

canvas.addEventListener('mouseleave', () => {
    isDraggingField = false;
    isDraggingPlayer = false;
    isAdjustingDial = false;
    selectedPlayer = null;
    hoveredPlayer = null;
    if (gameStarted) render();
});

// ********************
// ===================================================== END EVENT LISTENERS

// =============================================== DIAL FOR ADJUSTING PLAYER
// **** could go to seperate file??

function drawLargeDialOverlay(player) {
    ctx.save();
    ctx.translate(yardsToPixels(player.x), yardsToPixels(FIELD_HEIGHT - player.y));
    ctx.rotate(-player.h);

    let normalDialRadius = Math.min(yardsToPixels(baseWidth), yardsToPixels(baseHeight)) * 0.45;
    let largeDialRadius = normalDialRadius * 3;

    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, largeDialRadius, 0, Math.PI * 2);
    ctx.fillStyle = player.dc || 'yellow';
    ctx.fill();
    ctx.closePath();

    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, 0, largeDialRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();

    let dialIndicatorAngle = ((player.d - 50) / 50) * (Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(largeDialRadius * Math.cos(dialIndicatorAngle), largeDialRadius * Math.sin(dialIndicatorAngle));
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
    ctx.globalAlpha = 1;
}
// =============================== END DIAL FOR ADJUSTING PLAYER

// ===================================================== START DRAWING EVERYTHING

// =======================================DRAW A FOOTBALL FIELD
function drawField() {
    //console.log('Drawing field... drawField()');
    fieldCtx.clearRect(0, 0, fieldCanvas.width, fieldCanvas.height);
    fieldCtx.save();
    fieldCtx.translate(fieldCanvas.width / 2, fieldCanvas.height / 2);
    fieldCtx.scale(zoom, zoom);
    fieldCtx.translate(-yardsToPixels(FIELD_WIDTH / 2) + panX / zoom, -yardsToPixels(FIELD_HEIGHT / 2) + panY / zoom);

    // Draw entire canvas (border)
    fieldCtx.fillStyle = '#222';
    fieldCtx.fillRect(0, 0, yardsToPixels(FIELD_WIDTH), yardsToPixels(FIELD_HEIGHT));

    // Draw left end zone (x: 10-20, y: 8.5-71.5)
    fieldCtx.fillStyle = homeEndZoneColor;
    fieldCtx.fillRect(
        yardsToPixels(PLAYABLE_X_OFFSET),
        yardsToPixels(PLAYABLE_Y_OFFSET),
        yardsToPixels(10),
        yardsToPixels(PLAYABLE_HEIGHT)
    );

    // Draw main field (x: 20-120, y: 8.5-71.5)
    fieldCtx.fillStyle = '#228B22';
    fieldCtx.fillRect(
        yardsToPixels(PLAYABLE_X_OFFSET + 10),
        yardsToPixels(PLAYABLE_Y_OFFSET),
        yardsToPixels(100),
        yardsToPixels(PLAYABLE_HEIGHT)
    );

    // Draw right end zone (x: 120-130, y: 8.5-71.5)
    fieldCtx.fillStyle = awayEndZoneColor;
    fieldCtx.fillRect(
        yardsToPixels(PLAYABLE_X_OFFSET + 110),
        yardsToPixels(PLAYABLE_Y_OFFSET),
        yardsToPixels(10),
        yardsToPixels(PLAYABLE_HEIGHT)
    );

    // ================================ DRAW NAMES IN END ZONE
    // Draw team names in end zones
    fieldCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    fieldCtx.font = `${yardsToPixels(8)}px ITC Machine`; // 8-yard text height
    fieldCtx.textAlign = 'center';
    fieldCtx.textBaseline = 'middle';
    // Home team (left end zone, x=15, y=40, rotated 90° counterclockwise)
    fieldCtx.save();
    fieldCtx.translate(yardsToPixels(PLAYABLE_X_OFFSET + 5), yardsToPixels(PLAYABLE_Y_OFFSET + PLAYABLE_HEIGHT / 2));
    fieldCtx.rotate(-Math.PI / 2); // 90° counterclockwise
    fieldCtx.fillText(homeTeamName, 0, 0);
    fieldCtx.restore();
    // Away team (right end zone, x=125, y=40, rotated 270° counterclockwise)
    fieldCtx.save();
    fieldCtx.translate(yardsToPixels(PLAYABLE_X_OFFSET + PLAYABLE_WIDTH - 5), yardsToPixels(PLAYABLE_Y_OFFSET + PLAYABLE_HEIGHT / 2));
    fieldCtx.rotate(Math.PI / 2); // 270° counterclockwise (90° clockwise)
    fieldCtx.fillText(awayTeamName, 0, 0);
    fieldCtx.restore();

    // Draw logo at center (x=70, y=40)
    if (logoImage.complete && logoImage.naturalWidth > 0) {
        fieldCtx.globalAlpha = 0.7;
        const logoWidth = yardsToPixels(20); // 20 yards wide
        const logoHeight = logoWidth * (logoImage.naturalHeight / logoImage.naturalWidth); // Maintain aspect ratio
        fieldCtx.drawImage(
            logoImage,
            yardsToPixels(PLAYABLE_X_OFFSET + PLAYABLE_WIDTH / 2 - 10), // Center at x=70
            yardsToPixels(PLAYABLE_Y_OFFSET + PLAYABLE_HEIGHT / 2 - logoHeight / (2 * pixelsPerYard) / zoom), // Center at y=40
            logoWidth,
            logoHeight
        );
        fieldCtx.globalAlpha = 1.0;
    }


    // ========================================================================= FIX
    //  FIX THIS  VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
    // ** FIX GET THE CORRECT FIELD DIMENSIONS
    // ** NEED to check exact field dimension and get everything right.
    // ** maybe a box around it to define

    // Draw box around playable field (0.5-yard width, inner edge on border)
    fieldCtx.strokeStyle = 'white';
    fieldCtx.lineWidth = yardsToPixels(1);
    fieldCtx.beginPath();
    fieldCtx.strokeRect(
        yardsToPixels(PLAYABLE_X_OFFSET - 0.5), // Inner edge at x=10
        yardsToPixels(PLAYABLE_Y_OFFSET - 0), // Inner edge at y=8.5
        yardsToPixels(PLAYABLE_WIDTH + 0.5), // Width to x=130.25
        yardsToPixels(PLAYABLE_HEIGHT + 0.5) // Height to y=71.75
    );
    fieldCtx.stroke();


    // draw field goals
    // ======================== left field goal
    fieldCtx.beginPath();
    fieldCtx.moveTo(yardsToPixels(PLAYABLE_X_OFFSET + 0), yardsToPixels(35));
    // fieldCtx.lineWidth = yardsToPixels(2); ==============work on shadow
    // fieldCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    // fieldCtx.lineTo(yardsToPixels(PLAYABLE_X_OFFSET + 0), yardsToPixels(45));
    fieldCtx.lineWidth = yardsToPixels(.3);
    fieldCtx.strokeStyle = 'yellow';
    fieldCtx.lineTo(yardsToPixels(PLAYABLE_X_OFFSET + 0), yardsToPixels(45));
    fieldCtx.stroke();
    // ======================== right field goal
    fieldCtx.beginPath();
    fieldCtx.moveTo(yardsToPixels(PLAYABLE_X_OFFSET + 120), yardsToPixels(35));
    // fieldCtx.lineWidth = yardsToPixels(2); ==============work on shadow
    // fieldCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    // fieldCtx.lineTo(yardsToPixels(PLAYABLE_X_OFFSET + 0), yardsToPixels(45));
    fieldCtx.lineWidth = yardsToPixels(.3);
    fieldCtx.strokeStyle = 'yellow';
    fieldCtx.lineTo(yardsToPixels(PLAYABLE_X_OFFSET + 120), yardsToPixels(45));
    fieldCtx.stroke();

    // Draw 5-yard lines (x: 10 to 130, every 5 yards)
    fieldCtx.strokeStyle = 'white';
    fieldCtx.lineWidth = yardsToPixels(0.1);
    fieldCtx.globalAlpha = 0.8;
    fieldCtx.beginPath();
    for (let x = PLAYABLE_X_OFFSET + 10; x <= PLAYABLE_X_OFFSET + PLAYABLE_WIDTH - 10; x += 5) {
        fieldCtx.moveTo(yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET));
        fieldCtx.lineTo(yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET + PLAYABLE_HEIGHT));
    }
    fieldCtx.stroke();

    // Draw 1-yard hash ticks (every yard, top/bottom end lines)
    fieldCtx.lineWidth = yardsToPixels(0.1);
    fieldCtx.beginPath();
    for (let x = PLAYABLE_X_OFFSET + 10; x <= PLAYABLE_X_OFFSET + PLAYABLE_WIDTH - 10; x += 1) {
        // Top (y=8.5)
        fieldCtx.moveTo(yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET));
        fieldCtx.lineTo(yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET + 1));
        fieldCtx.moveTo(yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET + 25));
        fieldCtx.lineTo(yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET + 26));
        // Bottom (y=71.5)
        fieldCtx.moveTo(yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET + PLAYABLE_HEIGHT - 25));
        fieldCtx.lineTo(yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET + PLAYABLE_HEIGHT - 26));
        fieldCtx.moveTo(yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET + PLAYABLE_HEIGHT - 1));
        fieldCtx.lineTo(yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET + PLAYABLE_HEIGHT));
    }
    fieldCtx.stroke();


    // Draw yardage numbers (10, 20, 30, 40, 50, 40, 30, 20, 10)
    fieldCtx.fillStyle = 'white';
    fieldCtx.font = `${yardsToPixels(3)}px Varsity Regular`;
    fieldCtx.textAlign = 'center';
    const numbers = [10, 20, 30, 40, 50, 40, 30, 20, 10];
    const xPositions = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110];
    for (let i = 0; i < numbers.length; i++) {
        const x = PLAYABLE_X_OFFSET + xPositions[i];
        // Top (y=28.5, 20 yards from top edge at y=8.5, rotated 180°)
        fieldCtx.save();
        fieldCtx.translate(yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET + 10));
        fieldCtx.rotate(Math.PI); // Rotate 180° for top numbers
        fieldCtx.fillText(numbers[i], 0, 0);
        fieldCtx.restore();
        // Bottom (y=51.5, 20 yards from bottom edge at y=71.5, upright)
        fieldCtx.fillText(numbers[i], yardsToPixels(x), yardsToPixels(PLAYABLE_Y_OFFSET + PLAYABLE_HEIGHT - 10));
    }
    fieldCtx.globalAlpha = 1.0;


    // ====== DRAW LOS AND OTHER MARKERS
    // ===DRAW LINE OF SCRIMMAGE LOS
    //console.log('gameState.los', gameState.los);
    if (gameState.los !== null) {
        fieldCtx.strokeStyle = "black";
        fieldCtx.globalAlpha = 0.7;
        fieldCtx.lineWidth = 3;
        fieldCtx.beginPath();
        fieldCtx.moveTo(yardsToPixels(gameState.los), yardsToPixels(PLAYABLE_Y_OFFSET + PLAYABLE_HEIGHT));
        fieldCtx.lineTo(yardsToPixels(gameState.los), PLAYABLE_HEIGHT);
        fieldCtx.stroke();
    }
    // Draw first-down line if set
    if (gameState.firstDownLine !== null) {
        fieldCtx.strokeStyle = "yellow";
        fieldCtx.globalAlpha = 0.5;
        fieldCtx.lineWidth = 3;
        fieldCtx.beginPath();
        fieldCtx.moveTo(yardsToPixels(gameState.firstDownLine), yardsToPixels(PLAYABLE_Y_OFFSET + PLAYABLE_HEIGHT));
        fieldCtx.lineTo(yardsToPixels(gameState.firstDownLine), PLAYABLE_HEIGHT);
        fieldCtx.stroke();
    }

    fieldCtx.restore();
}

// ======================================= END DRAW A FOOTBALL FIELD

// ======================================= DRAW A FOOTBALL
function drawBall() {
    if (!gameState.ball) return;
    gameState.ball.trail = gameState.ball.trail || [];
    gameState.ball.rotation = gameState.ball.rotation || 0;

    let scale = 1;
    if (gameState.ball.isMoving) {
        gameState.ball.rotation += gameState.ball.vx * 0.02;
        gameState.ball.trail.push({ x: gameState.ball.x, y: gameState.ball.y });
        if (gameState.ball.trail.length > 20) gameState.ball.trail.shift();
        const speed = Math.hypot(gameState.ball.vx, gameState.ball.vy);
        const maxSpeed = 1; // Adjusted for yard units
        const pct = Math.min(speed / maxSpeed, 1);
        scale = 1 + pct * 0.9;
        console.log('Ball speed:', speed, 'pct:', pct, 'scale:', scale);
    }

    ctx.save();
    for (let i = 0; i < gameState.ball.trail.length; i++) {
        const p = gameState.ball.trail[i];
        const alpha = ((i + 1) / gameState.ball.trail.length) * 0.4;
        ctx.fillStyle = `rgba(165,42,42,${alpha})`;
        ctx.beginPath();
        ctx.arc(yardsToPixels(p.x), yardsToPixels(FIELD_HEIGHT - p.y), 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(yardsToPixels(gameState.ball.x), yardsToPixels(FIELD_HEIGHT - gameState.ball.y));
    ctx.rotate(gameState.ball.rotation);
    ctx.scale(scale, scale);
    ctx.fillStyle = "brown";
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
}

function drawBand(ctx, start, endRaw, opts = {}) {
    console.log('Drawing band...');
    const { maxDist = 100, tickSpacing = 10, tickLen = 6, color = 'white', lineWidth = 2, tickWidth = 1 } = opts;
    const dx = endRaw.x - start.x;
    const dy = endRaw.y - start.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) return;

    const ux = dx / dist;
    const uy = dy / dist;
    const drawDist = Math.min(dist, maxDist);
    const ex = start.x + ux * drawDist;
    const ey = start.y + uy * drawDist;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = tickWidth;
    const numTicks = Math.floor(drawDist / tickSpacing);
    const px = -uy;
    const py = ux;

    for (let i = 1; i <= numTicks; i++) {
        const t = i * tickSpacing;
        const tx = start.x + ux * t;
        const ty = start.y + uy * t;
        ctx.beginPath();
        ctx.moveTo(tx + px * tickLen, ty + py * tickLen);
        ctx.lineTo(tx - px * tickLen, ty - py * tickLen);
        ctx.stroke();
    }
}

// ====================================== DRAW PLAYER INFO ON HOVER IF TOGGLEED
// helper to get match players with gameState.players
function getGamePlayer(pid) {
    return gameState.players.find(p => p.pid === pid);
}


function drawPlayerHover(ctx, p, baseWidth, baseHeight, showPlayerInfo) {
    // If `p` came from a secondary array, pull the full data:
    const fullP = getGamePlayer(p.pid) || p;

    const px = yardsToPixels(baseWidth);
    const py = yardsToPixels(baseHeight);

    // 1) highlight box
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = yardsToPixels(0.2);
    ctx.strokeRect(-px / 2, -py / 2, px, py);

    if (!showPlayerInfo) return;

    // 2) Draw the tooltip upright by undoing the player rotation
    ctx.save();
    ctx.rotate(-p.h);

    //const fullP = getGamePlayer(p.pid) || p;
    const speedStr = typeof fullP.speed === 'number' ? fullP.speed.toFixed(1) : '0.0';
    const strStr = typeof fullP.mass === 'number' ? fullP.mass.toFixed(1) : '0.0';
    //const massStr = typeof fullP.mass === 'number' ? fullP.mass.toFixed(1) : '0.0';

    const lines = [
        fullP.name,
        `ID:       ${fullP.pid}`,
        `Speed:    ${speedStr}`,
        `Strength: ${strStr}`,
    ];

    // 3) styling…
    const fontSize = yardsToPixels(0.8);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 4) measure maximum line width
    const padding = yardsToPixels(0.2);
    let maxWidth = lines.reduce((w, line) => {
        const m = ctx.measureText(line).width;
        return m > w ? m : w;
    }, 0);
    const totalHeight = lines.length * fontSize + (lines.length - 1) * padding;

    // 5) background position above player
    const boxX = -maxWidth / 2 - padding;
    const boxY = -py / 2 - totalHeight - 2 * padding;

    // 6) draw background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(boxX, boxY, maxWidth + 2 * padding, totalHeight + 2 * padding);

    // 7) draw lines
    ctx.fillStyle = 'white';
    lines.forEach((line, idx) => {
        const y = boxY + padding + idx * (fontSize + padding);
        ctx.fillText(line, boxX + padding, y);
    });

    ctx.restore();
}


// =============== PLayer bases
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

function strokeRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
}

function renderGame() {
    //console.log('Rendering stopped... renderStopped()');
    const startTime = performance.now();
    if (fieldDirty) {
        drawField();
        fieldDirty = false;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(fieldCanvas, 0, 0);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-yardsToPixels(FIELD_WIDTH / 2) + panX / zoom, -yardsToPixels(FIELD_HEIGHT / 2) + panY / zoom);

    players.forEach(p => {
        ctx.save();
        ctx.translate(yardsToPixels(p.x), yardsToPixels(FIELD_HEIGHT - p.y));
        ctx.rotate(-p.h);
        ctx.fillStyle = p === selectedPlayer && isDraggingPlayer ? 'yellow' : (p.pid.includes('-h-') ? gameState.homeTeamColor : gameState.awayTeamColor);
        //ctx.fillStyle = p.pid === isDraggingPlayer ? "yellow" : this.baseColor;
        ctx.fillRect(-yardsToPixels(baseWidth) / 2, -yardsToPixels(baseHeight) / 2, yardsToPixels(baseWidth), yardsToPixels(baseHeight));
        // drawRoundedRect(
        //     ctx,
        //     -yardsToPixels(p.baseWidth) / 2,
        //     -yardsToPixels(p.baseHeight) / 2,
        //     yardsToPixels(p.baseWidth),
        //     yardsToPixels(p.baseHeight),
        //     yardsToPixels(0.5) // Radius in yards, converted to pixels
        // );
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = yardsToPixels(0.2);
        // strokeRoundedRect(
        //     ctx,
        //     -yardsToPixels(p.baseWidth) / 2,
        //     -yardsToPixels(p.baseHeight) / 2,
        //     yardsToPixels(p.baseWidth),
        //     yardsToPixels(p.baseHeight),
        //     yardsToPixels(0.5)
        // );
        ctx.strokeRect(-yardsToPixels(baseWidth) / 2, -yardsToPixels(baseHeight) / 2, yardsToPixels(baseWidth), yardsToPixels(baseHeight));
        // if (p === hoveredPlayer) {
        //     ctx.strokeStyle = 'yellow';
        //     ctx.lineWidth = yardsToPixels(0.2);
        //     ctx.strokeRect(-yardsToPixels(baseWidth) / 2, -yardsToPixels(baseHeight) / 2, yardsToPixels(baseWidth), yardsToPixels(baseHeight));
        // }
        if (p === hoveredPlayer) {
            drawPlayerHover(ctx, p, baseWidth, baseHeight, showPlayerInfo);
        }
        if (p.pid === selectedPlayerR) {
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = yardsToPixels(0.4);
            ctx.strokeRect(-yardsToPixels(baseWidth) / 2, -yardsToPixels(baseHeight) / 2, yardsToPixels(baseWidth), yardsToPixels(baseHeight));
        }
        const image = p.pid.includes('-h-') ? homeImage : awayImage;
        if (image.complete) {
            ctx.drawImage(image, -yardsToPixels(baseWidth) / 2, -yardsToPixels(baseHeight) / 2, yardsToPixels(baseWidth), yardsToPixels(baseHeight));
        }
        if (p.hb) {
            ctx.fillStyle = ballColor;
            ctx.beginPath();
            ctx.arc(yardsToPixels(0), yardsToPixels(0), yardsToPixels(0.5), 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"; // highlight with 50% opacity
            ctx.lineWidth = 3;
            ctx.strokeRect(-yardsToPixels(baseWidth) / 2, -yardsToPixels(baseHeight) / 2, yardsToPixels(baseWidth), yardsToPixels(baseHeight));
        }
        // ======================== Highlight eligible player for pass
        if (gameState.playMode === 1 && p.ie === true && showReceivers) {
            //console.log('highlight isEligible', p.ie);
            ctx.strokeStyle = "rgba(136, 255, 0, 0.9)"; // highlight with 50% opacity
            ctx.lineWidth = 2;
            ctx.strokeRect(-yardsToPixels(baseWidth) / 2, -yardsToPixels(baseHeight) / 2, yardsToPixels(baseWidth), yardsToPixels(baseHeight));
        }
        if (isAdjustingDial && p.pid === selectedPlayerDial) {
            console.log('Drawing dial for player:', p.pid);
            drawLargeDialOverlay(p);
        }
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = yardsToPixels(0.1);
        ctx.beginPath();
        const steeringAngle = ((p.dv - 50) / 50) * 0.2;
        ctx.arc(0, 0, yardsToPixels(0.5), -steeringAngle - Math.PI / 4, -steeringAngle + Math.PI / 4);
        ctx.stroke();
        ctx.restore();

        // Add x, y coordinates above base
        // ctx.fillStyle = 'white';
        // ctx.font = `${yardsToPixels(1)}px Arial`;
        // ctx.textAlign = 'center';
        // ctx.fillText(`(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`, yardsToPixels(p.x), yardsToPixels(FIELD_HEIGHT - p.y) - yardsToPixels(baseWidth));
        // ctx.textAlign = 'left';
    });




    // ===================================== SHOW MEASURMENTS
    const endTime = performance.now();
    renderTimes.push(endTime - startTime);
    if (renderTimes.length > 60) renderTimes.shift();
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    frameCount++;
    const now = performance.now();
    if (now - lastFrameTime >= 1000) {
        fps = frameCount * 1000 / (now - lastFrameTime);
        frameCount = 0;
        lastFrameTime = now;
    }

    // Convert mouse coordinates to yards
    //const canvasX = mx - canvas.width / 2;
    //const canvasY = my - canvas.height / 2;
    const yardX = pixelsToYards(mx);
    const yardY = pixelsToYards(my);

    // Draw yard coordinates
    // ctx.fillStyle = 'white';
    // ctx.font = `${yardsToPixels(baseHeight)}px Arial`;
    // ctx.fillText(formatClock(gameState.gameClock), yardsToPixels(5), yardsToPixels(FIELD_HEIGHT - 13));
    // ctx.fillText(`FPS: ${fps.toFixed(1)} Render: ${avgRenderTime.toFixed(2)}ms Data: ${(bytesSent / 1024).toFixed(2)}KB sent, ${(bytesReceived / 1024).toFixed(2)}KB received, ${lastMessageBytes.toFixed(2)}KB/tick`, yardsToPixels(5), yardsToPixels(FIELD_HEIGHT - 9));
    // ctx.fillText(`Game: ${gameRunning ? 'Running' : 'Paused'} Zoom: ${zoom.toFixed(2)} Mouse: (${mx.toFixed(0)}, ${my.toFixed(0)}) Yards: (${yardX.toFixed(2)}, ${yardY.toFixed(2)})`, yardsToPixels(5), yardsToPixels(FIELD_HEIGHT - 5));

    // Draw band in passMode
    if (gameState.playMode === 1 && isDraggingBand) {
        console.log('Rendering band: dragStart=', gameState.dragStart, 'dragCurrent=', gameState.dragCurrent);
        drawBand(ctx,
            { x: yardsToPixels(gameState.dragStart.x), y: yardsToPixels(FIELD_HEIGHT - gameState.dragStart.y) },
            { x: yardsToPixels(gameState.dragCurrent.x), y: yardsToPixels(FIELD_HEIGHT - gameState.dragCurrent.y) },
            {
                maxDist: yardsToPixels(12),
                tickSpacing: yardsToPixels(1),
                tickLen: yardsToPixels(0.3),
                color: 'yellow',
                lineWidth: 2,
                tickWidth: 1
            }
        );
        console.log('Drawing band done');
    }
    if (gameState.ball.isMoving) {
        console.log('Ball is moving');
        drawBall();
    }


    ctx.restore();
}

// =============================== RENDER FOR GAME RUNNING OR GAME STOPPED
function render() {
    if (gameRunning) {
        renderGame();
    } else {
        renderGame();
        messageCanvas.render();
    }
}
