// awayTeam.js
const offensivePlaysAway = {
    'NYG - Spread': {
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
    }
};

const defensivePlaysAway = {
    '3-4-Base': {
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
    }
};

const awayTeam = {
    name: 'New York Giants',
    // rosterOffense: [
    //     'Daniel Jones',
    //     'Saquon Barkley',
    //     'Kenny Golladay',
    //     'Sterling Shepard',
    //     'Evan Engram',
    //     'Andrew Thomas',
    //     'Nick Gates',
    //     'Will Hernandez',
    //     'Nate Solder',
    //     'Darius Slayton',
    //     'Kadarius Toney'
    // ],
    // rosterDefense: [
    //     'Chucky Wilkins',
    //     'Russ Baum',
    //     'Ben Jumper',
    //     'Kurt Cobain',
    //     'Mr Rogers',
    //     'Joe Rogan',
    //     'Hulk Hogan',
    //     'Omar Picklepop',
    //     'Daniel Armstrong',
    //     'Jeff Lindsey',
    //     'Chris Ogden'
    // ],
    rosterOffense: [
        { id: '01', name: 'Daniel Jones', position: 'C', speed: 84, strength: 70 },
        { id: '02', name: 'Saquon Barkley', position: 'RG', speed: 92, strength: 85 },
        { id: '03', name: 'Kenny Golladay', position: 'LG', speed: 88, strength: 78 },
        { id: '04', name: 'Sterling Shepard', position: 'RT', speed: 86, strength: 74 },
        { id: '05', name: 'Evan Engram', position: 'LT', speed: 85, strength: 76 },
        { id: '06', name: 'Andrew Thomas', position: 'QB', speed: 60, strength: 92 },
        { id: '07', name: 'Nick Gates', position: 'TE', speed: 58, strength: 88 },
        { id: '08', name: 'Will Hernandez', position: 'RB', speed: 62, strength: 86 },
        { id: '09', name: 'Nate Solder', position: 'FB', speed: 60, strength: 85 },
        { id: '10', name: 'Darius Slayton', position: 'WR1', speed: 90, strength: 76 },
        { id: '11', name: 'Kadarius Toney', position: 'WR2', speed: 89, strength: 75 }
    ],

    rosterDefense: [
        { id: '01', name: 'Chucky Wilkins', position: 'LDE', speed: 85, strength: 90 },
        { id: '02', name: 'Russ Baum', position: 'LDT', speed: 80, strength: 85 },
        { id: '03', name: 'Ben Jumper', position: 'RDT', speed: 82, strength: 88 },
        { id: '04', name: 'Kurt Cobain', position: 'RDE', speed: 85, strength: 80 },
        { id: '05', name: 'Mr Rogers', position: 'OLB', speed: 84, strength: 78 },
        { id: '06', name: 'Joe Rogan', position: 'MLB', speed: 82, strength: 87 },
        { id: '07', name: 'Hulk Hogan', position: 'OLB', speed: 75, strength: 95 },
        { id: '08', name: 'Omar Picklepop', position: 'LCB', speed: 88, strength: 80 },
        { id: '09', name: 'Daniel Armstrong', position: 'RCB', speed: 80, strength: 84 },
        { id: '10', name: 'Jeff Lindsey', position: 'SS', speed: 87, strength: 79 },
        { id: '11', name: 'Chris Ogden', position: 'FS', speed: 85, strength: 83 }
    ],

    playbooks: {
        offensive: offensivePlaysAway,
        defensive: defensivePlaysAway
    }
};

module.exports = awayTeam;