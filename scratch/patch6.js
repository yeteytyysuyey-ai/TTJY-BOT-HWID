const fs = require('fs');
try {
    // ==== messageCreate.ts ====
    let msg = fs.readFileSync('src/events/messageCreate.ts', 'utf8');

    // 1. Restore insert with discord_id
    msg = msg.replace(
        /insert\(\[\{\s*custom_name: keyName,\s*key_value: generatedKey,\s*hwids: \[\]\s*\}\]\)/g,
        'insert([{ discord_id: targetUserId, custom_name: keyName, key_value: generatedKey, hwids: [] }])'
    );

    // 2. Restore !keys to use Supabase only
    const keysRegex = /let userKeys: any\[\] = \[\];\s*const pandaKeys = await panda\.getKeysByDiscord\(targetUserId\);[\s\S]*?hwids: dbK\?\.hwids \|\| \[\]\n\s*\};\n\s*\}\);\n\s*\}/;
    const keysReplacement = `let userKeys: any[] = [];
            if (supabase) {
                const { data } = await supabase.from('keys').select('*').eq('discord_id', targetUserId);
                if (data) userKeys = data;
            }`;
    msg = msg.replace(keysRegex, keysReplacement);

    // 3. Restore !key to use Supabase only
    const keyFetchRegex = /let keyRecord: any = null;\s*let pandaOwnerId: string \| null = null;[\s\S]*?hwids: \[\] \};\n\s*\}\n\s*\}/;
    const keyFetchReplacement = `let keyRecord: any = null;
            if (supabase) {
                const { data } = await supabase.from('keys').select('*').eq('key_value', keyValue);
                if (data && data.length > 0) keyRecord = data[0];
            }`;
    msg = msg.replace(keyFetchRegex, keyFetchReplacement);

    fs.writeFileSync('src/events/messageCreate.ts', msg);
    console.log('messageCreate.ts restored to use discord_id');
} catch (e) { console.error('msgErr', e); }

try {
    // ==== interactionCreate.ts ====
    let intMsg = fs.readFileSync('src/events/interactionCreate.ts', 'utf8');

    // 1. Restore Cash Card insert with discord_id
    intMsg = intMsg.replace(
        /const \{ error: insertErr \} = await supabase\.from\('keys'\)\.insert\(\[\{\s*custom_name: customName,\s*key_value: generatedKey,\s*hwids: \[\]\s*\}\]\);/,
        `const { error: insertErr } = await supabase.from('keys').insert([{
                        discord_id: userId,
                        custom_name: customName,
                        key_value: generatedKey,
                        hwids: []
                    }]);`
    );

    // 2. Restore Buy insert with discord_id
    intMsg = intMsg.replace(
        /const \{ error: dbError \} = await supabase\s*\.from\('keys'\)\s*\.insert\(\[\{\s*custom_name: customName,\s*key_value: generatedKey,\s*hwids: \[\]\s*\}\]\);/,
        `const { error: dbError } = await supabase
                    .from('keys')
                    .insert([{
                        discord_id: interaction.user.id,
                        custom_name: customName,
                        key_value: generatedKey,
                        hwids: []
                    }]);`
    );

    // 3. Restore /panel keys fetch
    const pkeysRegex = /const pandaKeys = await panda\.getKeysByDiscord\(interaction\.user\.id\);[\s\S]*?hwids: dbK\?\.hwids \|\| \[\]\n\s*\};\n\s*\}\);\n\s*\}/;
    const pkeysReplacement = `const { data, error } = await supabase.from('keys').select('*').eq('discord_id', interaction.user.id);
                    if (!error && data) {
                        userKeys = data;
                    }`;
    intMsg = intMsg.replace(pkeysRegex, pkeysReplacement);

    // 4. Restore ownership checks for modals
    const ownershipRegex = /const pandaKeyRes = await panda\.getKey\(keyValue\);[\s\S]*?\.eq\('key_value', keyValue\);/;
    const ownershipReplacement = `const { data, error: fetchError } = await supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);`;
    intMsg = intMsg.replace(ownershipRegex, ownershipReplacement);

    fs.writeFileSync('src/events/interactionCreate.ts', intMsg);
    console.log('interactionCreate.ts restored to use discord_id');
} catch (e) { console.error('intErr', e); }
