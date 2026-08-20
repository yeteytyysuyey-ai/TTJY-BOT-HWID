const fs = require('fs');
try {
    // ==== messageCreate.ts ====
    let msg = fs.readFileSync('src/events/messageCreate.ts', 'utf8');

    // 1. Remove discord_id from inserts
    msg = msg.replace(
        /discord_id: targetUserId,\s*custom_name: keyName,\s*key_value: generatedKey,\s*hwids: \[\]/g,
        'custom_name: keyName, key_value: generatedKey, hwids: []'
    );

    // 2. Fix !keys command to use Panda Auth since discord_id is not in DB
    const keysRegex = /let userKeys: any\[\] = \[\];\s*if \(supabase\) \{\s*const \{ data \} = await supabase\.from\('keys'\)\.select\('\*'\)\.eq\('discord_id', targetUserId\);\s*if \(data\) userKeys = data;\s*\}/;
    const keysReplacement = `let userKeys: any[] = [];
            const pandaKeys = await panda.getKeysByDiscord(targetUserId);
            if (pandaKeys && pandaKeys.length > 0) {
                const keyValues = pandaKeys.map((k: any) => k.value || k.key);
                let dbData: any[] = [];
                if (supabase) {
                    const { data } = await supabase.from('keys').select('*').in('key_value', keyValues);
                    if (data) dbData = data;
                }
                userKeys = pandaKeys.map((pk: any) => {
                    const kv = pk.value || pk.key;
                    const dbK = dbData.find((d: any) => d.key_value === kv);
                    return {
                        key_value: kv,
                        custom_name: dbK?.custom_name || pk.note || 'VIP Key',
                        created_at: dbK?.created_at || new Date().toISOString(),
                        hwids: dbK?.hwids || []
                    };
                });
            }`;
    msg = msg.replace(keysRegex, keysReplacement);

    // 3. Fix !key command since discord_id is missing from DB
    const keyRegex = /const embed = new EmbedBuilder\(\)[\s\S]*?\{ name: '👤 เจ้าของ Key', value: keyRecord\.discord_id \? `<@\$\{keyRecord\.discord_id\}> \(\`\$\{keyRecord\.discord_id\}\`\)` : 'ไม่ระบุ', inline: true \},/;
    
    // We need to fetch discordId from Pandauth for !key command
    const keyFetchRegex = /let keyRecord: any = null;\s*if \(supabase\) \{\s*const \{ data \} = await supabase\.from\('keys'\)\.select\('\*'\)\.eq\('key_value', keyValue\);\s*if \(data && data\.length > 0\) keyRecord = data\[0\];\s*\}/;
    const keyFetchReplacement = `let keyRecord: any = null;
            let pandaOwnerId: string | null = null;
            try {
                const pandaRes = await panda.getKey(keyValue);
                if (pandaRes && pandaRes.data) {
                    pandaOwnerId = pandaRes.data.discordId || pandaRes.data.discord_id || null;
                }
            } catch(e) {}
            
            if (supabase) {
                const { data } = await supabase.from('keys').select('*').eq('key_value', keyValue);
                if (data && data.length > 0) {
                    keyRecord = data[0];
                    if (pandaOwnerId) keyRecord.discord_id = pandaOwnerId;
                } else if (pandaOwnerId) {
                    // Key exists in Panda but not our DB
                    keyRecord = { discord_id: pandaOwnerId, key_value: keyValue, hwids: [] };
                }
            }`;
    msg = msg.replace(keyFetchRegex, keyFetchReplacement);

    fs.writeFileSync('src/events/messageCreate.ts', msg);
    console.log('messageCreate.ts patched for no discord_id');
} catch (e) { console.error(e); }

try {
    // ==== interactionCreate.ts ====
    let intMsg = fs.readFileSync('src/events/interactionCreate.ts', 'utf8');

    // 1. Remove discord_id from Cash Card insert
    intMsg = intMsg.replace(
        /discord_id: userId,\s*custom_name: customName,\s*key_value: generatedKey,\s*hwids: \[\]/g,
        'custom_name: customName, key_value: generatedKey, hwids: []'
    );

    // 2. Remove discord_id from Buy insert
    intMsg = intMsg.replace(
        /discord_id: interaction\.user\.id,\s*custom_name: customName,\s*key_value: generatedKey,\s*hwids: \[\]/g,
        'custom_name: customName, key_value: generatedKey, hwids: []'
    );

    // 3. Fix /panel keys fetch
    const pkeysRegex = /const \{ data, error \} = await supabase\.from\('keys'\)\.select\('\*'\)\.eq\('discord_id', interaction\.user\.id\);\s*if \(!error && data\) \{\s*userKeys = data;\s*\}/;
    const pkeysReplacement = `const pandaKeys = await panda.getKeysByDiscord(interaction.user.id);
                    if (pandaKeys && pandaKeys.length > 0) {
                        const keyValues = pandaKeys.map((k: any) => k.value || k.key);
                        let dbData: any[] = [];
                        if (supabase) {
                            const { data } = await supabase.from('keys').select('*').in('key_value', keyValues);
                            if (data) dbData = data;
                        }
                        userKeys = pandaKeys.map((pk: any) => {
                            const kv = pk.value || pk.key;
                            const dbK = dbData.find((d: any) => d.key_value === kv);
                            return {
                                key_value: kv,
                                custom_name: dbK?.custom_name || pk.note || 'VIP Key',
                                created_at: dbK?.created_at || new Date().toISOString(),
                                hwids: dbK?.hwids || []
                            };
                        });
                    }`;
    intMsg = intMsg.replace(pkeysRegex, pkeysReplacement);

    // 4. Fix ownership checks for modals
    const ownershipRegex = /const \{ data, error: fetchError \} = await supabase\s*\.from\('keys'\)\s*\.select\('\*'\)\s*\.eq\('key_value', keyValue\)\s*\.eq\('discord_id', interaction\.user\.id\);/g;
    const ownershipReplacement = `const pandaKeyRes = await panda.getKey(keyValue);
            if (!pandaKeyRes || !pandaKeyRes.data || (pandaKeyRes.data.discordId !== interaction.user.id && pandaKeyRes.data.discord_id !== interaction.user.id)) {
                return interaction.editReply('❌ Invalid key or you do not own this key.');
            }
            const { data, error: fetchError } = await supabase.from('keys').select('*').eq('key_value', keyValue);`;
    intMsg = intMsg.replace(ownershipRegex, ownershipReplacement);

    fs.writeFileSync('src/events/interactionCreate.ts', intMsg);
    console.log('interactionCreate.ts patched for no discord_id');
} catch (e) { console.error(e); }
