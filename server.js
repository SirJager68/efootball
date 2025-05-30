// ================================== server.js
console.log('****************************************')
console.log('********* ELECTRIK FOOTBALL ************')
console.log('********* SERVER.JS START   ************')
console.log('****************************************')
console.log('** started ', new Date().toLocaleString());
console.log('****************************************')
console.log('server.js loading....');

// ================= SETUP WEBSOCKET USING type commonjs from package-json
// ================= SERVER SETUP
// Setup Express and WebSocket
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const { SpatialGrid, detectAndResolveCollisionRectangles, getRectangleVertices, tackle } = require('./public/js/physics');
const plays = require('./public/js/plays.js');

// Create Express app
const app = express();
app.use(express.static('public')); // Serve static files
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/game.html', (req, res) => res.sendFile(__dirname + '/game.html')); // Serve game.html

// Create HTTP server for Express
const server = http.createServer(app);

// Setup WebSocket server
// const wss = process.env.NODE_ENV === 'production'
//     ? new WebSocketServer({ server }) // Heroku: Share port with Express
//     : new WebSocketServer({ port: 8080 }); // Local: WebSocket on 8080
// new: use the same HTTP server for WS in all cases
const wss = new WebSocketServer({ server });


const PORT = process.env.NODE_ENV === 'production' ? process.env.PORT : 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
// ======================================= END SERVER SEUP

// ======================================= CREATE GAME ID
// ** create id based on date
function generateGameId() {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2); // e.g., "25" for 2025
    const month = String(now.getMonth() + 1).padStart(2, '0'); // e.g., "05" for May
    const day = String(now.getDate()).slice(-2).padStart(2, '0'); // e.g., "15" for 15
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let random = '';
    for (let i = 0; i < 3; i++) {
        random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const id = `${year}${month}${random}`; // e.g., "2505agk
    console.log('****************************************')
    console.log(`Generated game ID: ${id}`);
    console.log('****************************************')
    return id;
}

// ======================================= MAKE PLAYER TOKEN FOR CLIENTS
const crypto = require('crypto');

function makePlayerToken() {
    // 8 bytes → 16 hex chars
    return crypto.randomBytes(8).toString('hex');
}

// ======================================= GET THE TEAMS PLAYBOOKS
// ** offense and def. maybe come from database
// ===================== GET HOME PLAYBOOK
let offensivePlaysHome = {};
let defensivePlaysHome = {};
try {
    const playsModuleHome = require('./public/js/playbookHome.js');
    if (playsModuleHome) {
        offensivePlaysHome = playsModuleHome.offensivePlays;
        defensivePlaysHome = playsModuleHome.defensivePlays;
        console.log('Successfully imported offensivePlays Home Team:', Object.keys(offensivePlaysHome));
    } else {
        console.error('plays.js does not export offensivePlays');
    }
} catch (error) {
    console.error('Failed to import plays.js:', error.message);
    console.error('Ensure plays.js exists at C:\\Users\\jager\\Documents\\CODE\\HAL9001\\electrikfootball\\plays.js');
}
// ======================== GET AWAY PLAYBOOK
let offensivePlaysAway = {};
let defensivePlaysAway = {};
try {
    const playsModuleAway = require('./public/js/playbookAway.js');
    if (playsModuleAway) {
        offensivePlaysAway = playsModuleAway.offensivePlays;
        defensivePlaysAway = playsModuleAway.defensivePlays;
        console.log('Successfully imported offensivePlays Away Team:', Object.keys(playsModuleAway));
    } else {
        console.error('plays.js does not export offensivePlays');
    }
} catch (error) {
    console.error('Failed to import plays.js:', error.message);
    console.error('Ensure plays.js exists at C:\\Users\\jager\\Documents\\CODE\\HAL9001\\electrikfootball\\plays.js');
}


// Field constants (mirroring main.js)
const FIELD_WIDTH = 140;
const FIELD_HEIGHT = 80; // 53.33 yards
const PLAYABLE_WIDTH = 120;
const midlineY = FIELD_HEIGHT / 2; // 70 yards
const PLAYABLE_X_OFFSET = 10; // Left boundary
const PLAYABLE_Y_OFFSET = 8.5; // Bottom boundary
const FIELD_X_OFFSET = 20; // Left boundary

// ===Define static LOS
let losYardLine = 60;
let firstDownYardLine = 70; // 10 yards from LOS
let message = null; // Message to broadcast
let rightEndZone = 120; // Right end zone
let leftEndZone = 20; // Left end zone
let isTouchDown = false; // Flag for touchdown detection
let touchdownDetected = false; // Flag for touchdown detection
let clockDuration = 60;
let timeExpired = false; // Flag for time expired

let ballx = 0;
let bally = 0;
let balldx = 0;
let balldy = 0;
let ballvx = 0;
let ballvy = 0;
let selectedPlayerR = null; // Selected player for dragging

// ======================== GAME STATE
// ** onitial game state setup
const initialGameState = {
    id: generateGameId(),
    clock: { s: clockDuration },
    qtr: 1,
    playclock: 45,
    down: 1,
    losYardLine: 85,
    firstDownYardLine: 70,
    yardsToGo: 10,
    gameRunning: false,
    clockRunning: false,
    playClockRunning: false,
    playState: 'kickoff', // normal, kickoff, punt
    passMode: false,
    kickMode: false,
    playMode: 0, // 0 = normal, 1 = pass, 2 = kick
    currentPlay: null,
    clients: new Set(),
    possession: 'home', // 'home' or 'away'
    offenseDirection: 'right', // initial offensedirection
    homeTeamName: 'REDSKINS',
    awayTeamName: 'DALLAS',
    homeSide: 0, // home team side going right
    awaySide: Math.PI, // away team side going left
    homeTD: rightEndZone,
    awayTD: leftEndZone,
    losDirection: 1, // 1 for right, -1 for left
    homeScore: 0,
    awayScore: 0,
    gameStart: false,
    gameSpeed: .8, // Speed multiplier for game speed (at basespeed)
    ball: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        isMoving: false,
        rotation: 0,
        trail: []
    }
};
// ** id will be replaced with generated gameid from nanoId
// ** clock will be setup in a setup screen
const game = { ...initialGameState, clients: new Set() };
console.log(`Game initialized with ID: ${game.id}`);

