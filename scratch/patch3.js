const fs = require('fs');

const original = `import { 
    Message, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} from 'discord.js';
import { supabase } from '../supabase';
import { panda } from '../panda';

export async function handleMessageCreate(message: Message) {
    if (message.author.bot) return;

    // Only process Direct Messages (DM)
    if (message.guildId) return;

    const adminId = process.env.ADMIN_ID;
    if (!adminId || message.author.id !== adminId) {
        return;
    }

    const content = message.content.trim();
    if (!content.startsWith('!')) return;

    const args = content.slice(1).split(/\\s+/);
    const command = args[0].toLowerCase();

    // Helper to clean Discord user mentions <@123456789> -> 123456789
    const cleanUserId = (input: string) => {
        if (!input) return '';
        return input.replace(/[<@!>]/g, '');
    };

    // 1. HELP / ADMIN PANEL MENU
    if (command === 'help' || command === 'admin' || command === 'panel' || command === 'menu') {
        const embed = new EmbedBuilder()
            .setTitle('👑 TTJY Admin Control Center (แผงควบคุมแอดมิน)')
            .setDescription('จัดการ Key, เพิ่ม/ลบ/รีเซ็ต HWID, และต่ออายุ Key ของผู้ใช้อื่นได้โดยตรงผ่านแชทนี้\\n\\n**HWID ถูกจัดการผ่าน Database โดยตรง (1 HWID per key)**')
            .setColor('#7289da')
            .addFields(
                {
                    name: '⚡ Quick Text Commands (พิมพ์สั่งงานด่วน)',
                    value: [
                        '• \`!gen <@User|ID> [Days=30] [KeyName]\` - สร้าง Key ให้คนอื่น',
                        '• \`!del <Key>\` - ลบ Key ของคนอื่นออกจากระบบ',
                        '• \`!reset <Key>\` - รีเซ็ต HWID ของ Key นั้น (DB only)',
                        '• \`!extend <Key> [Days=30]\` - ต่ออายุ Key เพิ่ม X วัน',
                        '• \`!addhwid <Key> <HWID>\` - ผูก HWID ให้ Key (1 per key)',
                        '• \`!delhwid <Key>\` - ลบ HWID ออกจาก Key',
                        '• \`!keys <@User|ID>\` - ดู Key และ HWID ทั้งหมดของคนนั้น',
                        '• \`!key <Key>\` - ดูรายละเอียดของ Key นั้น',
                        '• \`!stats\` - ดูสถิติการขายและยอดรวมทั้งหมด'
                    ].join('\\n')
                }
            )
            .setFooter({ text: 'หรือคลิกปุ่มด้านล่างเพื่อเปิดหน้าต่างกรอกข้อมูล' })
            .setTimestamp();

        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('admin_btn_gen').setLabel('➕ สร้าง Key ให้คนอื่น').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('admin_btn_find').setLabel('🔍 ดู Key ลูกค้า').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('admin_btn_reset').setLabel('🔄 รีเซ็ต HWID').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('admin_btn_extend').setLabel('⏳ ต่ออายุ Key').setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('admin_btn_addhwid').setLabel('➕ Bind HWID').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('admin_btn_delhwid').setLabel('➖ Remove HWID').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('admin_btn_delete').setLabel('❌ ลบ Key').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('admin_btn_stats').setLabel('📊 ดูสถิติ').setStyle(ButtonStyle.Secondary)
        );

        await message.reply({ embeds: [embed], components: [row1, row2] });
        return;
    }

    // 2. GENERATE / ADD KEY FOR OTHERS (!gen <userId> [days] [keyName])
    if (command === 'gen' || command === 'create' || command === 'addkey') {
        const rawUser = args[1];
        if (!rawUser) {
            await message.reply('❌ รูปแบบคำสั่งไม่ถูกต้อง:\\n\`!gen <@User หรือ UserID> [จำนวนวัน=30] [ชื่อ Key]\`\\nตัวอย่าง: \`!gen 123456789012345678 30 VIP-Customer\`');
            return;
        }

        const targetUserId = cleanUserId(rawUser);
        const days = parseInt(args[2]) || 30;
        const keyName = args.slice(3).join(' ') || \`VIP Key (\${days} Days)\`;

        const statusMsg = await message.reply(\`⏳ กำลังสร้าง VIP Key สำหรับ <@\${targetUserId}> (\${days} วัน)...\`);

        try {
            const generatedKey = await panda.generateKey({
                count: 1,
                prefix: "VIP",
                expirationType: "byDays",
                expirationDays: days,
                isPremium: true,
                discordId: targetUserId,
                note: \`\${keyName} (Discord: \${targetUserId})\`
            });

            // Write to DB — hwid starts as null (unbound)
            if (supabase) {
                const { error: dbErr } = await supabase.from('keys').insert([{
                    discord_id: targetUserId,
                    custom_name: keyName,
                    key_value: generatedKey,
                    hwids: []
                }]);
                if (dbErr) console.error("Supabase Admin Gen Insert Error:", dbErr);
            }

            // Send key directly to user in DM
            let dmStatus = '✅ ส่ง Key ไปยัง DM ของลูกค้าเรียบร้อย';
            try {
                const targetUser = await message.client.users.fetch(targetUserId);
                if (targetUser) {
                    await targetUser.send(\`🎉 **คุณได้รับ VIP Key จาก Admin!**\\n\\n**Key:** \`\${generatedKey}\`\\n**ชื่อ Key:** \`\${keyName}\`\\n**อายุ:** \`\${days} วัน\`\`);
                }
            } catch (dmErr) {
                dmStatus = '⚠️ ไม่สามารถส่ง DM ถึงลูกค้าได้ (ลูกค้าอาจปิด DM)';
            }

            const embed = new EmbedBuilder()
                .setTitle('✅ สร้าง Key สำเร็จ')
                .setColor('#00ff88')
                .addFields(
                    { name: '👤 ลูกค้า', value: \`<@\${targetUserId}> (\`\${targetUserId}\`)\`, inline: true },
                    { name: '⏳ อายุ', value: \`\${days} วัน\`, inline: true },
                    { name: '🏷️ ชื่อ Key', value: keyName, inline: false },
                    { name: '🔑 Key Value', value: \`\`\`\`\${generatedKey}\`\`\`\`, inline: false },
                    { name: '🖥️ HWID', value: 'ยังไม่ผูก (รอ User bind เอง)', inline: false },
                    { name: '📬 สถานะ DM', value: dmStatus, inline: false }
                )
                .setTimestamp();

            await statusMsg.edit({ content: '', embeds: [embed] });
        } catch (err: any) {
            console.error("Admin Gen Key Error:", err);
            await statusMsg.edit(\`❌ เกิดข้อผิดพลาดในการสร้าง Key: \${err.message || String(err)}\`);
        }
        return;
    }

    // 3. RESET HWID (!reset <key>) — DB only, no Panda call
    if (command === 'reset' || command === 'resethwid' || command === 'rhwid') {
        const keyValue = args[1];
        if (!keyValue) {
            await message.reply('❌ รูปแบบคำสั่งไม่ถูกต้อง:\\n\`!reset <Key Value>\`\\nตัวอย่าง: \`!reset VIP-XXXX-XXXX-XXXX\`');
            return;
        }

        const statusMsg = await message.reply(\`⏳ กำลังรีเซ็ต HWID สำหรับ \`\${keyValue}\`...\`);

        try {
            if (!supabase) {
                await statusMsg.edit('❌ Database is not initialized.');
                return;
            }

            // Clear HWID in DB only — HWID is managed entirely in our database
            const { error } = await supabase
                .from('keys')
                .update({ hwids: [] })
                .eq('key_value', keyValue);

            if (error) throw new Error(error.message);

            await statusMsg.edit(\`✅ **รีเซ็ต HWID สำเร็จ!**\\nKey: \`\${keyValue}\`\\nล้าง HWID ในฐานข้อมูลเรียบร้อยแล้ว สามารถนำไปเปิดใช้งานบนเครื่องใหม่ได้ทันที\`);
        } catch (err: any) {
            console.error("Admin Reset HWID Error:", err);
            await statusMsg.edit(\`❌ เกิดข้อผิดพลาดในการรีเซ็ต HWID: \${err.message || String(err)}\`);
        }
        return;
    }

    // 4. EXTEND KEY (!extend <key> [days])
    if (command === 'extend' || command === 'renew' || command === 'adddays') {
        const keyValue = args[1];
        const days = parseInt(args[2]) || 30;

        if (!keyValue) {
            await message.reply('❌ รูปแบบคำสั่งไม่ถูกต้อง:\\n\`!extend <Key Value> [จำนวนวัน=30]\`\\nตัวอย่าง: \`!extend VIP-XXXX-XXXX-XXXX 30\`');
            return;
        }

        const statusMsg = await message.reply(\`⏳ กำลังต่ออายุ Key \`\${keyValue}\` (+\${days} วัน)...\`);

        try {
            await panda.extendKey(keyValue, days);
            await statusMsg.edit(\`✅ **ต่ออายุ Key สำเร็จ!**\\nKey: \`\${keyValue}\`\\nเพิ่มอายุการใช้งาน: **+\${days} วัน** เรียบร้อยแล้ว\`);
        } catch (err: any) {
            console.error("Admin Extend Key Error:", err);
            await statusMsg.edit(\`❌ เกิดข้อผิดพลาดในการต่ออายุ Key: \${err.message || String(err)}\`);
        }
        return;
    }

    // 5. DELETE KEY (!del <key> / !delete <key>)
    if (command === 'del' || command === 'delete' || command === 'removekey') {
        const keyValue = args[1];
        if (!keyValue) {
            await message.reply('❌ รูปแบบคำสั่งไม่ถูกต้อง:\\n\`!del <Key Value>\`\\nตัวอย่าง: \`!del VIP-XXXX-XXXX-XXXX\`');
            return;
        }

        const statusMsg = await message.reply(\`⏳ กำลังลบ Key \`\${keyValue}\` ออกจากระบบ...\`);

        try {
            // Remove from DB first
            if (supabase) {
                await supabase.from('keys').delete().eq('key_value', keyValue);
            }

            // Also remove from Panda (best-effort)
            try {
                await panda.deleteKey(keyValue);
            } catch (pErr) {
                console.warn("Pandauth delete warning (non-fatal):", pErr);
            }

            await statusMsg.edit(\`🗑️ **ลบ Key สำเร็จ!**\\nKey \`\${keyValue}\` ถูกลบออกจากระบบและ Pandauth เรียบร้อยแล้ว\`);
        } catch (err: any) {
            console.error("Admin Delete Key Error:", err);
            await statusMsg.edit(\`❌ เกิดข้อผิดพลาดในการลบ Key: \${err.message || String(err)}\`);
        }
        return;
    }

    // 6. BIND HWID TO KEY (!addhwid <key> <hwid>) — 1 HWID per key, DB only
    if (command === 'addhwid' || command === 'bind') {
        const keyValue = args[1];
        const hwidValue = args[2];

        if (!keyValue || !hwidValue) {
            await message.reply('❌ รูปแบบคำสั่งไม่ถูกต้อง:\\n\`!addhwid <Key Value> <HWID String>\`\\nตัวอย่าง: \`!addhwid VIP-XXXX-XXXX-XXXX 8f9a7b...\`');
            return;
        }

        const statusMsg = await message.reply(\`⏳ กำลังผูก HWID ให้ Key \`\${keyValue}\`...\`);

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

            // Admin can force-overwrite existing HWID
            const { error: updateErr } = await supabase
                .from('keys')
                .update({ hwids: [hwidValue] })
                .eq('id', keyRecord.id);

            if (updateErr) throw new Error(updateErr.message);

            await statusMsg.edit(\`✅ **ผูก HWID สำเร็จ!**\\nKey: \`\${keyValue}\`\\nHWID: \`\${hwidValue}\`\\n\\n*(ระบบ 1 HWID per key — เขียนลง Database โดยตรง)*\`);
        } catch (err: any) {
            console.error("Admin Add HWID Error:", err);
            await statusMsg.edit(\`❌ เกิดข้อผิดพลาดในการผูก HWID: \${err.message || String(err)}\`);
        }
        return;
    }

    // 7. REMOVE HWID FROM A KEY (!delhwid <key>)
    if (command === 'delhwid' || command === 'removehwid') {
        const keyValue = args[1];

        if (!keyValue) {
            await message.reply('❌ รูปแบบคำสั่งไม่ถูกต้อง:\\n\`!delhwid <Key Value>\`');
            return;
        }

        const statusMsg = await message.reply(\`⏳ กำลังลบ HWID จาก Key \`\${keyValue}\`...\`);

        try {
            if (!supabase) {
                await statusMsg.edit('❌ Database is not initialized.');
                return;
            }

            const { error } = await supabase
                .from('keys')
                .update({ hwids: [] })
                .eq('key_value', keyValue);

            if (error) throw new Error(error.message);

            await statusMsg.edit(\`✅ **ลบ HWID สำเร็จ!**\\nKey: \`\${keyValue}\`\\nHWID ถูกล้างออกแล้ว\`);
        } catch (err: any) {
            console.error("Admin Del HWID Error:", err);
            await statusMsg.edit(\`❌ เกิดข้อผิดพลาด: \${err.message || String(err)}\`);
        }
        return;
    }

    // 8. VIEW KEYS FOR A SPECIFIC USER (!keys <userId> / !user <userId>)
    if (command === 'keys' || command === 'user' || command === 'find') {
        const rawUser = args[1];
        if (!rawUser) {
            await message.reply('❌ รูปแบบคำสั่งไม่ถูกต้อง:\\n\`!keys <@User หรือ UserID>\`\\nตัวอย่าง: \`!keys 123456789012345678\`');
            return;
        }

        const targetUserId = cleanUserId(rawUser);
        const statusMsg = await message.reply(\`🔍 กำลังค้นหา Key ทั้งหมดของ <@\${targetUserId}>...\`);

        try {
            let userKeys: any[] = [];
            if (supabase) {
                const { data } = await supabase.from('keys').select('*').eq('discord_id', targetUserId);
                if (data) userKeys = data;
            }

            if (userKeys.length === 0) {
                await statusMsg.edit(\`❌ ไม่พบ Key ใดๆ ของผู้ใช้ <@\${targetUserId}> (\`\${targetUserId}\`)\`);
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(\`🔑 รายการ Key ของ <@\${targetUserId}>\`)
                .setDescription(\`พบทั้งหมด **\${userKeys.length}** คีย์\`)
                .setColor('#00b4d8')
                .setTimestamp();

            for (const [idx, k] of userKeys.entries()) {
                const currentHwid = (k.hwids && k.hwids.length > 0) ? (k.hwids[0].hwid_value || k.hwids[0]) : null;
                const hwidDisplay = currentHwid ? \`\`\${currentHwid}\`\` : '*(ยังไม่ผูก)*';
                embed.addFields({
                    name: \`\${idx + 1}. \${k.custom_name || 'VIP Key'}\`,
                    value: \`**Key:** \`\${k.key_value}\`\\n**สร้างเมื่อ:** <t:\${Math.floor(new Date(k.created_at).getTime() / 1000)}:R>\\n**HWID:** \${hwidDisplay}\`
                });
            }

            await statusMsg.edit({ content: '', embeds: [embed] });
        } catch (err: any) {
            console.error("Admin Find Keys Error:", err);
            await statusMsg.edit(\`❌ เกิดข้อผิดพลาด: \${err.message || String(err)}\`);
        }
        return;
    }

    // 9. VIEW SPECIFIC KEY DETAILS (!key <keyValue>)
    if (command === 'key') {
        const keyValue = args[1];
        if (!keyValue) {
            await message.reply('❌ รูปแบบคำสั่งไม่ถูกต้อง:\\n\`!key <Key Value>\`');
            return;
        }

        const statusMsg = await message.reply(\`🔍 กำลังค้นหาข้อมูล Key \`\${keyValue}\`...\`);

        try {
            let keyRecord: any = null;
            if (supabase) {
                const { data } = await supabase.from('keys').select('*').eq('key_value', keyValue);
                if (data && data.length > 0) keyRecord = data[0];
            }

            if (!keyRecord) {
                await statusMsg.edit(\`❌ ไม่พบ Key \`\${keyValue}\` ในระบบ\`);
                return;
            }

            const currentHwid = (keyRecord.hwids && keyRecord.hwids.length > 0) ? (keyRecord.hwids[0].hwid_value || keyRecord.hwids[0]) : null;
            const hwidDisplay = currentHwid ? \`\`\${currentHwid}\`\` : 'ไม่มี HWID ผูกไว้';

            const embed = new EmbedBuilder()
                .setTitle(\`🔑 ข้อมูล Key: \`\${keyValue}\`\`)
                .setColor('#ffaa00')
                .addFields(
                    { name: '👤 เจ้าของ Key', value: keyRecord.discord_id ? \`<@\${keyRecord.discord_id}> (\`\${keyRecord.discord_id}\`)\` : 'ไม่ระบุ', inline: true },
                    { name: '🏷️ ชื่อ Key', value: keyRecord.custom_name || 'VIP Key', inline: true },
                    { name: '🖥️ HWID', value: hwidDisplay, inline: false },
                    { name: '📅 สร้างเมื่อ', value: keyRecord.created_at ? \`<t:\${Math.floor(new Date(keyRecord.created_at).getTime() / 1000)}:f>\` : 'ไม่ทราบ', inline: false }
                )
                .setTimestamp();

            await statusMsg.edit({ content: '', embeds: [embed] });
        } catch (err: any) {
            console.error("Admin Key Info Error:", err);
            await statusMsg.edit(\`❌ เกิดข้อผิดพลาด: \${err.message || String(err)}\`);
        }
        return;
    }

    // 10. STATS / INFO
    if (command === 'stats' || command === 'info') {
        if (!supabase) {
            await message.reply('Database is not initialized.');
            return;
        }

        try {
            const { data: keysData, error } = await supabase.from('keys').select('*');
            if (error) {
                console.error(error);
                await message.reply('Failed to fetch data from database.');
                return;
            }

            const totalKeys = keysData.length;
            const uniqueUsers = new Set(keysData.map((k: any) => k.discord_id)).size;
            const boundHwids = keysData.filter((k: any) => k.hwids && k.hwids.length > 0).length;

            let userListText = '';
            const userGroups: { [key: string]: number } = {};
            for (const k of keysData) {
                if (!userGroups[k.discord_id]) userGroups[k.discord_id] = 0;
                userGroups[k.discord_id]++;
            }

            for (const [discordId, count] of Object.entries(userGroups)) {
                userListText += \`- <@\${discordId}> (\`\${discordId}\`): **\${count}** key(s)\\n\`;
            }

            if (userListText.length > 1024) {
                userListText = userListText.substring(0, 1000) + '...\\n(Too many users to display)';
            }

            const embed = new EmbedBuilder()
                .setTitle('📊 Key Statistics / สถิติการขาย')
                .setColor('#00ff00')
                .addFields(
                    { name: '👥 จำนวนลูกค้าทั้งหมด', value: \`\${uniqueUsers} คน\`, inline: true },
                    { name: '🔑 จำนวน Key ทั้งหมด', value: \`\${totalKeys} คีย์\`, inline: true },
                    { name: '🖥️ HWID ที่ผูกแล้ว', value: \`\${boundHwids}/\${totalKeys}\`, inline: true },
                    { name: '📋 รายชื่อลูกค้าและจำนวนคีย์', value: userListText || 'ยังไม่มีข้อมูล' }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (e) {
            console.error(e);
            await message.reply('An error occurred.');
        }
        return;
    }
}
`;

fs.writeFileSync('src/events/messageCreate.ts', original);
console.log('Restored messageCreate.ts!');
