const fs = require('fs');
try {
    let intMsg = fs.readFileSync('src/events/interactionCreate.ts', 'utf8');

    // Fix the stray } right after const { customId } = interaction;
    intMsg = intMsg.replace(/async function handleButton\(interaction: ButtonInteraction\) \{\n\s*const \{ customId \} = interaction;\n\s*\}/m, 
        'async function handleButton(interaction: ButtonInteraction) {\n    const { customId } = interaction;');

    fs.writeFileSync('src/events/interactionCreate.ts', intMsg);
    console.log('Fixed stray brace');
} catch (e) { console.error(e); }