// ======================================================= GET ROSTERS
// ** work from here to build
const homeTeam = require('./public/js/homeTeam.js');
const awayTeam = require('./public/js/awayTeam.js');
const { time } = require('console');
const { type } = require('os');
// =========================================== GET PLAYBOOKS
// Function to select plays based on possession
function selectPlays(possession) {
    let playHome, playAway;
    if (possession === 'home') {
        if (game.playState === 'kickoff') {
            playHome = offensivePlaysHome["Kickoff Return"] || hardcodedFormation;
            playAway = defensivePlaysAway["Kickoff"] || hardcodedFormation;
        } else {
            playHome = offensivePlaysHome["Red - Shotgun"] || hardcodedFormation;
            playAway = defensivePlaysAway["4-3-Standard"] || hardcodedFormation;
        }
        console.log(' playbook - home is on the offense');
    } else {
        if (game.playState === 'kickoff') {
            playHome = defensivePlaysHome["Kickoff"] || hardcodedFormation;
            playAway = offensivePlaysAway["Kickoff Return"] || hardcodedFormation;
        } else {
            playHome = defensivePlaysHome["4-3-Standard"] || hardcodedFormation;
            playAway = offensivePlaysAway["I-Formation"] || hardcodedFormation;
        }
        console.log('plays' + playHome)
    }

    // figure out direction and heading of teams based on possession
    if (game.possession === 'home' && game.homeSide === 0) {
        game.losDirection = 1; // Home team is on the left going right
        game.homeSide = 0; //swap heading
        game.awaySide = Math.PI;
        game.homeTD = rightEndZone;
        game.awayTD = leftEndZone;
    } else if (game.possession === 'away' && game.homeSide === 0) {
        game.losDirection = -1; // Away team is on right going left
        game.homeSide = 0;
        game.awaySide = Math.PI;
        game.homeTD = rightEndZone;
        game.awayTD = leftEndZone;
    } else if (game.possession === 'home' && game.homeSide === Math.PI) {
        game.losDirection = -1; // Home team is on the right
        game.homeSide = Math.PI;
        game.awaySide = 0;
        game.homeTD = leftEndZone;
        game.awayTD = rightEndZone;
    } else if (game.possession === 'away' && game.homeSide === Math.PI) {
        game.losDirection = 1; // Home Team right Away team is on the left
        game.homeSide = Math.PI;
        game.awaySide = 0;
        game.homeTD = leftEndZone;
        game.awayTD = rightEndZone;
        console.log('losDirection', game.losDirection);
    }
    console.log('>>> 🏈 Home Play', playHome);
    console.log('>>> 🏈 Away Play', playAway);
    return { playHome, playAway };
}

// =========================================================== CREATE PLAYERS

// === little function to simulate putting players on field
// ** players would not alwasy be exactly 0 or 180 
function randomHeadingOffset() {
    return (Math.random() * 0.1) - 0.05; // Random value in [-0.05, 0.05]
}

// ====================================== SET PLAYERS ON THE FIELD
// ** get players setup from playbook and set them based on losYardLine
// Initialize players
function generatePlayers(losYardLine, playHome, playAway) {
    return [
        // ===============================================Home team (11 players)
        ...Array.from({ length: 11 }, (_, i) => {
            const id = String(i + 1).padStart(2, '0');
            const playPosH = playHome[id];
            if (!playPosH) {
                console.warn(`No play position found for playerID: abcdef-h-${id}, using default`);
            }
            // Determine if home team is offense or defense
            const isHomeOffense = game.possession === 'home';
            const roster = isHomeOffense
                ? homeTeam.rosterOffense
                : homeTeam.rosterDefense;
            const playerData = roster[i];
            const xSign = game.losDirection; // Offense: negative x, Defense: positive x
            const headingBase = game.homeSide; // going right (0), going left (π)
            // Convert relative to absolute coordinates
            const x = playPosH ? Math.max(10, Math.min(130, game.losYardLine + xSign * playPosH.x)) : 55;
            const y = playPosH ? Math.max(8.5, Math.min(71.5, midlineY + playPosH.y * (PLAYABLE_WIDTH / 360))) : 20 + i * 4;
            return {
                pid: `${game.id}-h-${id}`,
                //name: homeTeam.roster[i].name,
                name: playerData.name,
                x: x,
                y: parseFloat(y.toFixed(2)),
                heading: parseFloat((headingBase + randomHeadingOffset()).toFixed(3)),
                vx: 0,
                vy: 0,
                baseWidth: 4.1,
                baseHeight: 2.5,
                mass: parseFloat((1 + Math.random() * 0.3).toFixed(2)),
                dialValue: parseFloat((Math.random() * 100).toFixed(2)),
                //speed: 10 + Math.random() * 0.2,
                speed: parseFloat(((playerData.speed * 0.1) + Math.random() * 0.2).toFixed(2)),
                defaultSpeed: parseFloat(((playerData.speed * 0.1) + Math.random() * 0.2).toFixed(2)),
                hb: id === '06' ? (game.possession === 'home') : (playPosH.hb || false),
                ie: playPosH.ie || false,
            };
        }),

        // =====================================================Away team (11 players)
        ...Array.from({ length: 11 }, (_, i) => {
            const id = String(i + 1).padStart(2, '0');
            const playPosHA = playAway[id];
            if (!playPosHA) {
                console.warn(`No play position found for away playerID: abcdef-a-${id}, using default`);
            }
            // Determine if away team is offense or defense
            const isAwayOffense = game.possession === 'away';
            // choose the right roster array
            const roster = isAwayOffense
                ? awayTeam.rosterOffense
                : awayTeam.rosterDefense;
            const playerData = roster[i];
            const xSign = game.losDirection; // Offense: negative x, Defense: positive x
            const headingBase = game.awaySide; // Offense: right (0), Defense: left (π)
            const x = playPosHA ? Math.max(10, Math.min(130, game.losYardLine + xSign * playPosHA.x)) : 65;
            const y = playPosHA ? Math.max(8.5, Math.min(71.5, midlineY + playPosHA.y * (PLAYABLE_WIDTH / 360))) : 20 + i * 4;
            return {
                pid: `${game.id}-a-${id}`,
                //name: isAwayOffense ? awayTeam.rosterOffense[i].name : awayTeam.rosterDefense[i].name,
                name: playerData.name,
                x: x,
                y: parseFloat(y.toFixed(2)),
                heading: parseFloat((headingBase + randomHeadingOffset()).toFixed(3)),
                vx: 0,
                vy: 0,
                baseWidth: 4.1,
                baseHeight: 2.5,
                mass: parseFloat((1 + Math.random() * 0.3).toFixed(2)),
                dialValue: parseFloat((Math.random() * 100).toFixed(2)),
                //speed: 10 + Math.random() * 0.2,
                speed: parseFloat(((playerData.speed * 0.1) + Math.random() * 0.2).toFixed(2)),
                defaultSpeed: parseFloat(((playerData.speed * 0.1) + Math.random() * 0.2).toFixed(2)),
                hb: id === '06' ? (game.possession === 'away') : (playPosHA.hb || false),
                ie: playPosHA.ie || false,
            };
        })
    ];
}

