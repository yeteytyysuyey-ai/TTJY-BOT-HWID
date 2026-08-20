const fs = require('fs');
try {
    let intMsg = fs.readFileSync('src/events/interactionCreate.ts', 'utf8');

    // 1. Fix undefined.get
    intMsg = intMsg.replace(/const state = undefined\.get\(interaction\.user\.id\);/g, 'const state = null; // Removed V2 state');

    // 2. Replace flags: MessageFlags.Ephemeral with ephemeral: true
    intMsg = intMsg.replace(/flags: MessageFlags\.Ephemeral/g, 'ephemeral: true');

    // 3. Fix payload.flags = payload.flags | MessageFlags.Ephemeral
    intMsg = intMsg.replace(/payload\.flags = payload\.flags \| MessageFlags\.Ephemeral;/g, 'payload.ephemeral = true;');

    // 4. Remove noHwidValidation
    intMsg = intMsg.replace(/,\s*noHwidValidation:\s*true/g, '');

    fs.writeFileSync('src/events/interactionCreate.ts', intMsg);
    console.log('Fixed TS errors again');
} catch (e) { console.error(e); }
