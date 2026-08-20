const fs = require('fs');
try {
    let intMsg = fs.readFileSync('src/events/interactionCreate.ts', 'utf8');
    intMsg = intMsg.replace(
        /\.update\(\{ hwids: \[hwidValue\] \}\)/g,
        ".update({ hwids: [{ custom_name: customName || 'Unknown', hwid_value: hwidValue }] })"
    );
    fs.writeFileSync('src/events/interactionCreate.ts', intMsg);
    
    let msg = fs.readFileSync('src/events/messageCreate.ts', 'utf8');
    msg = msg.replace(
        /\.update\(\{ hwids: \[hwidValue\] \}\)/g,
        ".update({ hwids: [{ custom_name: 'Admin Added', hwid_value: hwidValue }] })"
    );
    fs.writeFileSync('src/events/messageCreate.ts', msg);
    console.log('patched hwids object format');
} catch(e) { console.error(e); }