const initialPlays = selectPlays(game.possession);
// Initialize players
//const initialPlayers = generatePlayers(losYardLine);
const initialPlayers = generatePlayers(losYardLine, initialPlays.playHome, initialPlays.playAway);
// Complete game initialization
game.players = initialPlayers.map(p => ({ ...p }));

// =========================================================== END ADD PLAYERS TO FIELD



const grid = new SpatialGrid(20, 140, 80);

// helper to broadcast to all except the sender
function broadcastExcept(sender, data) {
    game.clients.forEach(client => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}
// *********************************************************
// =============================================== WEBSOCKET
const MAX_PLAYERS = 2;
// const game = {
//     clients: new Set(),
//     home: null,
//     away: null
// };

wss.on('connection', (ws) => {

    // If we already have two players, reject any more
    if (game.clients.size >= MAX_PLAYERS) {
        ws.send(JSON.stringify({ text: "Too Many PLayers", type: "info" }));
        console.log('>>> Too many players connected, rejecting new connection');
        return ws.close();
    }

    // Decide side based on how many are already connected
    const side = game.clients.size === 0 ? 'home' : 'away';
    const token = makePlayerToken();

    ws.side = side;
    if (side === 'home') game.home = ws;
    else game.away = ws;
    ws.token = token; // Assign token to the WebSocket
    ws.gameId = game.id; // Assign game ID to the WebSocket

    console.log('side , token, gameid', side, token, game.id);
    // Add to our set
    game.clients.add(ws);
    // Tell this socket what side it is
    ws.send(JSON.stringify({ type: 'assignedSide', side, token, gameId: game.id }));
    // Notify the other player that someone joined
    for (let client of game.clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'playerConnected',
                side,                // “home” or “away”
                message: 'Opponent has joined'
            }));
        }
    }
    // ==original code
    // game.clients.add(ws);
    // console.log('>>>New client connected');
    // game.clients.forEach(client => {
    //     if (client !== ws && client.readyState === WebSocket.OPEN) {
    //         client.send(JSON.stringify({
    //             type: 'playerConnection',
    //             message: { text: "Player Connected", type: "info" }
    //         }));
    //     }
    //});
    const state = {
        type: 'initialState',
        i: game.id,
        s: Number((game.clock.s || initialGameState.clock.s).toFixed(2)),
        p: Number((game.playclock || initialGameState.playclock).toFixed(1)),
        r: game.gameRunning,
        los: game.losYardLine,
        fdl: game.firstDownYardLine,
        pl: game.players,
        qtr: game.qtr,
        down: game.down,
        ytg: Number(game.yardsToGo.toFixed(2)),
        poss: game.possession,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        playState: game.playState,
        homeTD: game.homeTD,
        awayTD: game.awayTD,
        gameStart: game.gameStart,
        message: message,
        players: game.players,
    };
    ws.send(JSON.stringify(state));
    broadcastReset(game, { text: "🏈Game Initialized🏈", type: "info" });
    console.log('=========================================');
    console.log('Sent initial state to new client:', state);
    console.log('=========================================');
    ws.on('message', (msg) => {
        const data = JSON.parse(msg);
        broadcastExcept(ws, data);
        // ========================================== GAME SWITCH ON/OFF BROADCAST
        if (data.type === 'toggleGame') {
            if (!game.gameStart) { game.gameStart = true; } // START THE GAME
            game.gameRunning = !game.gameRunning;
            game.currentPlay = 'running';
            broadcastState(game);
            if (game.gameRunning) {
                game.clockRunning = true;
                game.playclock = 25; // Reset play clock to 25 seconds
                game.playClockRunning = false;
            } else {
                game.clockRunning = false;
            }
        } else if (data.type === 'reset') {
            // ====== RESET THE PLAYERS
            const plays = selectPlays(game.possession);
            game.players = generatePlayers(losYardLine, plays.playHome, plays.playAway).map(p => ({ ...p }));
            game.gameRunning = false;
            game.players.forEach(p => {
                p.speed = p.defaultSpeed; // Reset speed to default
            });
            broadcastReset(game, { text: "Play Reset", type: "info" });
        } else if (data.type === 'passMode') {
            game.passMode = true;
            game.playMode = 1;
            game.gameRunning = false;
            game.clockRunning = false;
            selectedReceiverR = data.selectedPlayerR;
            console.log('>>> passMode', selectedReceiverR);
            getBallLocation();
            broadcastBallState(game, { text: "Pass Mode", type: "info" });
        } else if (data.type === 'passMoving') {
            game.passMode = true;
            game.playMode = 1;
            game.gameRunning = true;
            ballx = data.ballx;
            bally = data.bally;
            balldx = data.balldx;
            balldy = data.balldy;
            ballvx = data.ballvx;
            ballvy = data.ballvy;
            game.ball.isMoving = true;
            game.players.find(p => p.hb).hb = false; // Clear existing ball carrier
            console.log('>>> passMoving', ballx, bally, balldx, balldy, ballvx, ballvy);
            broadcastBallState(game, { text: "Pass Thrown", type: "info" });
        } else if (data.type === 'restart') {
            restartGame();
            broadcastReset(game, { text: "Game Restarted - New Game", type: "info" });
        } else if (data.type === 'updatePosition') {
            const playerId = data.pid || data.playerID;
            const player = game.players.find(p => p.pid === playerId);
            if (player && !game.running) {
                player.x = Math.max(3, Math.min(137, data.x));
                player.y = Math.max(3, Math.min(80, data.y));
                if (data.h !== undefined) {
                    // Normalize heading to [0, 2π)
                    player.heading = ((data.h % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                }
                broadcastPlayerUpdate(player);
                //console.log(`Updated position: ${playerId}, x=${data.x}, y=${data.y}`);
            }
        } else if (data.type === 'updateSpeed') {
            const playerId = data.pid || data.playerID;
            const player = game.players.find(p => p.pid === playerId);
            if (player && !game.running) {
                player.speed = data.speed;
                broadcastPlayerUpdate(player);
                //console.log(`Updated position: ${playerId}, x=${data.x}, y=${data.y}`);
            }
        }
    });
    ws.on('close', () => game.clients.delete(ws));
});


