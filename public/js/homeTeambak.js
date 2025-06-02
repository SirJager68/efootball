// homeTeam.js
const offensivePlaysHome = {
    'Dal - Shotgun': {
        '01': { x: -1, y: -50, h: 0, dv: 50, hb: false, ie: false },
        '02': { x: -2, y: -40, h: 0, dv: 50, hb: false, ie: false },
        '03': { x: -3, y: -30, h: 0, dv: 50, hb: false, ie: false },
        '04': { x: -4, y: -20, h: 0, dv: 50, hb: false, ie: false },
        '05': { x: -5, y: -10, h: 0, dv: 50, hb: false, ie: false },
        '06': { x: -6, y: 0, h: 0, dv: 50, hb: true, ie: true },
        '07': { x: -7, y: 10, h: 0, dv: 50, hb: false, ie: true },
        '08': { x: -8, y: 20, h: 0, dv: 50, hb: false, ie: true },
        '09': { x: -9, y: 30, h: 0, dv: 50, hb: false, ie: true },
        '10': { x: -10, y: 40, h: 0, dv: 50, hb: false, ie: true },
        '11': { x: -11, y: 50, h: 0, dv: 50, hb: false, ie: true }
    },
    'I-Power': {
        '01': { x: -1, y: -50, h: 0, dv: 50, hb: false, ie: false },
        '02': { x: -2, y: -40, h: 0, dv: 50, hb: false, ie: false },
        '03': { x: -3, y: -30, h: 0, dv: 50, hb: false, ie: false },
        '04': { x: -4, y: -20, h: 0, dv: 50, hb: false, ie: false },
        '05': { x: -5, y: -10, h: 0, dv: 50, hb: false, ie: false },
        '06': { x: -6, y: 0, h: 0, dv: 50, hb: true, ie: true },
        '07': { x: -7, y: 10, h: 0, dv: 50, hb: false, ie: true },
        '08': { x: -8, y: 20, h: 0, dv: 50, hb: false, ie: true },
        '09': { x: -9, y: 30, h: 0, dv: 50, hb: false, ie: true },
        '10': { x: -10, y: 40, h: 0, dv: 50, hb: false, ie: true },
        '11': { x: -11, y: 50, h: 0, dv: 50, hb: false, ie: true }
    },
    'Run-Right': {
        '01': { x: -1, y: -50, h: 0, dv: 50, hb: false, ie: false },
        '02': { x: -2, y: -40, h: 0, dv: 50, hb: false, ie: false },
        '03': { x: -3, y: -30, h: 0, dv: 50, hb: false, ie: false },
        '04': { x: -4, y: -20, h: 0, dv: 50, hb: false, ie: false },
        '05': { x: -5, y: -10, h: 0, dv: 50, hb: false, ie: false },
        '06': { x: -6, y: 0, h: 0, dv: 50, hb: true, ie: true },
        '07': { x: -7, y: 10, h: 0, dv: 50, hb: false, ie: true },
        '08': { x: -8, y: 20, h: 0, dv: 50, hb: false, ie: true },
        '09': { x: -9, y: 30, h: 0, dv: 50, hb: false, ie: true },
        '10': { x: -10, y: 40, h: 0, dv: 50, hb: false, ie: true },
        '11': { x: -11, y: 50, h: 0, dv: 50, hb: false, ie: true }
    },
    "Kickoff Return": {
        "01": { x: -15, y: 0, h: 0, dv: 0, hb: false, ie: false }, // Center (C)
        "02": { x: -15, y: -20, h: 0, dv: 0, hb: false, ie: false }, // Right Guard (RG)
        "03": { x: -15, y: 20, h: 0, dv: 0, hb: false, ie: false }, // Left Guard (LG)
        "04": { x: -15, y: -40, h: 0, dv: 0, hb: false, ie: false }, // Right Tackle (RT)
        "05": { x: -15, y: 40, h: 0, dv: 0, hb: false, ie: false }, // Left Tackle (LT)
        "06": { x: -70, y: 0, h: 0, dv: 0, hb: false, ie: false }, // Quarterback (QB)
        "07": { x: -25, y: 30, h: 0, dv: 0, hb: false, ie: false }, // Tight End (TE)
        "08": { x: -25, y: 0, h: 0, dv: 0, hb: false, ie: false }, // Running Back (RB)
        "09": { x: -25, y: -30, h: 0, dv: 0, hb: false, ie: false }, // Fullback (FB)
        "10": { x: -30, y: -50, h: 0, dv: 0, hb: false, ie: false }, // Wide Receiver 1 (WR1)
        "11": { x: -30, y: 50, h: 0, dv: 0, hb: false, ie: false } // Wide Receiver 2 (WR2)
    }
    // Add more plays as needed
};

