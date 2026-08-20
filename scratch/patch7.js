const fs = require('fs');

try {
    // ==== interactionCreate.ts ====
    let intMsg = fs.readFileSync('src/events/interactionCreate.ts', 'utf8');

    // 1. User Add HWID (modal_add_hwid)
    const userAddRegex = /\/\/ 2\. Enforce 1 HWID per key policy[\s\S]*?\.eq\('id', keyRecord\.id\);/m;
    const userAddReplacement = `// 2. Enforce up to 3 HWIDs per key
            let currentHwids = keyRecord.hwids || [];
            
            if (currentHwids.find((h: any) => h.hwid_value === hwidValue)) {
                return interaction.editReply(\`❌ **This HWID is already bound to this key!**\`);
            }

            if (currentHwids.length >= 3) {
                return interaction.editReply(\`❌ **Limit Reached!**\\nThis key already has 3 HWIDs bound to it (Max: 3).\\nPlease remove an existing HWID first.\`);
            }

            currentHwids.push({ custom_name: 'Device', hwid_value: hwidValue });

            // 3. Write HWID to DB
            const { error: updateError } = await supabase
                .from('keys')
                .update({ hwids: currentHwids })
                .eq('id', keyRecord.id);`;
    intMsg = intMsg.replace(userAddRegex, userAddReplacement);

    // 2. User Show HWID (modal_show_hwid)
    const userShowRegex = /if \(!\(keyRecord\.hwids && keyRecord\.hwids\.length > 0 \? \(keyRecord\.hwids\[0\]\.hwid_value \|\| keyRecord\.hwids\[0\]\) : null\)\) \{[\s\S]*?\)\}\`\);/m;
    const userShowReplacement = `if (!keyRecord.hwids || keyRecord.hwids.length === 0) {
                return interaction.editReply(\`**Key:** \\\`\${keyValue}\\\`\\n\\n⚠️ No HWID is currently bound to this key.\\nUse **Add HWID** to bind your device.\`);
            }

            let hwidList = keyRecord.hwids.map((h: any, i: number) => \`\${i+1}. \\\`\${h.hwid_value || h}\\\`\`).join('\\n');
            return interaction.editReply(\`**Key:** \\\`\${keyValue}\\\`\\n\\n**Bound HWIDs:**\\n\${hwidList}\`);`;
    intMsg = intMsg.replace(userShowRegex, userShowReplacement);

    // 3. User Remove HWID (modal_remove_hwid)
    const userRemoveRegex = /if \(\(keyRecord\.hwids && keyRecord\.hwids\.length > 0 \? \(keyRecord\.hwids\[0\]\.hwid_value \|\| keyRecord\.hwids\[0\]\) : null\) !== hwidValue\) \{[\s\S]*?\.eq\('id', keyRecord\.id\);/m;
    const userRemoveReplacement = `let currentHwids = keyRecord.hwids || [];
            const targetIndex = currentHwids.findIndex((h: any) => (h.hwid_value || h) === hwidValue);
            
            if (targetIndex === -1) {
                return interaction.editReply('That HWID is not bound to this key.');
            }

            currentHwids.splice(targetIndex, 1);

            const { error: updateError } = await supabase
                .from('keys')
                .update({ hwids: currentHwids })
                .eq('id', keyRecord.id);`;
    intMsg = intMsg.replace(userRemoveRegex, userRemoveReplacement);

    // 4. Admin Add HWID (modal_admin_add_hwid)
    const adminAddRegex = /\/\/ Overwrite HWID \(admin can force-bind\)[\s\S]*?\.eq\('id', keyRecord\.id\);/m;
    const adminAddReplacement = `// Append HWID (Admin can bypass some limits but let's keep 3 max for safety)
            let currentHwids = keyRecord.hwids || [];
            if (!currentHwids.find((h: any) => (h.hwid_value || h) === hwidValue)) {
                if (currentHwids.length >= 3) {
                    return interaction.editReply(\`❌ Key \\\`\${keyValue}\\\` already has 3 HWIDs. Cannot add more.\`);
                }
                currentHwids.push({ custom_name: 'Device', hwid_value: hwidValue });
            }

            const { error } = await supabase.from('keys').update({ hwids: currentHwids }).eq('id', keyRecord.id);`;
    intMsg = intMsg.replace(adminAddRegex, adminAddReplacement);

    // 5. Admin Remove HWID (modal_admin_del_hwid)
    const adminDelRegex = /if \(\(keyRecord\.hwids && keyRecord\.hwids\.length > 0 \? \(keyRecord\.hwids\[0\]\.hwid_value \|\| keyRecord\.hwids\[0\]\) : null\) !== hwidValue\) \{[\s\S]*?\.eq\('id', keyRecord\.id\);/m;
    const adminDelReplacement = `let currentHwids = keyRecord.hwids || [];
            const targetIndex = currentHwids.findIndex((h: any) => (h.hwid_value || h) === hwidValue);
            
            if (targetIndex === -1) {
                return interaction.editReply(\`❌ HWID \\\`\${hwidValue}\\\` is not bound to this key.\`);
            }

            currentHwids.splice(targetIndex, 1);

            const { error } = await supabase.from('keys').update({ hwids: currentHwids }).eq('id', keyRecord.id);`;
    intMsg = intMsg.replace(adminDelRegex, adminDelReplacement);

    fs.writeFileSync('src/events/interactionCreate.ts', intMsg);
    console.log('interactionCreate.ts updated for 3 HWIDs');
} catch (e) { console.error('intErr', e); }

try {
    // ==== messageCreate.ts ====
    let msg = fs.readFileSync('src/events/messageCreate.ts', 'utf8');

    // 1. !addhwid command
    const addhwidRegex = /\/\/ Admin can force-overwrite existing HWID[\s\S]*?\.eq\('id', keyRecord\.id\);/m;
    const addhwidReplacement = `let currentHwids = keyRecord.hwids || [];
            if (!currentHwids.find((h: any) => (h.hwid_value || h) === hwidValue)) {
                if (currentHwids.length >= 3) {
                    await statusMsg.edit(\`❌ Key \\\`\${keyValue}\\\` ผูก HWID ครบ 3 เครื่องแล้วครับ (Max: 3)\`);
                    return;
                }
                currentHwids.push({ custom_name: 'Admin Added', hwid_value: hwidValue });
            }

            const { error: updateErr } = await supabase
                .from('keys')
                .update({ hwids: currentHwids })
                .eq('id', keyRecord.id);`;
    msg = msg.replace(addhwidRegex, addhwidReplacement);

    // 2. !delhwid command - Update to accept optional specific hwid, or clear all
    const delhwidRegex = /if \(!keyValue\) \{[\s\S]*?\}\n\n        const statusMsg = await message\.reply\(\`⏳ กำลังลบ HWID จาก Key \\\`\$\{keyValue\}\\\`\.\.\.\`\);[\s\S]*?const \{ error \} = await supabase\n                \.from\('keys'\)\n                \.update\(\{ hwids: \[\] \}\)\n                \.eq\('key_value', keyValue\);/m;
    const delhwidReplacement = `const hwidValue = args[2];
        if (!keyValue) {
            await message.reply('❌ รูปแบบคำสั่งไม่ถูกต้อง:\\n\`!delhwid <Key Value> [HWID ที่ต้องการลบ (เว้นว่างเพื่อลบทั้งหมด)]\`');
            return;
        }

        const statusMsg = await message.reply(\`⏳ กำลังลบ HWID จาก Key \`\${keyValue}\`...\`);

        try {
            if (!supabase) {
                await statusMsg.edit('❌ Database is not initialized.');
                return;
            }
            
            const { data, error: fetchErr } = await supabase.from('keys').select('*').eq('key_value', keyValue);
            if (fetchErr || !data || data.length === 0) {
                await statusMsg.edit(\`❌ ไม่พบ Key \`\${keyValue}\` ในฐานข้อมูล\`);
                return;
            }
            const keyRecord = data[0];
            let newHwids: any[] = [];
            
            if (hwidValue) {
                let currentHwids = keyRecord.hwids || [];
                newHwids = currentHwids.filter((h: any) => (h.hwid_value || h) !== hwidValue);
                if (newHwids.length === currentHwids.length) {
                     await statusMsg.edit(\`❌ ไม่พบ HWID \`\${hwidValue}\` ใน Key นี้\`);
                     return;
                }
            }

            const { error } = await supabase
                .from('keys')
                .update({ hwids: newHwids })
                .eq('id', keyRecord.id);`;
    msg = msg.replace(delhwidRegex, delhwidReplacement);

    // 3. Replace help menu description
    msg = msg.replace(/\(1 HWID per key\)/g, '(Max: 3 HWID per key)');
    msg = msg.replace(/\(1 per key\)/g, '(Max 3)');

    // 4. View keys (!keys) format
    msg = msg.replace(/const currentHwid = \(k\.hwids && k\.hwids\.length > 0\) \? \(k\.hwids\[0\]\.hwid_value \|\| k\.hwids\[0\]\) : null;\n\s*const hwidDisplay = currentHwid \? \`\$\{currentHwid\}\` : '\*\(\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e1c\u0e39\u0e01\)\*';/m, 
    `let hwidDisplay = '*(ยังไม่ผูก)*';
                if (k.hwids && k.hwids.length > 0) {
                    hwidDisplay = k.hwids.map((h: any) => \`\${h.hwid_value || h}\`).join(', ');
                }`);
                
    // 5. View key (!key) format
    msg = msg.replace(/const currentHwid = \(keyRecord\.hwids && keyRecord\.hwids\.length > 0\) \? \(keyRecord\.hwids\[0\]\.hwid_value \|\| keyRecord\.hwids\[0\]\) : null;\n\s*const hwidDisplay = currentHwid \? \`\$\{currentHwid\}\` : '\u0e44\u0e21\u0e48\u0e21\u0e35 HWID \u0e1c\u0e39\u0e01\u0e44\u0e27\u0e49';/m,
    `let hwidDisplay = 'ไม่มี HWID ผูกไว้';
            if (keyRecord.hwids && keyRecord.hwids.length > 0) {
                hwidDisplay = keyRecord.hwids.map((h: any, i: number) => \`\${i+1}. \${h.hwid_value || h}\`).join('\\n');
            }`);

    fs.writeFileSync('src/events/messageCreate.ts', msg);
    console.log('messageCreate.ts updated for 3 HWIDs');
} catch (e) { console.error('msgErr', e); }