// ================================================== END WEBSOCKET
// ****************************************************************

// ================================================== TACKLE FUNCTION
// ** handle all the tackle function, reset los, first down, togo calculation etc
// ** beoadcast to players with broadcastTackle 
function tackleMade(tackledPlayerID, tacklerID, frontEdgeX) {
    console.log('*****************************************');
    console.log('>>> END OF PLAY TACKLE or OUT OF BOUNDS');
    game.gameRunning = false;
    if (game.playState === 'interception') {
        game.clockRunning = false; // Stop the clock
        game.playState = 'normal';
    } else {
        game.clockRunning = true;
    }
    game.playClockRunning = true;
    game.currentPlay = 'end';
    game.ball.isMoving = false;

    if (game.playState === 'incomplete pass') {
        game.losYardLine = game.losYardLine;
        game.playState = 'normal'; // Reset play state
        game.playClockRunning = false;
        game.playClockRunning = true;
        console.log('>>> Pass Incomplete tackle function');
    } else {
        //if (!game.playState === 'pass incomplete') {
        const tackledPlayer = game.players.find(p => p.pid === tackledPlayerID);
        const tackler = tacklerID !== 'OFB' ? game.players.find(p => p.pid === tacklerID) : null;
        message = { text: `Tackle Made by ${tackler?.name || tacklerID} on ${tackledPlayer?.name || tackledPlayerID}`, type: "success" };
        // Update LOS
        game.losYardLine = Math.max(10, Math.min(130, frontEdgeX));
        console.log(`New LOS: losYardLine=${game.losYardLine.toFixed(2)} and firstDownYardLine=${firstDownYardLine.toFixed(2)}`);
    }
    // Stop the play
    //}
    // Zero out all velocities
    game.players.forEach(p => {
        p.vx = 0;
        p.vy = 0;
    });
    // ========================== CHECK FOR FIRST DOWN and KICKOFF AFTER TACKLE
    // ** if playState set to kickoff it will run through kickoff routine
    // ** otherwise it will look at down as well as turnover on downs.
    // ========================================================================
    if (game.playState === 'kickoff') {
        game.clockRunning = false; // Stop the clock
        game.playClockRunning = true; // Stop the play clock
        game.down = 1; // Reset down
        game.yardsToGo = 10; // Reset yards to go
        game.firstDownYardLine = game.losYardLine + (10 * game.losDirection); // Move first down marker
        message = { text: "Kickoff Return", type: "info" };
        game.playState = 'normal'; // Reset play state
    } else {
        if ((game.losYardLine > game.firstDownYardLine && game.losDirection === 1) ||
            (game.losYardLine < game.firstDownYardLine && game.losDirection === -1)) {
            game.down = 1; // Reset down
            game.yardsToGo = 10; // Reset yards to go
            game.firstDownYardLine = game.losYardLine + (10 * game.losDirection); // Move first down marker
            message = { text: "First Down ", type: "success" };
            console.log(`First down! New first down line: ${game.firstDownYardLine}`);
        } else {
            down = game.down += 1; // Increment down
            if (game.losDirection === 1) {
                game.yardsToGo = game.firstDownYardLine - game.losYardLine;
            } else {
                game.yardsToGo = game.losYardLine - game.firstDownYardLine
            }
            console.log(`Down: ${game.down}, Yards to go: ${game.yardsToGo}`);
            // ========================= 4TH - TURNOVER ON DOWNS
            if (game.down > 4) {
                game.down = 1; // Reset down
                game.yardsToGo = 10; // Reset yards to go
                game.firstDownYardLine = game.losYardLine + (10 * game.losDirection * -1); // Move first down marker
                game.possession = game.possession === 'home' ? 'away' : 'home'; // swap possession
                // Update ball carrier
                game.players.forEach(p => {
                    p.hb = false; // Clear existing ball carrier
                    if (game.possession === 'home' && p.pid === 'teamyz-h-06') {
                        p.hb = true; // Home QB
                    } else if (game.possession === 'away' && p.pid === 'abcdef-a-06') {
                        p.hb = true; // Away QB
                    }
                    console.log(`New ball carrier: ${p.pid}, hb=${p.hb}`);
                });
                // Reselect plays based on new possession
                game.playState = 'normal'; // Reset play state
                const plays = selectPlays(game.possession);
                //game.players = generatePlayers(losYardLine, plays.playHome, plays.playAway).map(p => ({ ...p }));
                message = { text: "Turnover on Downs", type: "warning" };
                console.log(`Turnover on downs! New possession: ${game.possession}`);
            }
        }
    }

    // Broadcast the updated (stopped) state so clients see the play end
    broadcastTackle(game, tackledPlayerID, tacklerID, losYardLine, firstDownYardLine, game.down, game.yardsToGo, message);
}
// ==================================================== END TACKLE FUNCTION

// =================================================== GAME LOOP
// ** 60 FPS
// ** lets play football
const TICK_RATE = 60;
const CLOCK_UPDATE_INTERVAL = 100; // 100ms = 0.1s

