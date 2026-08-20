const fs = require('fs');
try {
    let intMsg = fs.readFileSync('src/events/interactionCreate.ts', 'utf8');

    // Remove V2 UI router block
    intMsg = intMsg.replace(/\/\/ V2 UI Router Logic[\s\S]*?\/\/ End here, don't update global state\n\s*case 'hwid': state\.page = 'hwid'; break;\n\s*case 'back': state\.page = 'main'; break;\n\s*case 'add':\n\s*case 'remove':\n\s*case 'reset':\n\s*await interaction\.reply\(\{ content: 'This feature is currently disabled', ephemeral: true \}\);\n\s*return;\n\s*\}\n\s*const newPayload = panelCommand\.renderPanel\(state\);\n\s*newPayload\.ephemeral = true;\n\s*await interaction\.update\(newPayload as any\);\n\s*return;\n\s*\}/g, '');
    
    // Fallback if the above complex regex misses due to subtle changes
    intMsg = intMsg.replace(/\/\/ V2 UI Router Logic[\s\S]*?return;\n\s*\}/m, '');

    // Remove noHwidValidation
    intMsg = intMsg.replace(/,\s*noHwidValidation:\s*false/g, '');

    fs.writeFileSync('src/events/interactionCreate.ts', intMsg);
    console.log('Fixed V2 UI and noHwidValidation');
} catch (e) { console.error(e); }
