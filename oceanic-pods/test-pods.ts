import { getLivePods } from './src/lib/sonar';

async function test() {
    console.log("Fetching live pods...");
    const pods = await getLivePods();
    console.log(`Total pods found: ${pods.length}`);
    pods.forEach(p => {
        console.log(`- ${p.name} at (${p.lat}, ${p.lng})`);
    });
}

test();