setInterval(() => { // ============== gamerunning loop
    if (game.gameRunning) {
        updatePhysics(game);
        broadcastState(game);
        if (game.ball.isMoving) {
            console.log('game.ball.isMoving', game.ball.isMoving);
            handlePass();
        }
    }
}, 1000 / TICK_RATE);
// =================================================== END GAME LOOP

// =================================================== THE BIG CLOCK
setInterval(() => { // ============== handling the clock
    if (game.clockRunning) {
        broadcastClockUpdate(game);
        if (game.clock.s <= 0 && !game.gameRunning) {
            game.clockRunning.s = 0;
            clockLogic();
        }
    }
    if (game.playClockRunning) {
        game.playclock = Math.max(0, game.playclock - 1 / (CLOCK_UPDATE_INTERVAL / 10));
    }
}, CLOCK_UPDATE_INTERVAL);

// =================================================== CLOCK LOGIC
// ** handle the clock logic, qtr, half time, game over
function clockLogic() {
    console.log('>>> clockLogic EVENT');
    //clockLogic = true;
    game.clockRunning = false;
    game.playClockRunning = false;
    game.qtr = Math.min(5, game.qtr + 1); // Increment qtr, cap at 4
    game.clock.s = clockDuration; // 10 minutes
    game.playclock = 25;
    if (game.qtr === 2) {
        let message = { text: `QTR 2`, type: 'info' };
        game.homeSide = game.homeSide === 0 ? Math.PI : 0; // swap heading
        game.awaySide = game.awaySide === 0 ? Math.PI : 0; // swap heading
        if (game.playState === 'touchdown') {
            if (game.losYardLine === 85) {
                game.losYardLine = 55; // Reset LOS to 40 yards
            } else if (game.losYardLine = 55) {
                game.losYardLine = 85; // Reset LOS to 100 yards       
            }
            return;
        } else {
            game.losYardLine = Math.max(10, Math.min(130, 140 - game.losYardLine));
            // game.homeSide = game.homeSide === 0 ? Math.PI : 0; // swap heading
            // game.awaySide = game.awaySide === 0 ? Math.PI : 0; // swap heading
            game.firstDownYardLine = game.losYardLine - (game.yardsToGo);
        }
    } else if (game.qtr === 3) {
        let message = { text: `HALFTIME - QTR 3`, type: 'info' };
        game.down = 1;
        game.yardsToGo = 10; // Reset yards to go
        game.losYardLine = 55; // Reset LOS to 80 yards
        game.firstDownYardLine = game.losYardLine + (10 * game.losDirection); // Move first down marker
        game.homeSide = 0; // swap heading
        game.awaySide = Math.PI; // swap heading
        game.possession = 'away'; // swap possession
        game.playState = 'kickoff'; // Set play state to kickoff
    } else if (game.qtr === 4) {
        let message = { text: `QTR 4`, type: 'info' };
        game.losYardLine = Math.max(10, Math.min(130, 140 - game.losYardLine));
        game.homeSide = game.homeSide === 0 ? Math.PI : 0; // swap heading
        game.awaySide = game.awaySide === 0 ? Math.PI : 0; // swap heading
        game.firstDownYardLine = game.losYardLine + (game.yardsToGo);
    } else if (game.qtr > 4) {
        game.qtr = "0";
        gameover();
    }
    // game.clock.s = clockDuration; // 10 minutes
    // game.playclock = 25;
    let message = { text: `qtr ${game.qtr} Begins`, type: 'info' };
    const plays = selectPlays(game.possession);
    game.players = generatePlayers(losYardLine, plays.playHome, plays.playAway, game.homeSide, game.awaySide, game.losDirection, game.losYardLine).map(p => ({ ...p }));
    broadcastReset(game, message, firstDownYardLine, game.down, game.yardsToGo, losYardLine, game.possession);
}

function gameover() {
    game.gameRunning = false;
    game.playState = 'gameover';
    let message = { text: `GAME OVER`, type: 'info' };
    broadcastReset(game, message);
}

// Reset game state to initial values
function restartGame() {
    // Preserve clients to maintain WebSocket connections
    console.log('*******************************');
    console.log('>>>>>>Game Restart Key - Q');
    game.playState = 'kickoff';
    const { clients } = game;
    Object.assign(game, {
        ...initialGameState,
        id: generateGameId(), // New ID for reset
        clients: clients,
        clock: { ...initialGameState.clock } // Keep existing connections
    });
    game.clock.s = clockDuration; // Reset clock
    game.homeScore = 0;
    game.awayScore = 0;
    //game.losYardLine = 60;
    //game.firstDownYardLine = losYardLine + 10;
    //game.playState = 'kickoff';
    const plays = selectPlays(game.possession);
    game.players = generatePlayers(losYardLine, plays.playHome, plays.playAway).map(p => ({ ...p }));
    console.log('>>>>>>Game reset to initial state');
    broadcastReset(game, { text: "New Game Started!", type: "info" });
    broadcastClockUpdate(game);
}
function restartGamez() {
  console.log('>>>>>> Game Restart Key - Q');

  // 1) Preserve open sockets
  const { clients } = game;

  // 2) Reset to your blueprint state, keeping only clients
  Object.assign(game, {
    ...initialGameState,
    id:      generateGameId(),
    clients,               // carry over WebSocket connections
  });

  // 3) Zero out scores & clocks
  game.homeScore       = 0;
  game.awayScore       = 0;
  game.clock.s         = clockDuration;
  //game.playClock.s     = playClockDuration;

  // 4) Reset field markers
  game.playState            = 'kickoff';
  game.losYardLine          = initialGameState.losYardLine || 50;
  game.firstDownYardLine    = game.losYardLine + 10;
  game.losDirection         = 1;             // or whatever your default is
  game.homeSide             = 0;             // heading for home
  game.awaySide             = Math.PI;       // heading for away

  // 5) Pick & generate the brand-new roster
  const { playHome, playAway } = selectPlays(game.possession);
  game.players = generatePlayers(
    game.losYardLine,
    playHome,
    playAway
  ).map(p => ({ ...p }));

  console.log('>>>>>> Game reset to initial state');

  // 6) Broadcast the *entire* new state so clients fully resync
  // (you can fold in your info/clock messages here too)
  broadcastAll({
    type:  'state',
    state: {
      players:            game.players,
      homeScore:          game.homeScore,
      awayScore:          game.awayScore,
      clock:              game.clock,
      playClock:          game.playClock,
      losYardLine:        game.losYardLine,
      firstDownYardLine:  game.firstDownYardLine,
      playState:          game.playState,
      possession:         game.possession,
      //…and any other fields client needs…
    }
  });
}

