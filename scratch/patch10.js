const fs = require('fs');
try {
    let intMsg = fs.readFileSync('src/events/interactionCreate.ts', 'utf8');

    intMsg = intMsg.replace(/flags: MessageFlags\b(?!\.)/g, 'flags: MessageFlags.Ephemeral');
    
    intMsg = intMsg.replace(/if \(undefined && undefined\[interaction\.user\.id\]\)/g, 'if (false)');
    intMsg = intMsg.replace(/delete undefined\[interaction\.user\.id\];/g, '');

    // Remove noHwidValidation
    intMsg = intMsg.replace(/,\s*noHwidValidation:\s*true/g, '');

    fs.writeFileSync('src/events/interactionCreate.ts', intMsg);
    console.log('Fixed TS errors cleanly');
} catch (e) { console.error(e); }
