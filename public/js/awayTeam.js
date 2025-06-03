// awayTeam.js
console.log("Loading awayTeam.js...");
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        // Node.js / CommonJS
        module.exports = factory();
    } else {
        // Browser global
        root.awayTeam = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    // === BEGIN playbook data ===

    const offensivePlaysAway = {
        "I-Formation": {
            "01": { x: -3, y: 0, h: 0, dv: 0, hb: false, ie: false }, // Center (C)
            "02": { x: -3, y: -10, h: 0, dv: 0, hb: false, ie: false }, // Right Guard (RG)
            "03": { x: -3, y: 10, h: 0, dv: 0, hb: false, ie: false }, // Left Guard (LG)
            "04": { x: -3, y: -20, h: 0, dv: 0, hb: false, ie: false }, // Right Tackle (RT)
            "05": { x: -3, y: 20, h: 0, dv: 0, hb: false, ie: false }, // Left Tackle (LT)
            "06": { x: -12, y: 0, h: 0, dv: 0, hb: false, ie: true }, // Quarterback (QB)
            "07": { x: -3, y: 30, h: 0, dv: 0, hb: false, ie: true }, // Tight End (TE)
            "08": { x: -16, y: -10, h: 0, dv: 0, hb: false, ie: true }, // Running Back (RB)
            "09": { x: -16, y: 10, h: 0, dv: 0, hb: false, ie: true }, // Fullback (FB)
            "10": { x: -3, y: -50, h: 0, dv: 0, hb: false, ie: true }, // Wide Receiver 1 (WR1)
            "11": { x: -3, y: 50, h: 0, dv: 0, hb: false, ie: true } // Wide Receiver 2 (WR2)
        },
        "Wishbone": {
            "01": { x: -3.00, y: 0.00, h: 0.01, dv: 0, hb: false, ie: false },
            "02": { x: -3.00, y: -9.99, h: -0.03, dv: 0, hb: false, ie: false },
            "03": { x: -3.00, y: 9.99, h: -0.01, dv: 0, hb: false, ie: false },
            "04": { x: -3.00, y: -20.01, h: 0.00, dv: 0, hb: false, ie: false },
            "05": { x: -3.00, y: 20.01, h: -0.01, dv: 0, hb: false, ie: false },
            "06": { x: -8.46, y: -0.30, h: -0.01, dv: 0, hb: true, ie: false },
            "07": { x: -3.00, y: 30.00, h: 0.03, dv: 0, hb: false, ie: false },
            "08": { x: -19.44, y: -13.71, h: 0.02, dv: 0, hb: false, ie: false },
            "09": { x: -19.44, y: 14.01, h: 0.02, dv: 0, hb: false, ie: false },
            "10": { x: -14.97, y: 0.00, h: -0.04, dv: 0, hb: false, ie: false },
            "11": { x: -3.00, y: 80.01, h: -0.01, dv: 0, hb: false, ie: false }
        },
        "Verticles": {
            "01": { x: -3.00, y: 0.00, h: -0.03, dv: 0, hb: false, ie: false },
            "02": { x: -3.00, y: -9.99, h: -0.05, dv: 0, hb: false, ie: false },
            "03": { x: -3.00, y: 9.99, h: 0.03, dv: 0, hb: false, ie: false },
            "04": { x: -3.00, y: -20.01, h: 0.04, dv: 0, hb: false, ie: false },
            "05": { x: -3.00, y: 20.01, h: 0.04, dv: 0, hb: false, ie: false },
            "06": { x: -12.00, y: 0.00, h: -0.04, dv: 0, hb: true, ie: false },
            "07": { x: -16.48, y: 13.41, h: -0.04, dv: 0, hb: false, ie: false },
            "08": { x: -2.67, y: -61.53, h: -0.02, dv: 0, hb: false, ie: false },
            "09": { x: -6.95, y: -48.99, h: 0.12, dv: 0, hb: false, ie: false },
            "10": { x: -2.67, y: -75.24, h: -0.05, dv: 0, hb: false, ie: false },
            "11": { x: -3.06, y: 79.05, h: -0.03, dv: 0, hb: false, ie: false }
        },
        "Red - Shotgun": {
            "01": { x: -3, y: 0, h: 0, dv: 0, hb: false, ie: false }, // Center (C)
            "02": { x: -3, y: -10, h: 0, dv: 0, hb: false, ie: false }, // Right Guard (RG)
            "03": { x: -3, y: 10, h: 0, dv: 0, hb: false, ie: false }, // Left Guard (LG)
            "04": { x: -3, y: -20, h: 0, dv: 0, hb: false, ie: false }, // Right Tackle (RT)
            "05": { x: -3, y: 20, h: 0, dv: 0, hb: false, ie: false }, // Left Tackle (LT)
            "06": { x: -12, y: 0, h: 0, dv: 0, hb: false, ie: true }, // Quarterback (QB)
            "07": { x: -3, y: 30, h: 0, dv: 0, hb: false, ie: true }, // Tight End (TE)
            "08": { x: -10, y: -9, h: 0, dv: 0, hb: false, ie: true }, // Running Back (RB)
            "09": { x: -16, y: 10, h: 0, dv: 0, hb: false, ie: true }, // Fullback (FB)
            "10": { x: -3, y: -80, h: 0, dv: 0, hb: false, ie: true }, // Wide Receiver 1 (WR1)
            "11": { x: -3, y: 80, h: 0, dv: 0, hb: false, ie: true } // Wide Receiver 2 (WR2)
        },
        'Kickoff Return': {
            '01': { x: -15, y: 0, h: 0, dv: 0, hb: false, ie: false },
            '02': { x: -15, y: -20, h: 0, dv: 0, hb: false, ie: false },
            '03': { x: -15, y: 20, h: 0, dv: 0, hb: false, ie: false },
            '04': { x: -15, y: -40, h: 0, dv: 0, hb: false, ie: false },
            '05': { x: -15, y: 40, h: 0, dv: 0, hb: false, ie: false },
            '06': { x: -70, y: 0, h: 0, dv: 0, hb: false, ie: false },
            '07': { x: -25, y: 30, h: 0, dv: 0, hb: false, ie: false },
            '08': { x: -25, y: 0, h: 0, dv: 0, hb: false, ie: false },
            '09': { x: -25, y: -30, h: 0, dv: 0, hb: false, ie: false },
            '10': { x: -30, y: -50, h: 0, dv: 0, hb: false, ie: false },
            '11': { x: -30, y: 50, h: 0, dv: 0, hb: false, ie: false }
        }
        // … add more offensive plays as needed …
    };

    const defensivePlaysAway = {
        "4-3-Standard": {
            "01": { x: 3.90, y: -20.69, h: 3.10, dv: 0, hb: false, ie: false },
            "02": { x: 3.90, y: -5.57, h: 3.15, dv: 0, hb: false, ie: false },
            "03": { x: 3.81, y: 10.79, h: 3.10, dv: 0, hb: false, ie: false },
            "04": { x: 3.93, y: 26.57, h: 3.10, dv: 0, hb: false, ie: false },
            "05": { x: 10.81, y: -33.83, h: 3.03, dv: 0, hb: false, ie: false },
            "06": { x: 12.66, y: 5.25, h: 3.16, dv: 0, hb: false, ie: false },
            "07": { x: 9.76, y: 39.55, h: 3.23, dv: 0, hb: false, ie: false },
            "08": { x: 7.21, y: -76.71, h: 3.17, dv: 0, hb: false, ie: false },
            "09": { x: 6.68, y: 78.06, h: 3.19, dv: 0, hb: false, ie: false },
            "10": { x: 21.57, y: -23.48, h: 3.10, dv: 0, hb: false, ie: false },
            "11": { x: 21.30, y: 30.89, h: 3.18, dv: 0, hb: false, ie: false }
        },
        "dal 3-4-Safety": {
            // Placeholder, replace with your actual formation
            "01": { x: 4, y: -30, h: 0, dv: 0, hb: false }, // Defensive End (DE, left)
            "02": { x: 4, y: -10, h: 0, dv: 0, hb: false }, // Defensive Tackle (DT, left)
            "03": { x: 4, y: 10, h: 0, dv: 0, hb: false }, // Defensive Tackle (DT, right)
            "04": { x: 10, y: 30, h: 0, dv: 0, hb: false }, // Defensive End (DE, right)
            "05": { x: 4, y: -20, h: 0, dv: 0, hb: false }, // Outside Linebacker (OLB, left)
            "06": { x: 10, y: 0, h: 0, dv: 0, hb: false }, // Middle Linebacker (MLB)
            "07": { x: 4, y: 20, h: 0, dv: 0, hb: false }, // Outside Linebacker (OLB, right)
            "08": { x: 7, y: -80, h: 0, dv: 0, hb: false }, // Cornerback (CB, left)
            "09": { x: 7, y: 80, h: 0, dv: 0, hb: false }, // Cornerback (CB, right)
            "10": { x: 40, y: -30, h: 0, dv: 0, hb: false }, // Strong Safety (SS)
            "11": { x: 30, y: 30, h: 0, dv: 0, hb: false } // Free Safety (FS)
        },
        "3-3-Base": {
            "01": { x: 3.93, y: -15.91, h: 2.90, dv: 0, hb: false, ie: false },
            "02": { x: 3.41, y: 7.10, h: 3.15, dv: 0, hb: false, ie: false },
            "03": { x: 4.12, y: 26.28, h: 3.20, dv: 0, hb: false, ie: false },
            "04": { x: 14.22, y: 36.88, h: 3.30, dv: 0, hb: false, ie: false },
            "05": { x: 13.82, y: -24.83, h: 2.83, dv: 0, hb: false, ie: false },
            "06": { x: 13.01, y: 7.47, h: 3.06, dv: 0, hb: false, ie: false },
            "07": { x: 22.25, y: 57.85, h: 3.23, dv: 0, hb: false, ie: false },
            "08": { x: 9.24, y: -71.11, h: 3.17, dv: 0, hb: false, ie: false },
            "09": { x: 9.16, y: 75.45, h: 3.19, dv: 0, hb: false, ie: false },
            "10": { x: 23.22, y: -29.41, h: 3.10, dv: 0, hb: false, ie: false },
            "11": { x: 25.07, y: 7.71, h: 3.18, dv: 0, hb: false, ie: false }
        },
        'Kickoff': {
            '01': { x: 3, y: -30, h: 0, dv: 0, hb: false, ie: false },
            '02': { x: 3, y: -10, h: 0, dv: 0, hb: false, ie: false },
            '03': { x: 3, y: 10, h: 0, dv: 0, hb: false, ie: false },
            '04': { x: 3, y: 40, h: 0, dv: 0, hb: false, ie: false },
            '05': { x: 3, y: -20, h: 0, dv: 0, hb: false, ie: false },
            '06': { x: 10, y: 0, h: 0, dv: 0, hb: false, ie: false },
            '07': { x: 3, y: 20, h: 0, dv: 0, hb: false, ie: false },
            '08': { x: 3, y: -60, h: 0, dv: 0, hb: false, ie: false },
            '09': { x: 3, y: 60, h: 0, dv: 0, hb: false, ie: false },
            '10': { x: 3, y: -40, h: 0, dv: 0, hb: false, ie: false },
            '11': { x: 3, y: 30, h: 0, dv: 0, hb: false, ie: false }
        }
        // … add more defensive plays as needed …
    };

    const awayTeam = {
        name: 'Dallas Cowboysss',
        rosterOffense: [
            { id: '01', name: 'Billy Bob', position: 'C', speed: 88, strength: 72 },
            { id: '02', name: 'gomer Pyle', position: 'RG', speed: 89, strength: 82 },
            { id: '03', name: 'Nick Satan', position: 'LG', speed: 93, strength: 78 },
            { id: '04', name: 'Tom Cruisen', position: 'RT', speed: 90, strength: 75 },
            { id: '05', name: 'Whirley Pop', position: 'LT', speed: 87, strength: 76 },
            { id: '06', name: 'Ed VanHalen', position: 'QB', speed: 75, strength: 95 },
            { id: '07', name: 'Neal Pert', position: 'TE', speed: 60, strength: 96 },
            { id: '08', name: 'Prince', position: 'RB', speed: 58, strength: 94 },
            { id: '09', name: 'James Hetfielder', position: 'FB', speed: 62, strength: 92 },
            { id: '10', name: 'The Joker', position: 'WR1', speed: 92, strength: 80 },
            { id: '11', name: 'George Washington', position: 'WR2', speed: 83, strength: 77 }
        ],
        rosterDefense: [
            { id: '01', name: 'Boo Bop', position: 'LDE', speed: 95, strength: 80 },
            { id: '02', name: 'Simpy Dell', position: 'LDT', speed: 55, strength: 90 },
            { id: '03', name: 'Elon Musker', position: 'RDT', speed: 70, strength: 85 },
            { id: '04', name: 'Horse Whisper', position: 'RDE', speed: 80, strength: 70 },
            { id: '05', name: 'Boo Boo Mason', position: 'OLB', speed: 100, strength: 100 },
            { id: '06', name: 'Flat Earth', position: 'MLB', speed: 85, strength: 95 },
            { id: '07', name: 'Joe Debiden', position: 'OLB', speed: 75, strength: 80 },
            { id: '08', name: 'Rocket Man', position: 'LCB', speed: 90, strength: 60 },
            { id: '09', name: 'One Eyed Duck', position: 'RCB', speed: 80, strength: 100 },
            { id: '10', name: 'Moses', position: 'SS', speed: 85, strength: 75 },
            { id: '11', name: 'Jesus', position: 'FS', speed: 95, strength: 90 }
        ],
        playbooks: {
            offensive: offensivePlaysAway,
            defensive: defensivePlaysAway
        }
    };

    return awayTeam;
});