// =================================================== END THE CLOCK

// =================================================== PHYSICS
// ** player movement broadcast to clients
// ** collision detection ... that you can comment out to bypass

// =========================Calculate front edge of ball carrier's base
function getFrontEdgeX(player, playState) {
    const vertices = getRectangleVertices(player);
    let direction = Math.cos(player.heading); // > 0 for right, < 0 for left
    // Flip direction for kickoff or punt
    if (playState === 'kickoff' || playState === 'punt') {
        direction = direction;
    }
    if (direction > 0) {
        const maxX = Math.max(...vertices.map(v => v.x));
        console.log(`Front edge (right): x=${maxX.toFixed(2)}, heading=${player.heading.toFixed(2)}, playState=${playState}`);
        return maxX;
    } else {
        const minX = Math.min(...vertices.map(v => v.x));
        console.log(`Front edge (left): x=${minX.toFixed(2)}, heading=${player.heading.toFixed(2)}, playState=${playState}`);
        return minX;
    }
}

// ============================ UPDATE PHYSICS - MOVE PLAYERS and COLLISION DETECTION
function updatePhysics(game) {
    grid.clear();
    game.players.forEach(p => {
        const baseSpeed = (0.5 * p.speed) * game.gameSpeed; // Adjust speed based on game speed
        p.heading += (Math.random() - 0.5) * 0.05;      // random heading change to simulate bibration
        p.vx += baseSpeed * Math.cos(p.heading) * 0.15;  // moves players forward .15 seems realistic 100yards in 10 seconds
        p.vy += baseSpeed * Math.sin(p.heading) * 0.15;  // moves players forward
        const friction = 0.95;                          // friction to slow down players and stops acceleration
        p.vx *= friction;
        p.vy *= friction;
        p.x += p.vx * (1 / TICK_RATE);
        p.y += p.vy * (1 / TICK_RATE);

        if (p.x < 3) p.x = 3;
        if (p.x > 137) p.x = 137;
        if (p.y < 3) p.y = 3;
        if (p.y > 77) p.y = 77;

        const maxTurnRate = 0.02;
        const dialSteering = ((p.dialValue - 50) / 50) * maxTurnRate;
        p.heading += dialSteering * (1 / TICK_RATE);

        // =============================================== CHECK FOR TOUCHDOWN
        // Check touchdown for ball carrier
        if (p.hb && !isTouchDown) {
            const team = p.pid.startsWith(game.id + "-h") ? 'home' : 'away';
            // const dir = direction(team);
            if ((game.homeTD === rightEndZone && game.possession === 'home' && p.x >= 120) ||
                (game.homeTD === leftEndZone && game.possession === 'home' && p.x <= 20) ||
                (game.awayTD === rightEndZone && game.possession === 'away' && p.x >= 120) ||
                (game.awayTD === leftEndZone && game.possession === 'away' && p.x <= 20)) {
                isTouchDown = true;
                let message;
                if (team === 'home') {
                    game.homeScore += 6;
                    message = { text: "Touchdown " + game.homeTeamName, type: "success" };
                } else {
                    game.awayScore += 6;
                    message = { text: "Touchdown " + game.awayTeamName, type: "success" };
                }
                // // Reset for next play (e.g., kickoff)
                game.down = 1;
                game.yardsToGo = 10;
                if (game.losDirection === 1) {
                    game.losYardLine = 55; // Kickoff from 35-yard line
                    game.firstDownYardLine = game.losYardLine - (10 * game.losDirection); // Move first down marker 
                } else {
                    game.losYardLine = 85; // Kickoff from 35-yard line
                    game.firstDownYardLine = game.losYardLine - (10 * game.losDirection); // Move first down marker
                }
                game.possession = team === 'home' ? 'away' : 'home'; // Opponent receives
                game.playState = 'touchdown';
                game.gameRunning = false;
                game.clockRunning = false;
                game.playClockRunning = false;
                isTouchDown = false; // Reset touchdown flag
                if (game.clock.s <= 0) {
                    console.log('>>>>>>>>>>>>>>QTR over! Time expired.');
                    //clockLogic();
                    timeExpired = true;
                    game.clock.s = 0;
                }
                // Broadcast touchdown
                broadcastReset(game, message);
                game.playState = 'kickoff'; // Reset play state
                game.currentPlay = 'end';
                if (timeExpired) {
                    clockLogic();
                    timeExpired = false;
                }
                const plays = selectPlays(game.possession);
                game.players = generatePlayers(game.losYardLine, plays.playHome, plays.playAway).map(p => ({ ...p }));
                broadcastReset(game);
                console.log(`Touchdown! ${team} scores, new score: Home ${game.homeScore} - Away ${game.awayScore}, New LOS: ${losYardLine}, fdl: ${game.firstDownYardLine.toFixed(2)}`);
                return; // Exit loop after touchdown

            }
        }
        // =============================================== END CHECK FOR TOUCHDOWN

        // =============================================== OUT OF BOUNDS for p.hb
        // Check out-of-bounds for ball carrier
        if (p.hb && (p.x < 10 || p.x > 130 || p.y < 8.5 || p.y > 77)) {
            console.log(`Player ${p.pid} is out of bounds!`);
            const frontEdgeX = getFrontEdgeX(p, game.playState); // Pass player object
            tackleMade(
                p.pid, // tackledPlayerID
                'OFB', // tacklerID (Out of Bounds)
                frontEdgeX
            );
            return; // Break loop after out-of-bounds
        }

        // =============================================== END OUT OF BOUNDS

        grid.addPlayer(p);
    });


    // =================================================== Collision detection with tackling
    for (const p of game.players) {
        const nearby = grid.getNearbyPlayers(p);
        for (const other of nearby) {
            // Prevent duplicate checks
            if (p.pid < other.pid) {
                const result = detectAndResolveCollisionRectangles(p, other);
                if (result && result.tackleDetected) {
                    console.log(`Tackle detected: ${result.tackleDetected.tacklerID} tackled ${result.tackleDetected.tackledPlayerID}`);
                    // Find ball carrier
                    const ballCarrier = game.players.find(player => player.pid === result.tackleDetected.tackledPlayerID);
                    if (ballCarrier) {
                        // Calculate front edge of ball carrier's base
                        const frontEdgeX = getFrontEdgeX(ballCarrier, game.playState);

                        // ===============================================================TACKLE MADE SAFETY
                        // ** NOT FINISHED NEED TO WORK OUT
                        // =================================================================================
                        if (frontEdgeX < 20) {
                            message = { text: "SAFETY " + game.homeTeamName, type: "success" };
                            console.log('Safety!');
                            game.awayScore += 2;
                        }
                        // =================================================================END SAFETY
                        // Stop the game running and update LOS
                        tackleMade(
                            result.tackleDetected.tackledPlayerID,
                            result.tackleDetected.tacklerID,
                            frontEdgeX
                        );
                    }
                    return; // Break loop after tackle
                }
            }
        }
    }

    // console.log('server - updatePhysics');
    // console.log(game.players.map(p => `${p.playerID}: heading=${p.heading.toFixed(2)}, mass=${p.mass.toFixed(2)}, x=${p.x.toFixed(2)}, y=${p.y.toFixed(2)}, vx=${p.vx.toFixed(2)}, vy=${p.vy.toFixed(2)}`));
}

