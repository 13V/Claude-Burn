export interface WhalePod {
    id: string;
    species: string;
    count: number;
    lat: number;
    lng: number;
    status: 'Feeding' | 'Migrating' | 'Resting' | 'Vocalizing';
    depth: number;
    name: string;
    description: string;
    heading: number; // Degrees 0-360
    destination: string;
    destLat: number;
    destLng: number;
}

export const MOCK_PODS: WhalePod[] = [
    {
        id: 'humpback-1',
        name: 'Aurora Pod',
        species: 'Humpback',
        count: 3,
        lat: 44.5,
        lng: -63.5,
        status: 'Migrating',
        depth: 45,
        description: 'A small family unit migrating south for the winter. Led by a dominant female.',
        heading: 195,
        destination: 'Sargasso Sea',
        destLat: 25.0,
        destLng: -70.0
    },
    {
        id: 'orca-1',
        name: 'Shadow Pack',
        species: 'Orca',
        count: 12,
        lat: 48.5,
        lng: -123.1,
        status: 'Feeding',
        depth: 12,
        description: 'Highly coordinated hunting unit sighted off the coast of Vancouver Island.',
        heading: 45,
        destination: 'Inside Passage',
        destLat: 52.0,
        destLng: -128.0
    },
    {
        id: 'blue-1',
        name: 'The Titan',
        species: 'Blue Whale',
        count: 1,
        lat: 33.7,
        lng: -118.4,
        status: 'Resting',
        depth: 80,
        description: 'A massive lone blue whale resting in the deep canyons of the Santa Monica Basin.',
        heading: 270,
        destination: 'Open Pacific',
        destLat: 30.0,
        destLng: -140.0
    },
    {
        id: 'sperm-1',
        name: 'Abyss Hunter',
        species: 'Sperm Whale',
        count: 1,
        lat: -15.2,
        lng: -75.8,
        status: 'Vocalizing',
        depth: 1200,
        description: 'A large bull sperm whale performing deep-sea clicks for echolocation.',
        heading: 10,
        destination: 'Challenger Deep',
        destLat: 11.3,
        destLng: 142.2
    },
    {
        id: 'minke-1',
        name: 'Northern Guardian',
        species: 'Minke',
        count: 2,
        lat: 42.1,
        lng: -70.1,
        status: 'Feeding',
        depth: 15,
        description: 'Small group of minke whales feeding in the productive waters of the North Atlantic.',
        heading: 340,
        destination: 'Bay of Fundy',
        destLat: 45.0,
        destLng: -66.0
    },
    {
        id: 'gray-1',
        name: 'Coastal Traveler',
        species: 'Gray Whale',
        count: 5,
        lat: 34.0,
        lng: -120.0,
        status: 'Migrating',
        depth: 20,
        description: 'Gray whales following the coastline on their epic migration to Baja California.',
        heading: 160,
        destination: 'Scammon\'s Lagoon',
        destLat: 27.8,
        destLng: -114.2
    },
    {
        id: 'humpback-2',
        name: 'Azure Song',
        species: 'Humpback',
        count: 4,
        lat: -20.5,
        lng: 148.5,
        status: 'Vocalizing',
        depth: 30,
        description: 'Singing males heard off the Great Barrier Reef during mating season.',
        heading: 0,
        destination: 'Antarctic Waters',
        destLat: -60.0,
        destLng: 150.0
    },
    {
        id: 'orca-2',
        name: 'Glacier Squad',
        species: 'Orca',
        count: 8,
        lat: 60.0,
        lng: -145.0,
        status: 'Feeding',
        depth: 50,
        description: 'Resident orcas tracking salmon runs in Prince William Sound.',
        heading: 290,
        destination: 'Bering Sea',
        destLat: 65.0,
        destLng: -170.0
    },
    {
        id: 'blue-2',
        name: 'Sapphire Giant',
        species: 'Blue Whale',
        count: 2,
        lat: -34.5,
        lng: 115.1,
        status: 'Feeding',
        depth: 40,
        description: 'Pair of blue whales feeding on krill swarms in the Perth Canyon.',
        heading: 220,
        destination: 'Southern Ocean',
        destLat: -55.0,
        destLng: 110.0
    },
    {
        id: 'sperm-2',
        name: 'Monolith',
        species: 'Sperm Whale',
        count: 1,
        lat: 38.5,
        lng: -28.5,
        status: 'Resting',
        depth: 60,
        description: 'A large male sperm whale logging at the surface near the Azores.',
        heading: 90,
        destination: 'Mediterranean',
        destLat: 36.0,
        destLng: 5.0
    },
    {
        id: 'minke-2',
        name: 'Arctic Scout',
        species: 'Minke',
        count: 1,
        lat: 70.0,
        lng: 20.0,
        status: 'Migrating',
        depth: 10,
        description: 'Lone minke whale moving through the fjords of northern Norway.',
        heading: 180,
        destination: 'English Channel',
        destLat: 50.0,
        destLng: -1.0
    },
    {
        id: 'gray-2',
        name: 'Dusk Pod',
        species: 'Gray Whale',
        count: 3,
        lat: 55.0,
        lng: -160.0,
        status: 'Feeding',
        depth: 25,
        description: 'Family of gray whales sifting through seafloor sediment for amphipods.',
        heading: 30,
        destination: 'Chukchi Sea',
        destLat: 70.0,
        destLng: -170.0
    },
    {
        id: 'humpback-3',
        name: 'Echo Pod',
        species: 'Humpback',
        count: 2,
        lat: 21.0,
        lng: -157.0,
        status: 'Resting',
        depth: 15,
        description: 'A mother and calf resting in the shallow, warm waters of Hawaii.',
        heading: 315,
        destination: 'Alaska',
        destLat: 58.0,
        destLng: -135.0
    },
    {
        id: 'orca-3',
        name: 'Vortex Pack',
        species: 'Orca',
        count: 15,
        lat: -40.0,
        lng: 175.0,
        status: 'Migrating',
        depth: 40,
        description: 'Large pack of transient orcas moving through Cook Strait, New Zealand.',
        heading: 200,
        destination: 'South Island',
        destLat: -45.0,
        destLng: 170.0
    }
];

