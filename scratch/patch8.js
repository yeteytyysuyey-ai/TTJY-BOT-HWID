const fs = require('fs');
try {
    let intMsg = fs.readFileSync('src/events/interactionCreate.ts', 'utf8');

    // 1. Remove panelCommand.sessions references
    intMsg = intMsg.replace(
        /if \(panelCommand\.sessions && panelCommand\.sessions\[interaction\.user\.id\]\) \{[\s\S]*?delete panelCommand\.sessions\[interaction\.user\.id\];\s*\}/g,
        ''
    );

    // 2. Fix MessageFlags enum usage
    intMsg = intMsg.replace(/flags: MessageFlags/g, 'flags: MessageFlags.Ephemeral');

    // 3. Remove noHwidValidation from panda options
    intMsg = intMsg.replace(/,\s*noHwidValidation: true/g, '');

    // Let's also restore the 3 HWID logic again because I am doing it on top of the OLD Bot code which I copied!
    // Actually, I already ran patch7.js, so the 3 HWID logic IS applied. But let's check if the panda API hwid logic is still there.
    
    // In old bot, it used panda.checkHwid? No, old bot used Supabase for HWID, just like we want!
    // But it had noHwidValidation in generateKey.

    fs.writeFileSync('src/events/interactionCreate.ts', intMsg);
    console.log('Fixed TS errors in interactionCreate.ts');
} catch (e) { console.error('intErr', e); }
