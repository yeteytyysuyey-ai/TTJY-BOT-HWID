const fs = require('fs');
try {
    // ==== messageCreate.ts ====
    let msg = fs.readFileSync('src/events/messageCreate.ts', 'utf8');

    // Fix insertions
    msg = msg.replace(
        /insert\(\[\{\s*key_value: generatedKey, hwids: \[\]\s*\}\]\)/g,
        'insert([{ discord_id: targetUserId, custom_name: keyName, key_value: generatedKey, hwids: [] }])'
    );

    // Fix !keys fetching
    const pkeysRegex = /const pandaKeys = await panda\.getKeysByDiscord\(targetUserId\);[\s\S]*?hwid\n\s*\};\n\s*\}\);\n\s*\}/;
    const pkeysReplacement = `const { data } = await supabase.from('keys').select('*').eq('discord_id', targetUserId);
                if (data) userKeys = data;`;
    msg = msg.replace(pkeysRegex, pkeysReplacement);

    // Fix !key fetching
    const pkeyRegex = /const pandaKeyRes = await panda\.getKey\(keyValue\);[\s\S]*?created_at: createdAt\n\s*\};\n\s*\}/;
    const pkeyReplacement = `const { data } = await supabase.from('keys').select('*').eq('key_value', keyValue);
                if (data && data.length > 0) keyRecord = data[0];`;
    msg = msg.replace(pkeyRegex, pkeyReplacement);

    // Re-add stats
    msg = msg.replace(
        /const embed = new EmbedBuilder\(\)/,
        `const uniqueUsers = new Set(keysData.map((k: any) => k.discord_id)).size;
            
            let userListText = '';
            const userGroups: { [key: string]: number } = {};
            for (const k of keysData) {
                if (!userGroups[k.discord_id]) userGroups[k.discord_id] = 0;
                userGroups[k.discord_id]++;
            }

            for (const [discordId, count] of Object.entries(userGroups)) {
                userListText += \`- <@\${discordId}> (\\\`\${discordId}\\\`): **\${count}** key(s)\\n\`;
            }

            if (userListText.length > 1024) {
                userListText = userListText.substring(0, 1000) + '...\\n(Too many users to display)';
            }

            const embed = new EmbedBuilder()`
    );

    msg = msg.replace(
        /\{ name: '👥 จำนวนลูกค้าทั้งหมด', value: `\$\{uniqueUsers\} คน`, inline: true \}/g,
        ''
    );
    msg = msg.replace(
        /\{ name: '📋 รายชื่อลูกค้าและจำนวนคีย์', value: userListText \|\| 'ยังไม่มีข้อมูล' \}/g,
        ''
    );
    // Actually wait, I previously removed them, so I should just insert them back into the addFields
    msg = msg.replace(
        /addFields\([\s\S]*?hwids\.length > 0\)\.length;\s*const embed = new EmbedBuilder\(\)[\s\S]*?addFields\(/,
        `addFields(
                    { name: '👥 จำนวนลูกค้าทั้งหมด', value: \`\${uniqueUsers} คน\`, inline: true },`
    );

    fs.writeFileSync('src/events/messageCreate.ts', msg);
    console.log('messageCreate.ts patched');
} catch (e) { console.error('msgErr', e); }

try {
    // ==== interactionCreate.ts ====
    let intMsg = fs.readFileSync('src/events/interactionCreate.ts', 'utf8');

    // Fix insertions
    // 1. Cash Card insertion
    intMsg = intMsg.replace(
        /const \{ error: insertErr \} = await supabase\.from\('keys'\)\.insert\(\[\{\s*key_value: generatedKey,\s*hwids: \[\]\s*\}\]\);/,
        `const { error: insertErr } = await supabase.from('keys').insert([{
                        discord_id: userId,
                        custom_name: customName,
                        key_value: generatedKey,
                        hwids: []
                    }]);`
    );

    // 2. Buy insertion
    intMsg = intMsg.replace(
        /const \{ error: dbError \} = await supabase\s*\.from\('keys'\)\s*\.insert\(\[\{\s*key_value: generatedKey,\s*hwids: \[\]\s*\}\]\);/,
        `const { error: dbError } = await supabase
                    .from('keys')
                    .insert([{
                        discord_id: interaction.user.id,
                        custom_name: customName,
                        key_value: generatedKey,
                        hwids: []
                    }]);`
    );

    // Fix /panel fetching
    const intKeysRegex = /const pandaKeys = await panda\.getKeysByDiscord\(interaction\.user\.id\);[\s\S]*?hwid: hwidVal\n\s*\};\n\s*\}\);\n\s*\}/;
    const intKeysReplacement = `const { data, error } = await supabase.from('keys').select('*').eq('discord_id', interaction.user.id);
                    if (!error && data) {
                        userKeys = data;
                    }`;
    intMsg = intMsg.replace(intKeysRegex, intKeysReplacement);

    // Fix ownership check
    const intOwnershipRegex = /const pandaKeyRes = await panda\.getKey\(keyValue\);[\s\S]*?\.eq\('key_value', keyValue\);/;
    const intOwnershipReplacement = `const { data, error: fetchError } = await supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);`;
    intMsg = intMsg.replace(intOwnershipRegex, intOwnershipReplacement);

    fs.writeFileSync('src/events/interactionCreate.ts', intMsg);
    console.log('interactionCreate.ts patched');
} catch (e) { console.error('intErr', e); }
