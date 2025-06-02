// plays.js
//console.log("Loading plays.js...");
// Play definitions for electric football game, with relative coordinates (x: -3 is 3 yards behind LOS)
module.exports = {
    offensivePlays: {
        "I-Formation": {
            "01": { x: -3, y: 0, h: 0, dv: 0, hb: false }, // Center (C)
            "02": { x: -3, y: -10, h: 0, dv: 0, hb: false }, // Right Guard (RG)
            "03": { x: -3, y: 10, h: 0, dv: 0, hb: false }, // Left Guard (LG)
            "04": { x: -3, y: -20, h: 0, dv: 0, hb: false }, // Right Tackle (RT)
            "05": { x: -3, y: 20, h: 0, dv: 0, hb: false }, // Left Tackle (LT)
            "06": { x: -8, y: 0, h: 0, dv: 0, hb: true }, // Quarterback (QB)
            "07": { x: -3, y: 30, h: 0, dv: 0, hb: false }, // Tight End (TE)
            "08": { x: -16, y: 0, h: 0, dv: 0, hb: false }, // Running Back (RB)
            "09": { x: -16, y: 10, h: 0, dv: 0, hb: false }, // Fullback (FB)
            "10": { x: -3, y: -50, h: 0, dv: 0, hb: false }, // Wide Receiver 1 (WR1)
            "11": { x: -3, y: 50, h: 0, dv: 0, hb: false } // Wide Receiver 2 (WR2)
        },
        "Wishbone": {
            "01": { x: -3.00, y: 0.00, h: 0.00, dv: 3, hb: false, ie: false },
            "02": { x: -3.00, y: -9.99, h: 0.00, dv: 23, hb: false, ie: false },
            "03": { x: -3.00, y: 9.99, h: 0.00, dv: 11, hb: false, ie: false },
            "04": { x: -3.00, y: -20.01, h: 0.00, dv: 21, hb: false, ie: false },
            "05": { x: -3.00, y: 20.01, h: 0.00, dv: 82, hb: false, ie: false },
            "06": { x: -12.00, y: 0.00, h: 0.00, dv: 91, hb: true, ie: true },
            "07": { x: -3.00, y: 30.00, h: 0.00, dv: 90, hb: false, ie: true },
            "08": { x: -10.00, y: -9.00, h: 0.00, dv: 57, hb: false, ie: true },
            "09": { x: -16.00, y: 9.99, h: 0.00, dv: 90, hb: false, ie: true },
            "10": { x: -3.00, y: -80.01, h: 0.00, dv: 92, hb: false, ie: true },
            "11": { x: -3.00, y: 80.01, h: 0.00, dv: 98, hb: false, ie: true }
        },
    },
    defensivePlays: {
        "4-3-Standard": {
            // Placeholder, replace with your actual formation
            "01": { x: 3, y: -30, h: 0, dv: 0, hb: false }, // Defensive End (DE, left)
            "02": { x: 3, y: -10, h: 0, dv: 0, hb: false }, // Defensive Tackle (DT, left)
            "03": { x: 3, y: 10, h: 0, dv: 0, hb: false }, // Defensive Tackle (DT, right)
            "04": { x: 3, y: 30, h: 0, dv: 0, hb: false }, // Defensive End (DE, right)
            "05": { x: 3, y: -20, h: 0, dv: 0, hb: false }, // Outside Linebacker (OLB, left)
            "06": { x: 3, y: 0, h: 0, dv: 0, hb: false }, // Middle Linebacker (MLB)
            "07": { x: 3, y: 20, h: 0, dv: 0, hb: false }, // Outside Linebacker (OLB, right)
            "08": { x: 7, y: -60, h: 0, dv: 0, hb: false }, // Cornerback (CB, left)
            "09": { x: 7, y: 60, h: 0, dv: 0, hb: false }, // Cornerback (CB, right)
            "10": { x: 10, y: -30, h: 0, dv: 0, hb: false }, // Strong Safety (SS)
            "11": { x: 10, y: 30, h: 0, dv: 0, hb: false } // Free Safety (FS)
        }
    }
};