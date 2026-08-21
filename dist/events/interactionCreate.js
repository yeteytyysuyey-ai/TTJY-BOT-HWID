"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInteraction = handleInteraction;
const discord_js_1 = require("discord.js");
const panel_1 = require("../commands/panel");
const panda_1 = require("../panda");
const supabase_1 = require("../supabase");
async function handleInteraction(interaction) {
    try {
        if (interaction.isCommand()) {
            if (interaction.commandName === 'panel') {
                await panel_1.panelCommand.execute(interaction);
            }
        }
        else if (interaction.isButton()) {
            await handleButton(interaction);
        }
        else if (interaction.isModalSubmit()) {
            await handleModal(interaction);
        }
    }
    catch (error) {
        console.error('Interaction error:', error);
        if (interaction.isRepliable()) {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ An error occurred while processing this interaction.' }).catch(() => null);
            }
            else {
                await interaction.reply({ content: '❌ An error occurred while processing this interaction.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => null);
            }
        }
    }
}
async function handleButton(interaction) {
    const { customId } = interaction;
    // ===== 1. PANEL BUTTONS =====
    // Show Keys
    if (customId === 'keys') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        if (!supabase_1.supabase) {
            return interaction.editReply('❌ Database not initialized.');
        }
        const { data: userKeys, error } = await supabase_1.supabase
            .from('keys')
            .select('*')
            .eq('discord_id', interaction.user.id);
        if (error || !userKeys || userKeys.length === 0) {
            return interaction.editReply('❌ You do not have any active keys registered.');
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🔑 Your Premium Keys')
            .setDescription(`Found **${userKeys.length}** key(s) linked to your Discord account.`)
            .setColor('#5865F2')
            .setTimestamp();
        for (const [idx, k] of userKeys.entries()) {
            embed.addFields({
                name: `${idx + 1}. ${k.custom_name || 'VIP Key'}`,
                value: `Key: \`${k.key_value}\``
            });
        }
        return interaction.editReply({ embeds: [embed] });
    }
    // Show HWIDs
    else if (customId === 'show_hwids' || customId === 'btn_show_hwid') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_show_hwid')
            .setTitle('Show Key HWIDs');
        const keyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_value')
            .setLabel('Key Value')
            .setPlaceholder('e.g. VIP-XXXX-XXXX-XXXX')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput));
        return interaction.showModal(modal);
    }
    // Add HWID (Max 3)
    else if (customId === 'add' || customId === 'btn_add_hwid') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_add_hwid')
            .setTitle('Add HWID to Key (Max 3 Devices)');
        const keyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_value')
            .setLabel('Key Value')
            .setPlaceholder('e.g. VIP-XXXX-XXXX-XXXX')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const nameInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_hwid_name')
            .setLabel('custom_name')
            .setPlaceholder('e.g. PC / Laptop / My Device')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const hwidInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_hwid_value')
            .setLabel('HWID String')
            .setPlaceholder('Paste your hardware ID here')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput), new discord_js_1.ActionRowBuilder().addComponents(nameInput), new discord_js_1.ActionRowBuilder().addComponents(hwidInput));
        return interaction.showModal(modal);
    }
    // Remove HWID
    else if (customId === 'remove' || customId === 'btn_remove_hwid') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_remove_hwid')
            .setTitle('Remove HWID from Key');
        const keyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_value')
            .setLabel('Key Value')
            .setPlaceholder('e.g. VIP-XXXX-XXXX-XXXX')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const hwidInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_hwid_value')
            .setLabel('HWID String to Remove')
            .setPlaceholder('Paste the exact HWID string to remove')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput), new discord_js_1.ActionRowBuilder().addComponents(hwidInput));
        return interaction.showModal(modal);
    }
    // Reset HWID
    else if (customId === 'reset_hwid') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_reset_hwid')
            .setTitle('Reset All HWIDs for Key');
        const keyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_value')
            .setLabel('Key Value')
            .setPlaceholder('e.g. VIP-XXXX-XXXX-XXXX')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput));
        return interaction.showModal(modal);
    }
    // Buy Key (TrueMoney Gift Link)
    else if (customId === 'buy' || customId === 'btn_buy') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_buy')
            .setTitle('Buy Key (300 THB - TrueMoney Link)');
        const linkInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_tw_link')
            .setLabel('TrueMoney Gift Link')
            .setPlaceholder('https://gift.truemoney.com/campaign/?v=xxxxxx')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const nameInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_custom_name')
            .setLabel('Key Custom Name')
            .setPlaceholder('e.g. My VIP Key')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(linkInput), new discord_js_1.ActionRowBuilder().addComponents(nameInput));
        return interaction.showModal(modal);
    }
    // Buy Key (Cash Card)
    else if (customId === 'buy_cashcard') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_buy_cashcard')
            .setTitle('Buy Key (TrueMoney Cash Card 14 Digits)');
        const cardInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_cashcard_14')
            .setLabel('14 Digits Cash Card Pin')
            .setPlaceholder('e.g. 12345678901234')
            .setMinLength(14)
            .setMaxLength(14)
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const nameInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_custom_name')
            .setLabel('Key Custom Name')
            .setPlaceholder('e.g. My VIP Key')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(cardInput), new discord_js_1.ActionRowBuilder().addComponents(nameInput));
        return interaction.showModal(modal);
    }
    // Renew Key (TrueMoney Gift Link)
    else if (customId === 'renew') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_renew')
            .setTitle('Renew Key (300 THB - TrueMoney Link)');
        const keyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_value')
            .setLabel('Key Value to Renew')
            .setPlaceholder('e.g. VIP-XXXX-XXXX-XXXX')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const linkInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_tw_link')
            .setLabel('TrueMoney Gift Link')
            .setPlaceholder('https://gift.truemoney.com/campaign/?v=xxxxxx')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput), new discord_js_1.ActionRowBuilder().addComponents(linkInput));
        return interaction.showModal(modal);
    }
    // Renew Key (Cash Card)
    else if (customId === 'renew_cashcard') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_renew_cashcard')
            .setTitle('Renew Key (Cash Card 14 Digits)');
        const keyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_value')
            .setLabel('Key Value to Renew')
            .setPlaceholder('e.g. VIP-XXXX-XXXX-XXXX')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const cardInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_cashcard_14')
            .setLabel('14 Digits Cash Card Pin')
            .setPlaceholder('e.g. 12345678901234')
            .setMinLength(14)
            .setMaxLength(14)
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput), new discord_js_1.ActionRowBuilder().addComponents(cardInput));
        return interaction.showModal(modal);
    }
    // Dismiss ephemeral
    else if (customId === 'dismiss_ephemeral') {
        return interaction.deferUpdate();
    }
    // ===== 2. ADMIN PANEL BUTTONS =====
    else if (customId === 'admin_btn_gen') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_admin_gen')
            .setTitle('Admin: Generate Key for User');
        const userInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_target_user')
            .setLabel('Discord User ID or @Mention')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const daysInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_days')
            .setLabel('Expiration Days')
            .setValue('30')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const nameInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_name')
            .setLabel('Key Custom Name')
            .setPlaceholder('e.g. VIP Customer')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(false);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(userInput), new discord_js_1.ActionRowBuilder().addComponents(daysInput), new discord_js_1.ActionRowBuilder().addComponents(nameInput));
        return interaction.showModal(modal);
    }
    else if (customId === 'admin_btn_find') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_admin_find')
            .setTitle('Admin: Search Keys / HWID');
        const queryInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_query')
            .setLabel('Search Query (Discord ID, @Mention, Key)')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(queryInput));
        return interaction.showModal(modal);
    }
    else if (customId === 'admin_btn_reset') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_admin_reset')
            .setTitle('Admin: Reset HWID');
        const keyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_value')
            .setLabel('Key Value')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput));
        return interaction.showModal(modal);
    }
    else if (customId === 'admin_btn_extend') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_admin_extend')
            .setTitle('Admin: Extend Key Duration');
        const keyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_value')
            .setLabel('Key Value')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const daysInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_days')
            .setLabel('Add Days')
            .setValue('30')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput), new discord_js_1.ActionRowBuilder().addComponents(daysInput));
        return interaction.showModal(modal);
    }
    else if (customId === 'admin_btn_addhwid') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_admin_add_hwid')
            .setTitle('Admin: Bind HWID to Key (Max 3)');
        const keyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_value')
            .setLabel('Key Value')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const hwidInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_hwid_value')
            .setLabel('HWID String')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput), new discord_js_1.ActionRowBuilder().addComponents(hwidInput));
        return interaction.showModal(modal);
    }
    else if (customId === 'admin_btn_delhwid') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_admin_del_hwid')
            .setTitle('Admin: Remove Specific HWID');
        const keyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_value')
            .setLabel('Key Value')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const hwidInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_hwid_value')
            .setLabel('HWID String to Remove')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput), new discord_js_1.ActionRowBuilder().addComponents(hwidInput));
        return interaction.showModal(modal);
    }
    else if (customId === 'admin_btn_delete') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_admin_delete')
            .setTitle('Admin: Delete Key Permanently');
        const keyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('input_key_value')
            .setLabel('Key Value')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput));
        return interaction.showModal(modal);
    }
    else if (customId === 'admin_btn_stats') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) {
            return interaction.editReply('❌ Unauthorized.');
        }
        if (!supabase_1.supabase)
            return interaction.editReply('❌ Database not initialized.');
        const { data: keysData, error } = await supabase_1.supabase.from('keys').select('*');
        if (error || !keysData)
            return interaction.editReply('❌ Failed to fetch database records.');
        const totalKeys = keysData.length;
        const uniqueUsers = new Set(keysData.map((k) => k.discord_id)).size;
        const boundHwids = keysData.filter((k) => k.hwids && k.hwids.length > 0).length;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('📊 Admin Statistics')
            .setColor('#00ff88')
            .addFields({ name: '👥 Total Customers', value: `${uniqueUsers}`, inline: true }, { name: '🔑 Total Keys', value: `${totalKeys}`, inline: true }, { name: '🖥️ Keys with Bound HWID', value: `${boundHwids}/${totalKeys}`, inline: true })
            .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
    }
    // ===== 3. CASH CARD ADMIN APPROVAL BUTTONS =====
    else if (customId.startsWith('approve_cc_')) {
        const targetUserId = customId.replace('approve_cc_', '');
        await interaction.deferUpdate();
        try {
            const generatedKey = await panda_1.panda.generateKey({
                count: 1,
                prefix: "VIP",
                expirationType: "byDays",
                expirationDays: 30,
                isPremium: true,
                discordId: targetUserId,
                note: `TrueMoney CashCard Key (Discord: ${targetUserId})`
            });
            if (supabase_1.supabase) {
                await supabase_1.supabase.from('keys').insert([{
                        discord_id: targetUserId,
                        custom_name: 'VIP Key (Cash Card)',
                        key_value: generatedKey,
                        hwids: []
                    }]);
            }
            const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
            if (targetUser) {
                await targetUser.send(`🎉 **การชำระเงินผ่าน TrueMoney Cash Card ได้รับการอนุมัติแล้ว!**\n\n🔑 **Key:** \`${generatedKey}\`\n⏳ **อายุ:** 30 วัน\n\nคุณสามารถนำ Key ไปผูก HWID ผ่านเมนู **Add HWID** ได้เลยครับ!`);
            }
            await interaction.followUp({ content: `✅ อนุมัติและสร้าง Key ให้ <@${targetUserId}> เรียบร้อย: \`${generatedKey}\``, flags: discord_js_1.MessageFlags.Ephemeral });
        }
        catch (err) {
            await interaction.followUp({ content: `❌ Error: ${err.message}`, flags: discord_js_1.MessageFlags.Ephemeral });
        }
    }
    else if (customId.startsWith('reject_cc_')) {
        const targetUserId = customId.replace('reject_cc_', '');
        await interaction.deferUpdate();
        const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
        if (targetUser) {
            await targetUser.send(`❌ **คำขอซื้อ Key ผ่าน TrueMoney Cash Card ของคุณถูกปฏิเสธ**\nกรุณาตรวจสอบรหัสบัตรเงินสดแล้วลองใหม่อีกครั้ง หรือติดต่อ Admin ครับ`);
        }
        await interaction.followUp({ content: `❌ ปฏิเสธคำขอของ <@${targetUserId}> เรียบร้อยแล้ว`, flags: discord_js_1.MessageFlags.Ephemeral });
    }
}
async function handleModal(interaction) {
    const { customId } = interaction;
    // ===== 1. USER: BUY KEY (TrueMoney Link) =====
    if (customId === 'modal_buy') {
        const link = interaction.fields.getTextInputValue('input_tw_link');
        const customName = interaction.fields.getTextInputValue('input_custom_name');
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        try {
            const twPhone = process.env.TW_PHONE || '0000000000';
            const expectedPrice = 300;
            if (!link.includes('gift.truemoney.com/campaign')) {
                return interaction.editReply('❌ Invalid TrueMoney gift link!');
            }
            const hash = link.split('?v=')[1];
            if (!hash)
                return interaction.editReply('❌ Invalid TrueMoney gift link hash!');
            const { gotScraping } = await Promise.resolve().then(() => __importStar(require('got-scraping')));
            const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${hash}/verify?mobile=${twPhone}`;
            let verifyData;
            try {
                const verifyRes = await gotScraping.get({
                    url: verifyUrl,
                    headerGeneratorOptions: { browsers: ['firefox'], operatingSystems: ['windows'], locales: ['en-US'] },
                    headers: { 'Referer': link },
                    responseType: 'json'
                });
                verifyData = verifyRes.body;
            }
            catch (e) {
                const errBody = typeof e.response?.body === 'string' ? e.response.body.substring(0, 300) : e.message;
                return interaction.editReply(`❌ Voucher verification failed:\n\`\`\`${errBody}\`\`\``);
            }
            if (verifyData.status?.code !== 'SUCCESS') {
                return interaction.editReply(`❌ Voucher error: ${verifyData.status?.message || JSON.stringify(verifyData)}`);
            }
            const voucherAmount = parseInt(verifyData.data.voucher.amount_baht);
            if (voucherAmount !== expectedPrice) {
                return interaction.editReply(`❌ จำนวนเงินไม่ถูกต้อง! ต้องการ ${expectedPrice} THB แต่ได้ ${voucherAmount} THB`);
            }
            const redeemUrl = `https://gift.truemoney.com/campaign/vouchers/${hash}/redeem`;
            let redeemData;
            try {
                const redeemRes = await gotScraping.post({
                    url: redeemUrl,
                    headerGeneratorOptions: { browsers: ['firefox'], operatingSystems: ['windows'], locales: ['en-US'] },
                    headers: { 'Referer': link, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobile: twPhone, voucher_hash: hash }),
                    responseType: 'json'
                });
                redeemData = redeemRes.body;
            }
            catch (e) {
                return interaction.editReply(`❌ Redeem failed (Network Error).`);
            }
            if (redeemData.status?.code !== 'SUCCESS') {
                return interaction.editReply(`❌ Redeem failed: ${redeemData.status?.message || 'Unknown'}`);
            }
            // Payment success -> Gen key via Panda
            const generatedKey = await panda_1.panda.generateKey({
                count: 1,
                prefix: "VIP",
                expirationType: "byDays",
                expirationDays: 30,
                isPremium: true,
                discordId: interaction.user.id,
                note: `${customName} (Discord: ${interaction.user.id})`
            });
            if (supabase_1.supabase) {
                await supabase_1.supabase.from('keys').insert([{
                        discord_id: interaction.user.id,
                        custom_name: customName,
                        key_value: generatedKey,
                        hwids: []
                    }]);
            }
            const adminId = process.env.ADMIN_ID;
            if (adminId) {
                const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
                if (adminUser) {
                    await adminUser.send(`**[LOG] New Key Purchase (TrueMoney Link)**\nUser: <@${interaction.user.id}> (${interaction.user.username})\nKey: \`${generatedKey}\`\nName: \`${customName}\`\nAmount: \`${expectedPrice} THB\``).catch(() => null);
                }
            }
            return interaction.editReply(`🎉 **ชำระเงินสำเร็จ! คุณได้รับ VIP Key 30 วัน**\n\n🔑 **Key:** \`${generatedKey}\`\n🏷️ **ชื่อ:** \`${customName}\`\n\nสามารถนำ Key ไปผูก HWID ผ่านเมนู **Add HWID** ได้สูงสุด 3 เครื่องครับ!`);
        }
        catch (err) {
            console.error("Buy Modal Error:", err);
            return interaction.editReply(`❌ เกิดข้อผิดพลาด: ${err.message || String(err)}`);
        }
    }
    // ===== 2. USER: BUY KEY (Cash Card) =====
    else if (customId === 'modal_buy_cashcard') {
        const cashcard = interaction.fields.getTextInputValue('input_cashcard_14');
        const customName = interaction.fields.getTextInputValue('input_custom_name');
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (!adminId) {
            return interaction.editReply('❌ Admin ID is not configured.');
        }
        try {
            const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
            if (adminUser) {
                const approveBtn = new discord_js_1.ButtonBuilder()
                    .setCustomId(`approve_cc_${interaction.user.id}`)
                    .setLabel('Approve & Gen Key')
                    .setStyle(discord_js_1.ButtonStyle.Success);
                const rejectBtn = new discord_js_1.ButtonBuilder()
                    .setCustomId(`reject_cc_${interaction.user.id}`)
                    .setLabel('Reject')
                    .setStyle(discord_js_1.ButtonStyle.Danger);
                const row = new discord_js_1.ActionRowBuilder().addComponents(approveBtn, rejectBtn);
                await adminUser.send({
                    content: `**[NEW PURCHASE REQUEST] TrueMoney Cash Card**\nUser: <@${interaction.user.id}> (${interaction.user.username})\nUser ID: \`${interaction.user.id}\`\nCustom Name: \`${customName}\`\nCash Card 14 Digits: \`\`\`${cashcard}\`\`\`\n\nClick Approve to generate key and send directly to user.`,
                    components: [row]
                });
                return interaction.editReply('✅ ส่งรหัสบัตรเงินสดให้ Admin ตรวจสอบเรียบร้อยแล้ว กรุณารอสักครู่ เมื่อได้รับการอนุมัติระบบจะส่ง Key ให้ทาง DM ทันทีครับ');
            }
            else {
                return interaction.editReply('❌ Could not contact Admin.');
            }
        }
        catch (err) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
    // ===== 3. USER: ADD HWID (Max 3 Devices) =====
    else if (customId === 'modal_add_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const customName = interaction.fields.getTextInputValue('input_hwid_name').trim();
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value').trim();
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        if (!supabase_1.supabase) {
            return interaction.editReply('❌ Database not initialized.');
        }
        try {
            // Fetch key to check ownership
            const { data, error: fetchError } = await supabase_1.supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);
            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('❌ Invalid key or you do not own this key.');
            }
            const keyRecord = data[0];
            let currentHwids = keyRecord.hwids || [];
            // Duplicate check
            if (currentHwids.some((h) => (h.hwid_value || h) === hwidValue)) {
                return interaction.editReply(`❌ **This HWID is already bound to this key!**\nHWID: \`${hwidValue}\``);
            }
            // Max 3 HWIDs check
            if (currentHwids.length >= 3) {
                return interaction.editReply(`❌ **Limit Reached!**\nThis key already has **3 HWIDs** bound to it (Max: 3).\nPlease remove an existing HWID first using **Remove HWID** or **Reset HWID**.`);
            }
            // Append new HWID object with custom_name
            currentHwids.push({ custom_name: customName || 'Device', hwid_value: hwidValue });
            const { error: updateError } = await supabase_1.supabase
                .from('keys')
                .update({ hwids: currentHwids })
                .eq('id', keyRecord.id);
            if (updateError) {
                console.error("Supabase Add HWID Error:", updateError);
                return interaction.editReply('❌ Failed to save HWID to database.');
            }
            return interaction.editReply(`✅ **HWID Bound Successfully! (${currentHwids.length}/3)**\n\n🔑 **Key:** \`${keyValue}\`\n🏷️ **custom_name:** \`${customName}\`\n📋 **HWID:** \`${hwidValue}\``);
        }
        catch (err) {
            console.error("Add HWID Modal Error:", err);
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
    // ===== 4. USER: SHOW HWID =====
    else if (customId === 'modal_show_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        if (!supabase_1.supabase) {
            return interaction.editReply('❌ Database not initialized.');
        }
        try {
            const { data, error: fetchError } = await supabase_1.supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);
            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('❌ Invalid key or you do not own this key.');
            }
            const keyRecord = data[0];
            const hwidsList = keyRecord.hwids || [];
            if (hwidsList.length === 0) {
                return interaction.editReply(`🔑 **Key:** \`${keyValue}\`\n\n⚠️ No HWIDs are currently bound to this key (0/3). Use **Add HWID** to bind.`);
            }
            let result = `🔑 **Key:** \`${keyValue}\`\n\n**Bound Devices (${hwidsList.length}/3):**\n`;
            hwidsList.forEach((h, i) => {
                const devName = h.custom_name ? `**${h.custom_name}**: ` : '';
                result += `${i + 1}. ${devName}\`${h.hwid_value || h}\`\n`;
            });
            return interaction.editReply(result);
        }
        catch (err) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
    // ===== 5. USER: REMOVE HWID =====
    else if (customId === 'modal_remove_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value').trim();
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        if (!supabase_1.supabase) {
            return interaction.editReply('❌ Database not initialized.');
        }
        try {
            const { data, error: fetchError } = await supabase_1.supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);
            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('❌ Invalid key or you do not own this key.');
            }
            const keyRecord = data[0];
            let currentHwids = keyRecord.hwids || [];
            const targetIndex = currentHwids.findIndex((h) => (h.hwid_value || h) === hwidValue);
            if (targetIndex === -1) {
                return interaction.editReply(`❌ That HWID \`${hwidValue}\` is not bound to this key.`);
            }
            currentHwids.splice(targetIndex, 1);
            const { error: updateError } = await supabase_1.supabase
                .from('keys')
                .update({ hwids: currentHwids })
                .eq('id', keyRecord.id);
            if (updateError) {
                return interaction.editReply('❌ Failed to remove HWID from database.');
            }
            return interaction.editReply(`✅ **HWID Removed Successfully!**\nKey: \`${keyValue}\`\nRemaining Devices: **${currentHwids.length}/3**`);
        }
        catch (err) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
    // ===== 6. USER: RESET HWID =====
    else if (customId === 'modal_reset_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        if (!supabase_1.supabase) {
            return interaction.editReply('❌ Database not initialized.');
        }
        try {
            const { data, error: fetchError } = await supabase_1.supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);
            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('❌ Invalid key or you do not own this key.');
            }
            const { error: updateError } = await supabase_1.supabase
                .from('keys')
                .update({ hwids: [] })
                .eq('id', data[0].id);
            if (updateError) {
                return interaction.editReply('❌ Failed to reset HWID.');
            }
            return interaction.editReply(`✅ **HWID Reset Successful!**\nKey: \`${keyValue}\`\nAll HWIDs have been cleared (0/3 devices). You can now bind new devices.`);
        }
        catch (err) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
    // ===== 7. USER: RENEW KEY (TrueMoney Link) =====
    else if (customId === 'modal_renew') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const link = interaction.fields.getTextInputValue('input_tw_link').trim();
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        try {
            if (supabase_1.supabase) {
                const { data, error: fetchError } = await supabase_1.supabase
                    .from('keys')
                    .select('*')
                    .eq('key_value', keyValue)
                    .eq('discord_id', interaction.user.id);
                if (fetchError || !data || data.length === 0) {
                    return interaction.editReply('❌ ไม่พบ Key นี้ในบัญชีของคุณ กรุณาตรวจสอบ Key อีกครั้ง');
                }
            }
            const twPhone = process.env.TW_PHONE || '0000000000';
            const expectedPrice = 300;
            if (!link.includes('gift.truemoney.com/campaign')) {
                return interaction.editReply('❌ Invalid TrueMoney gift link!');
            }
            const hash = link.split('?v=')[1];
            if (!hash)
                return interaction.editReply('❌ Invalid TrueMoney gift link hash!');
            const { gotScraping } = await Promise.resolve().then(() => __importStar(require('got-scraping')));
            const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${hash}/verify?mobile=${twPhone}`;
            let verifyData;
            try {
                const verifyRes = await gotScraping.get({
                    url: verifyUrl,
                    headerGeneratorOptions: { browsers: ['firefox'], operatingSystems: ['windows'], locales: ['en-US'] },
                    headers: { 'Referer': link },
                    responseType: 'json'
                });
                verifyData = verifyRes.body;
            }
            catch (e) {
                const errBody = typeof e.response?.body === 'string' ? e.response.body.substring(0, 300) : e.message;
                return interaction.editReply(`❌ Voucher verification failed:\n\`\`\`${errBody}\`\`\``);
            }
            if (verifyData.status?.code !== 'SUCCESS') {
                return interaction.editReply(`❌ Voucher error: ${verifyData.status?.message || JSON.stringify(verifyData)}`);
            }
            const voucherAmount = parseInt(verifyData.data.voucher.amount_baht);
            if (voucherAmount !== expectedPrice) {
                return interaction.editReply(`❌ จำนวนเงินไม่ถูกต้อง! ต้องการ ${expectedPrice} THB แต่ได้ ${voucherAmount} THB`);
            }
            const redeemUrl = `https://gift.truemoney.com/campaign/vouchers/${hash}/redeem`;
            let redeemData;
            try {
                const redeemRes = await gotScraping.post({
                    url: redeemUrl,
                    headerGeneratorOptions: { browsers: ['firefox'], operatingSystems: ['windows'], locales: ['en-US'] },
                    headers: { 'Referer': link, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobile: twPhone, voucher_hash: hash }),
                    responseType: 'json'
                });
                redeemData = redeemRes.body;
            }
            catch (e) {
                return interaction.editReply(`❌ Redeem failed (Network Error).`);
            }
            if (redeemData.status?.code !== 'SUCCESS') {
                return interaction.editReply(`❌ Redeem failed: ${redeemData.status?.message || 'Unknown'}`);
            }
            await panda_1.panda.extendKey(keyValue, 30);
            const adminId = process.env.ADMIN_ID;
            if (adminId) {
                const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
                if (adminUser) {
                    await adminUser.send(`**[LOG] Key Renewed (TrueMoney Link)**\nUser: <@${interaction.user.id}> (${interaction.user.username})\nKey: \`${keyValue}\`\nAmount: \`${expectedPrice} THB\`\n+30 Days`).catch(() => null);
                }
            }
            return interaction.editReply(`🎉 **ต่ออายุ Key สำเร็จ!**\n\n🔑 **Key:** \`${keyValue}\`\n⏳ เพิ่มอายุการใช้งาน: **+30 วัน** เรียบร้อยแล้ว`);
        }
        catch (err) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
    // ===== 8. USER: RENEW KEY (Cash Card) =====
    else if (customId === 'modal_renew_cashcard') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const cashcard = interaction.fields.getTextInputValue('input_cashcard_14').trim();
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        if (supabase_1.supabase) {
            const { data, error: fetchError } = await supabase_1.supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);
            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('❌ ไม่พบ Key นี้ในบัญชีของคุณ กรุณาตรวจสอบ Key อีกครั้ง');
            }
        }
        const adminId = process.env.ADMIN_ID;
        if (!adminId)
            return interaction.editReply('❌ Admin ID is not configured.');
        try {
            const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
            if (adminUser) {
                await adminUser.send({
                    content: `**[KEY RENEWAL REQUEST] TrueMoney Cash Card**\nUser: <@${interaction.user.id}> (${interaction.user.username})\nUser ID: \`${interaction.user.id}\`\nKey: \`${keyValue}\`\nCash Card 14 Digits: \`\`\`${cashcard}\`\`\`\n\nRun \`!extend ${keyValue} 30\` to approve renewal.`
                });
                return interaction.editReply('✅ ส่งคำขอต่ออายุไปยัง Admin แล้ว กรุณารอ Admin ตรวจสอบและอนุมัติ');
            }
            else {
                return interaction.editReply('❌ Could not contact Admin.');
            }
        }
        catch (err) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
    // ===== 9. ADMIN: CREATE KEY =====
    else if (customId === 'modal_admin_gen') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('❌ Unauthorized.');
        const rawUser = interaction.fields.getTextInputValue('input_target_user');
        const targetUserId = rawUser.replace(/[<@!>]/g, '').trim();
        const days = parseInt(interaction.fields.getTextInputValue('input_days')) || 30;
        const keyName = interaction.fields.getTextInputValue('input_key_name') || `VIP Key (${days} Days)`;
        try {
            const generatedKey = await panda_1.panda.generateKey({
                count: 1,
                prefix: "VIP",
                expirationType: "byDays",
                expirationDays: days,
                isPremium: true,
                discordId: targetUserId,
                note: `${keyName} (Discord: ${targetUserId})`
            });
            if (supabase_1.supabase) {
                await supabase_1.supabase.from('keys').insert([{
                        discord_id: targetUserId,
                        custom_name: keyName,
                        key_value: generatedKey,
                        hwids: []
                    }]);
            }
            let dmNotice = '✅ Sent key to user via DM.';
            try {
                const targetUser = await interaction.client.users.fetch(targetUserId);
                if (targetUser) {
                    await targetUser.send(`🎉 **You received a VIP Key from Admin!**\n\n**Key:** \`${generatedKey}\`\n**Name:** \`${keyName}\`\n**Validity:** \`${days} days\``);
                }
            }
            catch (e) {
                dmNotice = '⚠️ Could not DM user (DM closed).';
            }
            return interaction.editReply(`✅ **Key Created Successfully!**\n\n• **User:** <@${targetUserId}> (\`${targetUserId}\`)\n• **Key:** \`${generatedKey}\`\n• **Name:** \`${keyName}\`\n• **Days:** ${days}\n• **Status:** ${dmNotice}`);
        }
        catch (err) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
    // ===== 10. ADMIN: FIND KEY =====
    else if (customId === 'modal_admin_find') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('❌ Unauthorized.');
        const query = interaction.fields.getTextInputValue('input_query').trim();
        const cleanQuery = query.replace(/[<@!>]/g, '');
        try {
            let foundKeys = [];
            if (supabase_1.supabase) {
                const { data } = await supabase_1.supabase
                    .from('keys')
                    .select('*')
                    .or(`discord_id.eq.${cleanQuery},key_value.eq.${query}`);
                if (data)
                    foundKeys = data;
            }
            if (foundKeys.length === 0) {
                return interaction.editReply(`❌ No keys found matching \`${query}\`.`);
            }
            let resultText = `🔍 **Search Results for:** \`${query}\` (${foundKeys.length} keys found)\n\n`;
            for (const [i, k] of foundKeys.entries()) {
                const hwidsList = k.hwids || [];
                const hwidDisplay = hwidsList.length > 0
                    ? hwidsList.map((h) => `\`${h.hwid_value || h}\``).join(', ')
                    : '(None bound)';
                resultText += `**${i + 1}. ${k.custom_name}** (<@${k.discord_id}>)\nKey: \`${k.key_value}\`\nHWIDs (${hwidsList.length}/3): ${hwidDisplay}\n\n`;
            }
            return interaction.editReply(resultText);
        }
        catch (err) {
            return interaction.editReply(`❌ Search Error: ${err.message}`);
        }
    }
    // ===== 11. ADMIN: RESET HWID =====
    else if (customId === 'modal_admin_reset') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('❌ Unauthorized.');
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        try {
            if (!supabase_1.supabase)
                return interaction.editReply('❌ Database not initialized.');
            const { error } = await supabase_1.supabase.from('keys').update({ hwids: [] }).eq('key_value', keyValue);
            if (error)
                throw new Error(error.message);
            return interaction.editReply(`✅ **HWID Reset Successful!**\nKey: \`${keyValue}\`\nHWID cleared in database.`);
        }
        catch (err) {
            return interaction.editReply(`❌ Reset Error: ${err.message}`);
        }
    }
    // ===== 12. ADMIN: EXTEND KEY =====
    else if (customId === 'modal_admin_extend') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('❌ Unauthorized.');
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const days = parseInt(interaction.fields.getTextInputValue('input_days')) || 30;
        try {
            await panda_1.panda.extendKey(keyValue, days);
            return interaction.editReply(`✅ **Key Extended Successfully!**\nKey: \`${keyValue}\`\nAdded: **+${days} days**.`);
        }
        catch (err) {
            return interaction.editReply(`❌ Extend Error: ${err.message}`);
        }
    }
    // ===== 13. ADMIN: DELETE KEY =====
    else if (customId === 'modal_admin_delete') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('❌ Unauthorized.');
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        try {
            if (supabase_1.supabase) {
                await supabase_1.supabase.from('keys').delete().eq('key_value', keyValue);
            }
            try {
                await panda_1.panda.deleteKey(keyValue);
            }
            catch (p) { }
            return interaction.editReply(`🗑️ **Key Deleted Successfully!**\nKey: \`${keyValue}\` removed from system.`);
        }
        catch (err) {
            return interaction.editReply(`❌ Delete Error: ${err.message}`);
        }
    }
    // ===== 14. ADMIN: BIND HWID (Max 3) =====
    else if (customId === 'modal_admin_add_hwid') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('❌ Unauthorized.');
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value').trim();
        try {
            if (!supabase_1.supabase)
                return interaction.editReply('❌ Database not initialized.');
            const { data } = await supabase_1.supabase.from('keys').select('*').eq('key_value', keyValue);
            if (!data || data.length === 0)
                return interaction.editReply(`❌ Key \`${keyValue}\` not found in database.`);
            const keyRecord = data[0];
            let currentHwids = keyRecord.hwids || [];
            if (!currentHwids.some((h) => (h.hwid_value || h) === hwidValue)) {
                if (currentHwids.length >= 3) {
                    return interaction.editReply(`❌ Key \`${keyValue}\` already has 3 HWIDs bound (Max: 3).`);
                }
                currentHwids.push({ custom_name: 'Admin Added', hwid_value: hwidValue });
            }
            const { error } = await supabase_1.supabase.from('keys').update({ hwids: currentHwids }).eq('id', keyRecord.id);
            if (error)
                throw new Error(error.message);
            return interaction.editReply(`✅ **HWID Bound! (${currentHwids.length}/3 Devices)**\nKey: \`${keyValue}\`\nHWID: \`${hwidValue}\``);
        }
        catch (err) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
    // ===== 15. ADMIN: REMOVE SPECIFIC HWID =====
    else if (customId === 'modal_admin_del_hwid') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('❌ Unauthorized.');
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value').trim();
        try {
            if (!supabase_1.supabase)
                return interaction.editReply('❌ Database not initialized.');
            const { data } = await supabase_1.supabase.from('keys').select('*').eq('key_value', keyValue);
            if (!data || data.length === 0)
                return interaction.editReply(`❌ Key \`${keyValue}\` not found in database.`);
            const keyRecord = data[0];
            let currentHwids = keyRecord.hwids || [];
            const targetIndex = currentHwids.findIndex((h) => (h.hwid_value || h) === hwidValue);
            if (targetIndex === -1) {
                return interaction.editReply(`❌ HWID \`${hwidValue}\` is not bound to this key.`);
            }
            currentHwids.splice(targetIndex, 1);
            const { error } = await supabase_1.supabase.from('keys').update({ hwids: currentHwids }).eq('id', keyRecord.id);
            if (error)
                throw new Error(error.message);
            return interaction.editReply(`✅ **Removed HWID!**\nKey: \`${keyValue}\`\nHWID: \`${hwidValue}\` cleared. Remaining: **${currentHwids.length}/3**`);
        }
        catch (err) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
}