// ================================================== PASSING
// ** All passing functions here
// **
// ==========================================================
// Add pass-related functions
// ================================================== PASSMODE
function getBallLocation() {
    game.ball.x = game.players.find(p => p.hb).x;
    game.ball.y = game.players.find(p => p.hb).y;
    console.log('Ball location:', game.ball.x, game.ball.y);
}
function removeBall() {
    gameState.players.find(p => p.hb).hb = false;
}

function handlePass() {
    console.log('>>> handlePass');
    if (!game.ball || !game.ball.isMoving) return;

    // Move ball
    ballx += ballvx;
    bally += ballvy;
    ballvx *= 0.97;
    ballvy *= 0.97;
    game.ball.x = ballx;
    game.ball.y = bally;

    const speed = Math.hypot(ballvx, ballvy);
    console.log('Ball speed:', speed.toFixed(3));


    // Interception logic
    const defenders = game.players.filter(p =>
        game.ball.possession === 'home'
            ? p.pid.includes('-h-')   // home has the ball → defenders are away
            : p.pid.includes('-a-')   // away has the ball → defenders are home
    );
    //console.log('possession:', game.possession);
    //console.log('Defenders:', defenders.map(d => d.pid));
    for (let defender of defenders) {
        const dx = game.ball.x - defender.x;
        const dy = game.ball.y - defender.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 3 && speed < .5 && speed > 0.06) {
            const interceptionChance = 0.7;
            if (Math.random() < interceptionChance) {
                defender.hb = true;
                game.possession = game.possession === 'home' ? 'away' : 'home'; // Change possession
                game.losDirection = game.losDirection === 1 ? -1 : 1; // Change direction
                game.playState = 'interception';
                //game.ball = null;
                game.selectedReceiver = null;
                defender.hb = true
                game.ball.isMoving = false;
                // game.isTeam1Offense = !game.isTeam1Offense;
                // game.scoringBoundary = game.isTeam1Offense
                //     ? (game.isRightTeam ? 1920 - 120 : 120) // Assume canvas.width = 1920
                //     : (game.isRightTeam ? 120 : 1920 - 120);
                game.down = 1;
                game.yardsToFirst = 10;
                //game.playState = "complete";
                game.losYardLine = 20;

                console.log('Server: Intercepted by:', defender.pid);
                message = { text: `Pass Intercepted by `, defender, type: 'info' };
                broadcastBallState(game, message);
                return;
            }
        }
    }

    // // Catch detection
    if (selectedReceiverR) {
        console.log('Selected receiver:', selectedReceiverR);
        const selectedReceiver = game.players.find(p => p.pid === selectedReceiverR);
        if (selectedReceiver) {
            const dx = game.ball.x - selectedReceiver.x;
            const dy = game.ball.y - selectedReceiver.y;
            const dist = Math.hypot(dx, dy);
            console.log('Distance to receiver:', dist);

            // Example catch condition (adjust as needed)
            if (dist < 3 && speed < 10 && speed > 0.06) {
                selectedReceiver.hb = true;
                //game.players.find(p => p.id = selectedReceiver).hb = true; // Clear existing ball carrier
                //game.ball = null;
                game.ball.isMoving = false;
                //game.selectedReceiverR = null;
                //game.PlayState = 'complete';
                console.log('Catch successful by:', selectedReceiver.pid);
                broadcastBallState(game, { text: 'Catch Successful', type: 'success' });
                return;
            }
        } else {
            console.warn('Selected receiver not found:', game.selectedReceiverR);
        }
    }

    // Stop if too slow
    if (speed < 0.05) {
        game.ball.isMoving = false;
        game.gameRunning = false;
        game.clockRunning = false;
        game.selectedReceiverR = null;
        game.playMode = 0;
        game.playState = 'incomplete pass';
        message = { text: `Pass Incomplete`, type: 'info' };
        console.log('Passing Logic complete');
        // Assume server-side handleIncompletePass
        broadcastBallState(game, message);
        tackleMade();
    } else {
        broadcastBallState(game);
        console.log('Ball location:', ballx, bally, 'Ball speed:', speed);
    }
}



// ================================================== END PASS MODE

