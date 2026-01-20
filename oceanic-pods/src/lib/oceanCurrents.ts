/**
 * Major oceanic currents for visualization on the globe
 * Based on real-world ocean circulation patterns
 */

export interface OceanCurrent {
    name: string;
    coords: Array<{ lat: number; lng: number }>;
    color: string;
    speed: number; // Animation speed multiplier
    temperature: 'warm' | 'cold';
}

export const OCEAN_CURRENTS: OceanCurrent[] = [
    // Gulf Stream - Warm current flowing from Gulf of Mexico to North Atlantic
    {
        name: 'Gulf Stream',
        coords: [
            { lat: 25, lng: -80 },
            { lat: 30, lng: -75 },
            { lat: 35, lng: -70 },
            { lat: 40, lng: -60 },
            { lat: 45, lng: -50 },
            { lat: 50, lng: -40 },
            { lat: 52, lng: -30 },
        ],
        color: 'rgba(255, 100, 50, 0.4)',
        speed: 1.2,
        temperature: 'warm',
    },

    // Kuroshio Current - Warm current in Western Pacific
    {
        name: 'Kuroshio Current',
        coords: [
            { lat: 15, lng: 125 },
            { lat: 20, lng: 128 },
            { lat: 25, lng: 130 },
            { lat: 30, lng: 135 },
            { lat: 35, lng: 140 },
            { lat: 40, lng: 145 },
        ],
        color: 'rgba(255, 120, 60, 0.4)',
        speed: 1.3,
        temperature: 'warm',
    },

    // Humboldt Current - Cold current along South American coast
    {
        name: 'Humboldt Current',
        coords: [
            { lat: -5, lng: -82 },
            { lat: -10, lng: -80 },
            { lat: -15, lng: -78 },
            { lat: -20, lng: -75 },
            { lat: -25, lng: -73 },
            { lat: -30, lng: -72 },
            { lat: -35, lng: -73 },
            { lat: -40, lng: -75 },
        ],
        color: 'rgba(50, 150, 255, 0.4)',
        speed: 0.9,
        temperature: 'cold',
    },

    // Antarctic Circumpolar Current - Massive circular current around Antarctica
    {
        name: 'Antarctic Circumpolar',
        coords: [
            { lat: -55, lng: -60 },
            { lat: -60, lng: 0 },
            { lat: -58, lng: 60 },
            { lat: -60, lng: 120 },
            { lat: -58, lng: 180 },
            { lat: -60, lng: -120 },
            { lat: -55, lng: -60 },
        ],
        color: 'rgba(100, 200, 255, 0.4)',
        speed: 1.5,
        temperature: 'cold',
    },

    // North Atlantic Drift - Extension of Gulf Stream
    {
        name: 'North Atlantic Drift',
        coords: [
            { lat: 52, lng: -30 },
            { lat: 55, lng: -20 },
            { lat: 58, lng: -10 },
            { lat: 60, lng: 0 },
            { lat: 62, lng: 10 },
        ],
        color: 'rgba(255, 90, 40, 0.4)',
        speed: 1.0,
        temperature: 'warm',
    },

    // Agulhas Current - Warm current along South African coast
    {
        name: 'Agulhas Current',
        coords: [
            { lat: -27, lng: 33 },
            { lat: -30, lng: 32 },
            { lat: -33, lng: 28 },
            { lat: -36, lng: 25 },
            { lat: -39, lng: 22 },
        ],
        color: 'rgba(255, 110, 70, 0.4)',
        speed: 1.4,
        temperature: 'warm',
    },

    // California Current - Cold current along western North America
    {
        name: 'California Current',
        coords: [
            { lat: 48, lng: -125 },
            { lat: 42, lng: -125 },
            { lat: 36, lng: -122 },
            { lat: 30, lng: -118 },
            { lat: 24, lng: -115 },
        ],
        color: 'rgba(60, 160, 255, 0.4)',
        speed: 0.8,
        temperature: 'cold',
    },

    // Brazil Current - Warm current along eastern South America
    {
        name: 'Brazil Current',
        coords: [
            { lat: -10, lng: -35 },
            { lat: -15, lng: -37 },
            { lat: -20, lng: -39 },
            { lat: -25, lng: -42 },
            { lat: -30, lng: -45 },
            { lat: -35, lng: -48 },
        ],
        color: 'rgba(255, 100, 55, 0.4)',
        speed: 1.1,
        temperature: 'warm',
    },

    // Canary Current - Cold current along northwest Africa
    {
        name: 'Canary Current',
        coords: [
            { lat: 30, lng: -15 },
            { lat: 25, lng: -17 },
            { lat: 20, lng: -18 },
            { lat: 15, lng: -20 },
            { lat: 10, lng: -22 },
        ],
        color: 'rgba(70, 170, 255, 0.4)',
        speed: 0.9,
        temperature: 'cold',
    },

    // East Australian Current - Warm current along eastern Australia
    {
        name: 'East Australian Current',
        coords: [
            { lat: -15, lng: 147 },
            { lat: -20, lng: 152 },
            { lat: -25, lng: 154 },
            { lat: -30, lng: 155 },
            { lat: -35, lng: 152 },
            { lat: -40, lng: 150 },
        ],
        color: 'rgba(255, 95, 45, 0.4)',
        speed: 1.2,
        temperature: 'warm',
    },
];