const defensivePlaysHome = {
    '4-3-Standard': {
        '01': { x: 1, y: 0, h: Math.PI, dv: 50, hb: false, ie: false },
        '02': { x: 2, y: -10, h: Math.PI, dv: 50, hb: false, ie: false },
        '03': { x: 3, y: -20, h: Math.PI, dv: 50, hb: false, ie: false },
        '04': { x: 4, y: -30, h: Math.PI, dv: 50, hb: false, ie: false },
        '05': { x: 5, y: -40, h: Math.PI, dv: 50, hb: false, ie: false },
        '06': { x: 6, y: 0, h: Math.PI, dv: 50, hb: false, ie: false },
        '07': { x: 7, y: 10, h: Math.PI, dv: 50, hb: false, ie: false },
        '08': { x: 8, y: 20, h: Math.PI, dv: 50, hb: false, ie: false },
        '09': { x: 9, y: 30, h: Math.PI, dv: 50, hb: false, ie: false },
        '10': { x: 10, y: 40, h: Math.PI, dv: 50, hb: false, ie: false },
        '11': { x: 11, y: 50, h: Math.PI, dv: 50, hb: false, ie: false }
    },
    "Kickoff": {
        // Placeholder, replace with your actual formation
        "01": { x: 3, y: -30, h: 0, dv: 0, hb: false, ie: false }, // Defensive End (DE, left)
        "02": { x: 3, y: -10, h: 0, dv: 0, hb: false, ie: false }, // Defensive Tackle (DT, left)
        "03": { x: 3, y: 10, h: 0, dv: 0, hb: false, ie: false }, // Defensive Tackle (DT, right)
        "04": { x: 3, y: 40, h: 0, dv: 0, hb: false, ie: false }, // Defensive End (DE, right)
        "05": { x: 3, y: -20, h: 0, dv: 0, hb: false, ie: false }, // Outside Linebacker (OLB, left)
        "06": { x: 10, y: 0, h: 0, dv: 0, hb: false, ie: false }, // Middle Linebacker (MLB)
        "07": { x: 3, y: 20, h: 0, dv: 0, hb: false, ie: false }, // Outside Linebacker (OLB, right)
        "08": { x: 3, y: -60, h: 0, dv: 0, hb: false, ie: false }, // Cornerback (CB, left)
        "09": { x: 3, y: 60, h: 0, dv: 0, hb: false, ie: false }, // Cornerback (CB, right)
        "10": { x: 3, y: -40, h: 0, dv: 0, hb: false, ie: false }, // Strong Safety (SS)
        "11": { x: 3, y: 30, h: 0, dv: 0, hb: false, ie: false } // Free Safety (FS)
    }
    // Add more plays as needed
};

const homeTeam = {
    name: 'Dallas Cowboys',
    // roster: [
    //     'Dak Prescott',
    //     'Ezekiel Elliott',
    //     'CeeDee Lamb',
    //     'Amari Cooper',
    //     'Michael Gallup',
    //     'Tyron Smith',
    //     'Zack Martin',
    //     'Travis Frederick',
    //     'La’el Collins',
    //     'Tony Pollard',
    //     'Blake Jarwin'
    // ],
    // Now an array of player objects, each with id, name, speed & strength:
    // Mirror the away‐team position order:
    rosterOffense: [
        { id: '01', name: 'Dak Prescott', position: 'C', speed: 88, strength: 72 },
        { id: '02', name: 'Ezekiel Elliott', position: 'RG', speed: 89, strength: 82 },
        { id: '03', name: 'CeeDee Lamb', position: 'LG', speed: 93, strength: 78 },
        { id: '04', name: 'Amari Cooper', position: 'RT', speed: 90, strength: 75 },
        { id: '05', name: 'Michael Gallup', position: 'LT', speed: 87, strength: 76 },
        { id: '06', name: 'Tyron Smith', position: 'QB', speed: 75, strength: 95 },
        { id: '07', name: 'Zack Martin', position: 'TE', speed: 60, strength: 96 },
        { id: '08', name: 'Travis Frederick', position: 'RB', speed: 58, strength: 94 },
        { id: '09', name: 'La’el Collins', position: 'FB', speed: 62, strength: 92 },
        { id: '10', name: 'Tony Pollard', position: 'WR1', speed: 92, strength: 80 },
        { id: '11', name: 'Blake Jarwin', position: 'WR2', speed: 83, strength: 77 }
    ],

    // Fun cartoon/celebrity defense:
    rosterDefense: [
        { id: '01', name: 'Bugs Bunny', position: 'LDE', speed: 95, strength: 80 },
        { id: '02', name: 'Homer Simpson', position: 'LDT', speed: 55, strength: 90 },
        { id: '03', name: 'Tom Cat', position: 'RDT', speed: 70, strength: 85 },
        { id: '04', name: 'Jerry Mouse', position: 'RDE', speed: 80, strength: 70 },
        { id: '05', name: 'Superman', position: 'OLB', speed: 100, strength: 100 },
        { id: '06', name: 'Batman', position: 'MLB', speed: 85, strength: 95 },
        { id: '07', name: 'Scooby-Doo', position: 'OLB', speed: 75, strength: 80 },
        { id: '08', name: 'SpongeBob SquarePants', position: 'LCB', speed: 90, strength: 60 },
        { id: '09', name: 'Popeye', position: 'RCB', speed: 80, strength: 100 },
        { id: '10', name: 'Daffy Duck', position: 'SS', speed: 85, strength: 75 },
        { id: '11', name: 'Mr. Incredible', position: 'FS', speed: 95, strength: 90 }
    ],
    playbooks: {
        offensive: offensivePlaysHome,
        defensive: defensivePlaysHome
    }
};
// 1) For Node.js (server), export via module.exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = homeTeam;
}

// 2) For browser, attach to window if available
if (typeof window !== 'undefined') {
    window.homeTeam = homeTeam;
}