// ================================================== BROADCAST TO CLIENTS
// ** keep small and simple to keep track of game
// ** main broadcast of state
function broadcastState(game) {
    const payload = {
        i: game.id,
        s: Number(game.clock.s.toFixed(2)),
        p: Number(game.playclock.toFixed(0)),
        r: game.gameRunning,
        pl: game.players.map(p => ({
            pid: p.pid,
            x: Number(p.x.toFixed(2)), // Round to 2 decimals
            y: Number(p.y.toFixed(2)),
            h: Number(p.heading.toFixed(2)),
            hb: p.hb,
            //dv: Number(p.dialValue.toFixed(2))
        }))
    };
    // console.log('===============================');
    // console.log('...broadcastState...');
    // console.log('...game.clients.length:', game.clients.size);
    // console.log('...playState:', game.playState);
    // console.log('...keep small and turn off');
    // console.log('===============================');
    // console.log('>>payload', JSON.stringify(payload));
    game.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
            //console.log('Sent to client:', payload);
        }
    });
}

// ===== Pass , Kick State Broadcast
function broadcastBallState(game, message) {
    const payload = {
        type: 'ballState',
        i: game.id,
        //s: Number(game.clock.s.toFixed(2)),
        //p: Number(game.playclock.toFixed(0)),
        r: game.gameRunning,
        m: game.playMode,
        message: message,
        b: game.ball ? {
            x: Number((game.ball.x || 0).toFixed(1)),
            y: Number((game.ball.y || 0).toFixed(1)),
            vx: Number((game.ball.vx || 0).toFixed(1)),
            vy: Number((game.ball.vy || 0).toFixed(1)),
            r: Number((game.ball.rotation || 0).toFixed(1)),
            m: game.ball.isMoving,
            t: (game.ball.trail || []).map(t => ({
                x: Number((t.x || 0).toFixed(1)),
                y: Number((t.y || 0).toFixed(1))
            }))
        } : null,
        pl: game.players.map(p => ({
            pid: p.pid,
            x: Number(p.x.toFixed(2)), // Round to 2 decimals
            y: Number(p.y.toFixed(2)),
            h: Number(p.heading.toFixed(2)),
            hb: p.hb,
            ie: p.ie
            //dv: Number(p.dialValue.toFixed(2))
        }))
    };
    // console.log('===========================');
    // console.log('...broadcastBallState...');
    // console.log('.pass and kick mode...');
    // console.log('===========================');
    // console.log('broadcastBallState:', JSON.stringify(payload));
    game.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
            //console.log('Sent to client:', payload);
        }
    });
}

// ======================================== Broadcast player update 
// ** dragging player
function broadcastPlayerUpdate(player) {
    const payload = {
        type: 'playerUpdate',
        pid: player.pid,
        x: Number(player.x.toFixed(2)),
        y: Number(player.y.toFixed(2)),
        h: Number(player.heading.toFixed(2)),
        hb: player.hb,
        speed: player.speed,
        // d: Number(player.dialValue.toFixed(2)),
        // s: Number((game.clock.s || 600).toFixed(2)),
        // p: Number(game.play.toFixed(2)),
        // r: game.running
    };
    console.log('player speed:', player.speed);
    // console.log('===========================');
    // console.log('...broadcastPlayerUpdate...');
    // console.log('.moving individual player...');
    // console.log('===========================');
    game.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    });
}

// ===================== BROADCAST TACKLE

function broadcastTackle(game, tackledPlayerID, tacklerID, losYardLine, firstDownYardLine, down, yardsToGo, message) {
    const payload = {
        type: 'tackle',
        tackledPlayerID,
        tacklerID,
        los: (losYardLine.toFixed(2)),
        ytg: (game.yardsToGo.toFixed(2)),
        fdl: Number(game.firstDownYardLine),
        down: down,
        possession: game.possession,
        message: message,
        currentPlay: game.currentPlay,
        r: game.gameRunning,
        m: 0,
        s: Number((game.clock.s || 600).toFixed(2)),
        p: Number(game.playclock.toFixed(2)),
        pl: game.players.map(p => ({
            pid: p.pid,
            x: Number(p.x.toFixed(2)),
            y: Number(p.y.toFixed(2)),
            h: Number(p.heading.toFixed(2)),
            hb: p.hb
        }))
    };
    console.log('=========================');
    console.log('...broadcastTackle...');
    console.log('...playState:', game.playState);
    console.log('=========================');
    console.log('>>', JSON.stringify(payload));
    game.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    });
}

// =============================Broadcast reset event
function broadcastReset(game, message, firstDownYardLine, down, yardsToGo, qtr,) {
    const payload = {
        type: 'reset',
        los: Number(game.losYardLine),
        fdl: Number(game.firstDownYardLine),
        ytg: (game.yardsToGo.toFixed(2)),
        qtr: game.qtr,
        r: game.gameRunning,
        m: 0,
        down: game.down,
        poss: game.possession,
        message: message,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        playState: game.playState,
        homeTD: game.homeTD,
        awayTD: game.awayTD,
        gameStart: game.gameStart,
        currentPlay: game.currentPlay,
        s: Number((game.clock.s).toFixed(2)),
        p: Number(game.playclock.toFixed(0)),
        pl: game.players.map(p => ({
            pid: p.pid,
            x: Number(p.x.toFixed(2)),
            y: Number(p.y.toFixed(2)),
            h: Number(p.heading.toFixed(2)),
            hb: p.hb,
            s: Number(p.speed.toFixed(2))
        }))

    };
    console.log('=========================');
    console.log('...broadcastReset...');
    console.log('...playState:', game.playState);
    console.log('=========================');
    console.log('>>', JSON.stringify(payload));
    game.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    });
}

function broadcastClockUpdate(game) {
    //game.clockRunning = true;
    try {
        if (game.clockRunning) {
            game.clock.s = Math.max(0, game.clock.s - 1 / (CLOCK_UPDATE_INTERVAL / 10));
            //game.play = Math.max(0, game.play - 1 / (CLOCK_UPDATE_INTERVAL / 10));
        }
        const payload = {
            type: 'clockUpdate',
            s: Number((game.clock.s || 0).toFixed(1)),
            p: Number((game.playclock || 25).toFixed(0)),
            r: game.running
        };
        //console.log('Broadcasting clock update:', JSON.stringify(payload));
        game.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(payload));
            }
        });
    } catch (error) {
        console.error('Error broadcasting clock update:', error);
    }
}

module.exports = {
    tackleMade,
    initialPlayers,
    //gameRunning,
    //clockSeconds,
    //playClock,
    broadcastState
};