const SPECIES_MAP: Record<string, string> = {
    'Humpback': 'Megaptera novaeangliae',
    'Orca': 'Orcinus orca',
    'Blue Whale': 'Balaenoptera musculus',
    'Sperm Whale': 'Physeter macrocephalus',
    'Minke': 'Balaenoptera acutorostrata',
    'Gray Whale': 'Eschrichtius robustus',
    'Fin Whale': 'Balaenoptera physalus',
    'Sei Whale': 'Balaenoptera borealis',
    'Right Whale': 'Eubalaena glacialis',
    'Beluga': 'Delphinapterus leucas',
    'Narwhal': 'Monodon monoceros',
    'Bowhead Whale': 'Balaena mysticetus',
    'Bottlenose Whale': 'Hyperoodon ampullatus'
};

export async function getLivePods(): Promise<WhalePod[]> {
    try {
        const fetchPromises = Object.entries(SPECIES_MAP).map(async ([commonName, scientificName]) => {
            try {
                const url = `https://api.obis.org/v3/occurrence?scientificname=${encodeURIComponent(scientificName)}&size=10&order=eventDate`;
                const response = await fetch(url);
                if (!response.ok) return [];
                const data = await response.json();

                if (!data.results) return [];

                return data.results
                    .filter((r: any) => r.decimalLatitude != null && r.decimalLongitude != null)
                    .map((record: any, index: number) => ({
                        id: `${commonName.toLowerCase().replace(' ', '-')}-${index}-${record.id || Math.random().toString(36).substr(2, 9)}`,
                        name: `${commonName} ${record.individualCount || 'Pod'}`,
                        species: commonName,
                        count: parseInt(record.individualCount) || Math.floor(Math.random() * 5) + 2,
                        lat: record.decimalLatitude + (Math.random() - 0.5) * 1.5,
                        lng: record.decimalLongitude + (Math.random() - 0.5) * 1.5,
                        status: record.behavior || (['Feeding', 'Migrating', 'Resting', 'Vocalizing'][Math.floor(Math.random() * 4)]),
                        depth: record.depth || Math.floor(Math.random() * 100) + 10,
                        description: `Real-world sighting from OBIS Database. Basis of record: ${record.basisOfRecord}. Sighted on ${record.eventDate || 'unknown date'}.`,
                        heading: Math.floor(Math.random() * 360),
                        destination: 'Unknown Destination',
                        destLat: record.decimalLatitude + (Math.random() - 0.5) * 10,
                        destLng: record.decimalLongitude + (Math.random() - 0.5) * 10
                    }));
            } catch (e) {
                console.warn(`Error fetching ${commonName}:`, e);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        const allPods = results.flat();

        console.log(`Fetched ${allPods.length} live pods from OBIS.`);

        // If we still have very few, supplement with MOCK_PODS
        if (allPods.length < 5) {
            return [...allPods, ...MOCK_PODS];
        }

        return allPods;
    } catch (error) {
        console.error("Critical error fetching live pods:", error);
        return MOCK_PODS;
    }
}
