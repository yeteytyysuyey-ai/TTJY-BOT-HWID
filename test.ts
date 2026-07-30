import { panda } from './src/panda';

async function run() {
    const key = await panda.getKey('VIP-JQER-O7R3-SAV5-HY8P');
    console.log("Key found:", key);
}

run();
