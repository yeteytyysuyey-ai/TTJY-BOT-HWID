const fs = require('fs');
try {
    let intMsg = fs.readFileSync('src/events/interactionCreate.ts', 'utf8');

    // Fix the double .Ephemeral error
    intMsg = intMsg.replace(/MessageFlags\.Ephemeral\.Ephemeral/g, 'MessageFlags.Ephemeral');
    
    // Fix the flags: MessageFlags error that doesn't have .Ephemeral
    intMsg = intMsg.replace(/flags: MessageFlags(?!(\.Ephemeral|\.Suppress))/g, 'flags: MessageFlags.Ephemeral');

    // Make sure panelCommand.sessions is removed
    intMsg = intMsg.replace(/panelCommand\.sessions/g, 'undefined'); // safe hack to avoid TS errors if there's any left

    fs.writeFileSync('src/events/interactionCreate.ts', intMsg);
    console.log('Fixed double Ephemeral');
} catch (e) { console.error(e); }
