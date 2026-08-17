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
const stats_1 = require("../commands/stats");
const panda_1 = require("../panda");
const supabase_1 = require("../supabase");
async function handleInteraction(interaction) {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'panel') {
            await panel_1.panelCommand.execute(interaction);
        }
        else if (interaction.commandName === 'stats') {
            await stats_1.statsCommand.execute(interaction);
        }
    }
    else if (interaction.isButton()) {
        await handleButton(interaction);
    }
    else if (interaction.isModalSubmit()) {
        await handleModal(interaction);
    }
}
async function handleButton(interaction) {
    const { customId } = interaction;
    // V2 UI Router Logic
    switch (customId) {
        case 'keys':
            await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            try {
                let userKeys = [];
                // 1. Fetch from Supabase if configured
                if (supabase_1.supabase) {
                    const { data, error } = await supabase_1.supabase.from('keys').select('*').eq('discord_id', interaction.user.id);
                    if (!error && data) {
                        userKeys = data;
                    }
                }
                // 2. Fetch from Pandauth as enrichment/fallback
                try {
                    const pandaKeys = await panda_1.panda.getKeysByDiscord(interaction.user.id);
                    if (Array.isArray(pandaKeys) && pandaKeys.length > 0) {
                        for (const pk of pandaKeys) {
                            const val = pk.value || pk.key || pk.keyValue;
                            if (val && !userKeys.some((k) => k.key_value === val)) {
                                userKeys.push({
                                    custom_name: pk.note || 'Pandauth Key',
                                    key_value: val,
                                    created_at: pk.createdAt || pk.created_at
                                });
                            }
                        }
                    }
                }
                catch (pErr) {
                    console.warn("Could not query Pandauth by discordId:", pErr);
                }
                const payload = panel_1.panelCommand.renderPanel({ page: 'keys', myKeys: userKeys });
                await interaction.editReply(payload);
            }
            catch (err) {
                console.error("Error fetching keys:", err);
                await interaction.editReply({ content: 'Failed to retrieve keys. Please try again later.' });
            }
            return;
        case 'dismiss_ephemeral':
            await interaction.deferUpdate();
            await interaction.deleteReply();
            return;
        case 'add':
            const addModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_add_hwid')
                .setTitle('Add HWID to Key');
            const keyInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const hwidNameInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_hwid_name')
                .setLabel('Custom HWID Name')
                .setPlaceholder('e.g., My Main PC')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const hwidValueInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_hwid_value')
                .setLabel('HWID String')
                .setPlaceholder('Paste your HWID here')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            addModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(keyInput), new discord_js_1.ActionRowBuilder().addComponents(hwidNameInput), new discord_js_1.ActionRowBuilder().addComponents(hwidValueInput));
            await interaction.showModal(addModal);
            return;
        case 'remove':
            const removeModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_remove_hwid')
                .setTitle('Remove HWID from Key');
            const rKeyInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const rHwidValueInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_hwid_value')
                .setLabel('Exact HWID String to Remove')
                .setPlaceholder('Paste the HWID here')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            removeModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(rKeyInput), new discord_js_1.ActionRowBuilder().addComponents(rHwidValueInput));
            await interaction.showModal(removeModal);
            return;
        case 'show_hwids':
            const showModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_show_hwid')
                .setTitle('Show Key HWIDs');
            const showKeyInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            showModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(showKeyInput));
            await interaction.showModal(showModal);
            return;
        case 'reset_hwid':
            const resetModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_reset_hwid')
                .setTitle('Reset Key HWID');
            const resetKeyInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setPlaceholder('Enter key to reset HWID')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            resetModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(resetKeyInput));
            await interaction.showModal(resetModal);
            return;
        case 'buy':
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_buy')
                .setTitle('Buy Monthly Plan (300 THB)');
            const linkInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_tw_link')
                .setLabel('TrueMoney Gift Link')
                .setPlaceholder('https://gift.truemoney.com/campaign/?v=xxxxxx')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const nameInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_custom_name')
                .setLabel('Custom Key Name')
                .setPlaceholder('e.g., My Main PC')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(linkInput), new discord_js_1.ActionRowBuilder().addComponents(nameInput));
            await interaction.showModal(modal);
            return;
        case 'buy_cashcard':
            const ccModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_buy_cashcard')
                .setTitle('Topup with TrueMoney Cash Card');
            const ccInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_cashcard_14')
                .setLabel('TrueMoney Cash Card (14 digits)')
                .setPlaceholder('Enter your 14 digits here...')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(14)
                .setMaxLength(14);
            const ccNameInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_custom_name')
                .setLabel('Custom Key Name')
                .setPlaceholder('e.g., My Main PC')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            ccModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(ccInput), new discord_js_1.ActionRowBuilder().addComponents(ccNameInput));
            await interaction.showModal(ccModal);
            return;
        case 'renew':
            const renewModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_renew')
                .setTitle('Renew Key (ต่ออายุ 30 วัน)');
            const renewKeyInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setPlaceholder('กรอก Key ที่ต้องการต่ออายุ')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const renewLinkInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_tw_link')
                .setLabel('TrueMoney Gift Link (300 THB)')
                .setPlaceholder('https://gift.truemoney.com/campaign/?v=xxxxxx')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            renewModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(renewKeyInput), new discord_js_1.ActionRowBuilder().addComponents(renewLinkInput));
            await interaction.showModal(renewModal);
            return;
        case 'renew_cashcard':
            const renewCcModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_renew_cashcard')
                .setTitle('Renew Key (TrueMoney Cash Card)');
            const renewCcKeyInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setPlaceholder('กรอก Key ที่ต้องการต่ออายุ')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const renewCcInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_cashcard_14')
                .setLabel('TrueMoney Cash Card (14 digits)')
                .setPlaceholder('Enter your 14 digits here...')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(14)
                .setMaxLength(14);
            renewCcModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(renewCcKeyInput), new discord_js_1.ActionRowBuilder().addComponents(renewCcInput));
            await interaction.showModal(renewCcModal);
            return;
        // ===== ADMIN DM PANEL BUTTONS =====
        case 'admin_btn_gen':
            const adminGenModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_admin_gen')
                .setTitle('Create VIP Key for User');
            const gUserInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_target_user')
                .setLabel('Target Discord User ID or Mention')
                .setPlaceholder('e.g. 123456789012345678')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const gDaysInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_days')
                .setLabel('Key Validity Days')
                .setPlaceholder('30')
                .setValue('30')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const gNameInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_name')
                .setLabel('Key Custom Name')
                .setPlaceholder('e.g. VIP-Customer')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(false);
            adminGenModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(gUserInput), new discord_js_1.ActionRowBuilder().addComponents(gDaysInput), new discord_js_1.ActionRowBuilder().addComponents(gNameInput));
            await interaction.showModal(adminGenModal);
            return;
        case 'admin_btn_find':
            const adminFindModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_admin_find')
                .setTitle('Find Keys by User ID or Key');
            const fQueryInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_query')
                .setLabel('Discord User ID or Key Value')
                .setPlaceholder('e.g. 123456789012345678 or VIP-XXXX')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            adminFindModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(fQueryInput));
            await interaction.showModal(adminFindModal);
            return;
        case 'admin_btn_reset':
            const adminResetModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_admin_reset')
                .setTitle('Reset HWID for Any Key');
            const rstKeyInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value to Reset')
                .setPlaceholder('VIP-XXXX-XXXX-XXXX')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            adminResetModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(rstKeyInput));
            await interaction.showModal(adminResetModal);
            return;
        case 'admin_btn_extend':
            const adminExtModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_admin_extend')
                .setTitle('Extend Key Expiration');
            const extKeyInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value to Extend')
                .setPlaceholder('VIP-XXXX-XXXX-XXXX')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const extDaysInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_days')
                .setLabel('Days to Add')
                .setPlaceholder('30')
                .setValue('30')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            adminExtModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(extKeyInput), new discord_js_1.ActionRowBuilder().addComponents(extDaysInput));
            await interaction.showModal(adminExtModal);
            return;
        case 'admin_btn_delete':
            const adminDelModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_admin_delete')
                .setTitle('Delete Key from System');
            const delKeyInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value to Delete')
                .setPlaceholder('VIP-XXXX-XXXX-XXXX')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            adminDelModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(delKeyInput));
            await interaction.showModal(adminDelModal);
            return;
        case 'admin_btn_addhwid':
            const adminAddHwidModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_admin_add_hwid')
                .setTitle('Add HWID for Key');
            const ahKeyInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value')
                .setPlaceholder('VIP-XXXX-XXXX-XXXX')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const ahHwidInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_hwid_value')
                .setLabel('HWID String')
                .setPlaceholder('Paste HWID here')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const ahNameInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_hwid_name')
                .setLabel('HWID Label / Device Name')
                .setPlaceholder('e.g. PC 2')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(false);
            adminAddHwidModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(ahKeyInput), new discord_js_1.ActionRowBuilder().addComponents(ahHwidInput), new discord_js_1.ActionRowBuilder().addComponents(ahNameInput));
            await interaction.showModal(adminAddHwidModal);
            return;
        case 'admin_btn_delhwid':
            const adminDelHwidModal = new discord_js_1.ModalBuilder()
                .setCustomId('modal_admin_del_hwid')
                .setTitle('Remove HWID from Key');
            const dhKeyInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value')
                .setPlaceholder('VIP-XXXX-XXXX-XXXX')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const dhHwidInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_hwid_value')
                .setLabel('HWID String to Remove')
                .setPlaceholder('Paste HWID here')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            adminDelHwidModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(dhKeyInput), new discord_js_1.ActionRowBuilder().addComponents(dhHwidInput));
            await interaction.showModal(adminDelHwidModal);
            return;
        case 'admin_btn_stats':
            await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            try {
                if (!supabase_1.supabase) {
                    return interaction.editReply('Database not initialized.');
                }
                const { data: keysData, error: sErr } = await supabase_1.supabase.from('keys').select('*');
                if (sErr || !keysData) {
                    return interaction.editReply('Failed to fetch statistics.');
                }
                const totalKeys = keysData.length;
                const uniqueUsers = new Set(keysData.map((k) => k.discord_id)).size;
                return interaction.editReply(`📊 **Key Statistics:**\n• Total Customers: **${uniqueUsers}** users\n• Total Active Keys: **${totalKeys}** keys`);
            }
            catch (err) {
                return interaction.editReply(`Error: ${err.message}`);
            }
    }
    // Fallback for V1 buttons (if any are still active)
    if (customId.startsWith('approve_cc_') || customId.startsWith('approve_renew_cc_')) {
        const parts = customId.split('_');
        // approve_cc_<userId>  OR  approve_renew_cc_<userId>
        const userId = parts[parts.length - 1];
        const isRenew = customId.startsWith('approve_renew_cc_');
        const msgContent = interaction.message.content;
        await interaction.deferReply();
        try {
            if (isRenew) {
                // Renew key flow
                const keyMatch = msgContent.match(/Key: `([^`]+)`/);
                const keyToRenew = keyMatch ? keyMatch[1] : null;
                if (!keyToRenew) {
                    return interaction.editReply('Could not extract key from request message.');
                }
                await panda_1.panda.extendKey(keyToRenew, 30);
                const targetUser = await interaction.client.users.fetch(userId).catch(() => null);
                if (targetUser) {
                    await targetUser.send(`ต่ออายุ Key สำเร็จ!\n**Key:** \`${keyToRenew}\`\nเพิ่ม 30 วัน`).catch(() => null);
                }
                const adminId = process.env.ADMIN_ID;
                if (adminId) {
                    const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
                    if (adminUser) {
                        await adminUser.send(`**[LOG] Key Renewed (Cash Card Approved)**\nUser: <@${userId}>\nKey: \`${keyToRenew}\`\n+30 Days`).catch(() => null);
                    }
                }
                await interaction.editReply('Renewed key and notified user.');
            }
            else {
                // New key flow (original)
                const keyNameMatch = msgContent.match(/Key Name: `(.*)`/);
                const customName = keyNameMatch ? keyNameMatch[1] : 'CashCard VIP';
                const generatedKey = await panda_1.panda.generateKey({
                    count: 1,
                    prefix: "VIP",
                    expirationType: "byDays",
                    expirationDays: 30,
                    isPremium: true,
                    noHwidValidation: true,
                    discordId: userId,
                    note: `${customName} (Discord: ${userId})`
                });
                if (supabase_1.supabase) {
                    const { error: insertErr } = await supabase_1.supabase.from('keys').insert([{
                            discord_id: userId,
                            custom_name: customName,
                            key_value: generatedKey
                        }]);
                    if (insertErr) {
                        console.error("Supabase Insertion Error (Cash Card):", insertErr);
                    }
                }
                const targetUser = await interaction.client.users.fetch(userId).catch(() => null);
                if (targetUser) {
                    await targetUser.send(`Your TrueMoney Cash Card topup was approved!\n**Key:** \`${generatedKey}\`\nName: \`${customName}\``).catch(() => null);
                }
                const adminId = process.env.ADMIN_ID;
                if (adminId) {
                    const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
                    if (adminUser) {
                        await adminUser.send(`**[LOG] New Key Purchased (Cash Card Approved)**\nUser: <@${userId}>\nUser ID: \`${userId}\`\nKey Name: \`${customName}\`\nGenerated Key: \`${generatedKey}\``).catch(() => null);
                    }
                }
                await interaction.editReply(`Approved and sent key to user.`);
            }
            await interaction.message.edit({ components: [] }).catch(() => null);
        }
        catch (err) {
            console.error(err);
            const errMsg = err?.message || String(err);
            await interaction.editReply(`Error processing request: ${errMsg}`);
        }
        return;
    }
    else if (customId.startsWith('reject_cc_')) {
        const userId = customId.split('_')[customId.split('_').length - 1];
        await interaction.deferReply();
        try {
            const targetUser = await interaction.client.users.fetch(userId).catch(() => null);
            if (targetUser) {
                await targetUser.send(`Your TrueMoney Cash Card request was rejected by the admin. Please check your card or contact support.`).catch(() => null);
            }
            await interaction.editReply(`Rejected request and notified user.`);
            await interaction.message.edit({ components: [] }).catch(() => null);
        }
        catch (err) {
            console.error(err);
            await interaction.editReply(`Error notifying user.`);
        }
        return;
    }
    if (customId === 'btn_info') {
        await interaction.reply({ content: 'Monthly Pricing Info: Gain access to exclusive premium features.', flags: discord_js_1.MessageFlags.Ephemeral });
    }
    else if (customId === 'btn_buy') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_buy_key')
            .setTitle('Buy Monthly Plan');
        const discordIdInput = new discord_js_1.TextInputBuilder()
            .setCustomId('discord_id')
            .setLabel('Discord ID')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const customNameInput = new discord_js_1.TextInputBuilder()
            .setCustomId('custom_name')
            .setLabel('Custom Key Name')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const voucherInput = new discord_js_1.TextInputBuilder()
            .setCustomId('voucher')
            .setLabel('TrueMoney Voucher')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(discordIdInput), new discord_js_1.ActionRowBuilder().addComponents(customNameInput), new discord_js_1.ActionRowBuilder().addComponents(voucherInput));
        await interaction.showModal(modal);
    }
    else if (customId === 'btn_show_keys') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_show_keys')
            .setTitle('Show Keys');
        const discordIdInput = new discord_js_1.TextInputBuilder()
            .setCustomId('discord_id')
            .setLabel('Discord ID')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(discordIdInput));
        await interaction.showModal(modal);
    }
    else if (customId === 'btn_show_hwid') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_show_hwid')
            .setTitle('Show HWID');
        const discordIdInput = new discord_js_1.TextInputBuilder()
            .setCustomId('discord_id')
            .setLabel('Discord ID')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const actualKeyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('actual_key')
            .setLabel('Actual Key')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(discordIdInput), new discord_js_1.ActionRowBuilder().addComponents(actualKeyInput));
        await interaction.showModal(modal);
    }
    else if (customId === 'btn_add_hwid') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_add_hwid')
            .setTitle('Add HWID');
        const discordIdInput = new discord_js_1.TextInputBuilder()
            .setCustomId('discord_id')
            .setLabel('Discord ID')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const actualKeyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('actual_key')
            .setLabel('Actual Key')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(discordIdInput), new discord_js_1.ActionRowBuilder().addComponents(actualKeyInput));
        await interaction.showModal(modal);
    }
    else if (customId === 'btn_remove_hwid') {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('modal_remove_hwid')
            .setTitle('Remove HWID');
        const discordIdInput = new discord_js_1.TextInputBuilder()
            .setCustomId('discord_id')
            .setLabel('Discord ID')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const actualKeyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('actual_key')
            .setLabel('Actual Key')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const hwidInput = new discord_js_1.TextInputBuilder()
            .setCustomId('hwid')
            .setLabel('HWID to Remove')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(discordIdInput), new discord_js_1.ActionRowBuilder().addComponents(actualKeyInput), new discord_js_1.ActionRowBuilder().addComponents(hwidInput));
        await interaction.showModal(modal);
    }
}
async function handleModal(interaction) {
    const { customId } = interaction;
    // Placeholder responses for now
    if (customId === 'modal_buy_cashcard') {
        const cashcard = interaction.fields.getTextInputValue('input_cashcard_14');
        const customName = interaction.fields.getTextInputValue('input_custom_name');
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (!adminId) {
            return interaction.editReply('Admin ID (ADMIN_ID) is not configured in the system. Please contact the administrator.');
        }
        try {
            const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
            if (adminUser) {
                const approveBtn = new discord_js_1.ButtonBuilder()
                    .setCustomId(`approve_cc_${interaction.user.id}`)
                    .setLabel('Done (Generate Key)')
                    .setStyle(discord_js_1.ButtonStyle.Success);
                const rejectBtn = new discord_js_1.ButtonBuilder()
                    .setCustomId(`reject_cc_${interaction.user.id}`)
                    .setLabel('Reject')
                    .setStyle(discord_js_1.ButtonStyle.Danger);
                const row = new discord_js_1.ActionRowBuilder().addComponents(approveBtn, rejectBtn);
                await adminUser.send({
                    content: `**New Cash Card Topup Request**\nUser: <@${interaction.user.id}> (${interaction.user.username})\nUser ID: \`${interaction.user.id}\`\nKey Name: \`${customName}\`\nCash Card 14 Digits: \`${cashcard}\`\n\nPlease check the cash card. If valid, click Done to generate a key for the user.`,
                    components: [row]
                });
                return interaction.editReply('Your cash card has been sent to the admin. Please wait for the admin to verify and send you the key.');
            }
            else {
                return interaction.editReply('Could not find the admin user. Please contact the administrator.');
            }
        }
        catch (err) {
            console.error('Error sending DM to admin:', err);
            return interaction.editReply('Failed to send request to admin.');
        }
    }
    else if (customId === 'modal_buy') {
        const link = interaction.fields.getTextInputValue('input_tw_link');
        const customName = interaction.fields.getTextInputValue('input_custom_name');
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        try {
            const twPhone = process.env.TW_PHONE || '0000000000';
            const expectedPrice = 300;
            if (!link.includes('gift.truemoney.com/campaign')) {
                return interaction.editReply('Invalid TrueMoney gift link!');
            }
            const hash = link.split('?v=')[1];
            if (!hash)
                return interaction.editReply('Invalid TrueMoney gift link hash!');
            // got-scraping bypasses Cloudflare TLS fingerprinting
            const { gotScraping } = await Promise.resolve().then(() => __importStar(require('got-scraping')));
            const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${hash}/verify?mobile=${twPhone}`;
            let verifyData;
            try {
                const verifyRes = await gotScraping.get({
                    url: verifyUrl,
                    headerGeneratorOptions: {
                        browsers: ['firefox'],
                        operatingSystems: ['windows'],
                        locales: ['en-US']
                    },
                    headers: {
                        'Referer': link,
                    },
                    responseType: 'json'
                });
                verifyData = verifyRes.body;
            }
            catch (e) {
                console.error("TrueMoney Verify Error:", e.response?.body || e.message);
                const errBody = typeof e.response?.body === 'string' ? e.response.body.substring(0, 300) : e.message;
                return interaction.editReply(`Voucher verification failed: \n\`\`\`${errBody}\`\`\``);
            }
            if (verifyData.status?.code !== 'SUCCESS') {
                let errMsg = verifyData.status?.message || verifyData.message || JSON.stringify(verifyData);
                return interaction.editReply(`Voucher error: ${errMsg}`);
            }
            const voucherAmount = parseInt(verifyData.data.voucher.amount_baht);
            if (voucherAmount !== expectedPrice) {
                return interaction.editReply(`Invalid amount! Expected ${expectedPrice} THB, got ${voucherAmount} THB.`);
            }
            const redeemUrl = `https://gift.truemoney.com/campaign/vouchers/${hash}/redeem`;
            let redeemData;
            try {
                const redeemRes = await gotScraping.post({
                    url: redeemUrl,
                    headerGeneratorOptions: {
                        browsers: ['firefox'],
                        operatingSystems: ['windows'],
                        locales: ['en-US']
                    },
                    headers: {
                        'Referer': link,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        mobile: twPhone,
                        voucher_hash: hash
                    }),
                    responseType: 'json'
                });
                redeemData = redeemRes.body;
            }
            catch (e) {
                console.error("TrueMoney Redeem Error:", e.response?.body || e.message);
                return interaction.editReply(`Redeem failed (Network Error).`);
            }
            if (redeemData.status?.code !== 'SUCCESS') {
                return interaction.editReply(`Redeem failed: ${redeemData.status?.message || 'Unknown'}`);
            }
            // TRUE MONEY PAYMENT SUCCESS, GENERATE KEY
            const generatedKey = await panda_1.panda.generateKey({
                count: 1,
                prefix: "VIP",
                expirationType: "byDays",
                expirationDays: 30,
                isPremium: true,
                noHwidValidation: true,
                discordId: interaction.user.id,
                note: `${customName} (Discord: ${interaction.user.id})`
            });
            // Insert into Supabase keys table if configured
            if (supabase_1.supabase) {
                const { error: dbError } = await supabase_1.supabase
                    .from('keys')
                    .insert([{
                        discord_id: interaction.user.id,
                        custom_name: customName,
                        key_value: generatedKey
                    }]);
                if (dbError) {
                    console.error("Supabase Insertion Error:", dbError);
                    return interaction.editReply(`Payment successful, but failed to save to database. Your key is: \`${generatedKey}\``);
                }
            }
            else {
                console.warn("Supabase not initialized, skipping DB insert.");
            }
            const adminId = process.env.ADMIN_ID;
            if (adminId) {
                const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
                if (adminUser) {
                    await adminUser.send(`**[LOG] New Key Purchased (TrueMoney Gift Link)**\nUser: <@${interaction.user.id}> (${interaction.user.username})\nUser ID: \`${interaction.user.id}\`\nKey Name: \`${customName}\`\nAmount: \`${expectedPrice} THB\`\nGenerated Key: \`${generatedKey}\``).catch(() => null);
                }
            }
            return interaction.editReply(`Payment successful! Your VIP key has been generated and saved to your account.\n\n**Key:** \`${generatedKey}\``);
        }
        catch (err) {
            console.error(err);
            return interaction.editReply('System error processing payment.');
        }
    }
    else if (customId === 'modal_buy_key') {
        const discordId = interaction.fields.getTextInputValue('discord_id');
        const customName = interaction.fields.getTextInputValue('custom_name');
        const voucher = interaction.fields.getTextInputValue('voucher');
        await interaction.reply({ content: `Received Buy Key request for ${discordId} - ${customName}. Voucher: ${voucher}`, flags: discord_js_1.MessageFlags.Ephemeral });
    }
    else if (customId === 'modal_show_keys') {
        const discordId = interaction.fields.getTextInputValue('discord_id');
        await interaction.reply({ content: `Received Show Keys request for ${discordId}`, flags: discord_js_1.MessageFlags.Ephemeral });
    }
    else if (customId === 'modal_add_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const customName = interaction.fields.getTextInputValue('input_hwid_name');
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value');
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        if (!supabase_1.supabase) {
            return interaction.editReply('Database not initialized.');
        }
        try {
            // 1. Fetch the key to ensure it belongs to the user
            const { data, error: fetchError } = await supabase_1.supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);
            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }
            const keyRecord = data[0];
            const currentHwids = keyRecord.hwids || [];
            // 2. Check Max HWIDs limit (3)
            if (currentHwids.length >= 3) {
                return interaction.editReply('Maximum HWID limit (3) reached for this key.');
            }
            // 3. Append to local DB array
            currentHwids.push({ custom_name: customName, hwid_value: hwidValue });
            // 4. Update Supabase
            const { error: updateError } = await supabase_1.supabase
                .from('keys')
                .update({ hwids: currentHwids })
                .eq('id', keyRecord.id);
            if (updateError) {
                console.error("Supabase Update Error:", updateError);
                return interaction.editReply('Failed to save HWID to database.');
            }
            // Sync unbind with Pandauth so it doesn't reject new HWIDs
            try {
                await panda_1.panda.resetHwid(keyValue);
            }
            catch (e) {
                // Ignore pandauth reset errors
            }
            return interaction.editReply(`Successfully bound HWID **${customName}** to key \`${keyValue}\`.`);
        }
        catch (err) {
            console.error(err);
            return interaction.editReply('System error processing HWID addition.');
        }
    }
    else if (customId === 'modal_show_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        if (!supabase_1.supabase) {
            return interaction.editReply('Database not initialized.');
        }
        try {
            const { data, error: fetchError } = await supabase_1.supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);
            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }
            const keyRecord = data[0];
            const hwidsList = keyRecord.hwids || [];
            if (hwidsList.length === 0) {
                return interaction.editReply(`**Key:** \`${keyValue}\`\n\nNo HWIDs are currently bound to this key.`);
            }
            let hwidText = `**Key:** \`${keyValue}\`\n\n**Bound HWIDs:**\n`;
            hwidsList.forEach((hwid, i) => {
                hwidText += `${i + 1}. \`${hwid.hwid_value}\` (${hwid.custom_name})\n`;
            });
            return interaction.editReply(hwidText);
        }
        catch (e) {
            console.error("Parse Note Error:", e);
            return interaction.editReply('Failed to fetch HWID data.');
        }
    }
    else if (customId === 'modal_remove_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value');
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        if (!supabase_1.supabase) {
            return interaction.editReply('Database not initialized.');
        }
        try {
            // 1. Fetch the key to ensure it belongs to the user
            const { data, error: fetchError } = await supabase_1.supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);
            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }
            const keyRecord = data[0];
            const currentHwids = keyRecord.hwids || [];
            // 2. Filter out the HWID
            const newHwids = currentHwids.filter((h) => h.hwid_value !== hwidValue);
            if (newHwids.length === currentHwids.length) {
                return interaction.editReply('That HWID was not found on this key.');
            }
            // 3. Update Supabase
            const { error: updateError } = await supabase_1.supabase
                .from('keys')
                .update({ hwids: newHwids })
                .eq('id', keyRecord.id);
            if (updateError) {
                console.error("Supabase Update Error:", updateError);
                return interaction.editReply('Failed to remove HWID from database.');
            }
            return interaction.editReply(`Successfully removed HWID **${hwidValue}** from key \`${keyValue}\`.`);
        }
        catch (err) {
            console.error(err);
            return interaction.editReply('System error processing HWID removal.');
        }
    }
    else if (customId === 'modal_reset_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        try {
            // 1. Verify key ownership if Supabase is connected
            if (supabase_1.supabase) {
                const { data, error: fetchError } = await supabase_1.supabase
                    .from('keys')
                    .select('*')
                    .eq('key_value', keyValue)
                    .eq('discord_id', interaction.user.id);
                if (fetchError || !data || data.length === 0) {
                    return interaction.editReply('Invalid key or you do not own this key.');
                }
                // Clear bound HWIDs array in Supabase
                await supabase_1.supabase
                    .from('keys')
                    .update({ hwids: [] })
                    .eq('id', data[0].id);
            }
            // 2. Reset HWID in Pandauth
            await panda_1.panda.resetHwid(keyValue);
            return interaction.editReply(`✅ **HWID Reset Successful!**\nKey: \`${keyValue}\`\n\nYour key is now ready to use on your new device/PC without Error 300.`);
        }
        catch (err) {
            console.error("Reset HWID Error:", err);
            return interaction.editReply(`Error resetting HWID: ${err.message || String(err)}`);
        }
    }
    // ===== RENEW KEY (TrueMoney Gift Link) =====
    else if (customId === 'modal_renew') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const link = interaction.fields.getTextInputValue('input_tw_link');
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        try {
            // Verify key belongs to user in Supabase
            if (supabase_1.supabase) {
                const { data, error: fetchError } = await supabase_1.supabase
                    .from('keys')
                    .select('*')
                    .eq('key_value', keyValue)
                    .eq('discord_id', interaction.user.id);
                if (fetchError || !data || data.length === 0) {
                    return interaction.editReply('ไม่พบ Key นี้ในบัญชีของคุณ กรุณาตรวจสอบ Key อีกครั้ง');
                }
            }
            const twPhone = process.env.TW_PHONE || '0000000000';
            const expectedPrice = 300;
            if (!link.includes('gift.truemoney.com/campaign')) {
                return interaction.editReply('Invalid TrueMoney gift link!');
            }
            const hash = link.split('?v=')[1];
            if (!hash)
                return interaction.editReply('Invalid TrueMoney gift link hash!');
            const { gotScraping } = await Promise.resolve().then(() => __importStar(require('got-scraping')));
            // Verify voucher
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
                return interaction.editReply(`Voucher verification failed:\n\`\`\`${errBody}\`\`\``);
            }
            if (verifyData.status?.code !== 'SUCCESS') {
                return interaction.editReply(`Voucher error: ${verifyData.status?.message || JSON.stringify(verifyData)}`);
            }
            const voucherAmount = parseInt(verifyData.data.voucher.amount_baht);
            if (voucherAmount !== expectedPrice) {
                return interaction.editReply(`จำนวนเงินไม่ถูกต้อง! ต้องการ ${expectedPrice} THB แต่ได้ ${voucherAmount} THB`);
            }
            // Redeem voucher
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
                return interaction.editReply(`Redeem failed (Network Error).`);
            }
            if (redeemData.status?.code !== 'SUCCESS') {
                return interaction.editReply(`Redeem failed: ${redeemData.status?.message || 'Unknown'}`);
            }
            // PAYMENT SUCCESS — Extend key via Pandauth
            await panda_1.panda.extendKey(keyValue, 30); // +30 days
            const adminId = process.env.ADMIN_ID;
            if (adminId) {
                const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
                if (adminUser) {
                    await adminUser.send(`**[LOG] Key Renewed (TrueMoney Link)**\nUser: <@${interaction.user.id}> (${interaction.user.username})\nKey: \`${keyValue}\`\nAmount: \`${expectedPrice} THB\`\n+30 Days`).catch(() => null);
                }
            }
            return interaction.editReply(`ต่ออายุ Key สำเร็จ!\n\n**Key:** \`${keyValue}\`\nเพิ่ม 30 วัน เรียบร้อยแล้ว`);
        }
        catch (err) {
            console.error(err);
            return interaction.editReply('System error processing renewal.');
        }
    }
    // ===== RENEW KEY (TrueMoney Cash Card) =====
    else if (customId === 'modal_renew_cashcard') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const cashcard = interaction.fields.getTextInputValue('input_cashcard_14');
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        // Verify key belongs to user in Supabase
        if (supabase_1.supabase) {
            const { data, error: fetchError } = await supabase_1.supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);
            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('ไม่พบ Key นี้ในบัญชีของคุณ กรุณาตรวจสอบ Key อีกครั้ง');
            }
        }
        const adminId = process.env.ADMIN_ID;
        if (!adminId) {
            return interaction.editReply('Admin ID (ADMIN_ID) is not configured. Please contact the administrator.');
        }
        try {
            const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
            if (adminUser) {
                const approveBtn = new discord_js_1.ButtonBuilder()
                    .setCustomId(`approve_renew_cc_${interaction.user.id}`)
                    .setLabel('Approve Renewal')
                    .setStyle(discord_js_1.ButtonStyle.Success);
                const rejectBtn = new discord_js_1.ButtonBuilder()
                    .setCustomId(`reject_cc_${interaction.user.id}`)
                    .setLabel('Reject')
                    .setStyle(discord_js_1.ButtonStyle.Danger);
                const row = new discord_js_1.ActionRowBuilder().addComponents(approveBtn, rejectBtn);
                await adminUser.send({
                    content: `**[KEY RENEWAL REQUEST] Cash Card**\nUser: <@${interaction.user.id}> (${interaction.user.username})\nUser ID: \`${interaction.user.id}\`\nKey: \`${keyValue}\`\nCash Card 14 Digits: \`${cashcard}\`\n\nPlease verify the cash card and click Approve to extend the key by 30 days.`,
                    components: [row]
                });
                return interaction.editReply('ส่งคำขอต่ออายุไปยัง Admin แล้ว กรุณารอ Admin ตรวจสอบและอนุมัติ');
            }
            else {
                return interaction.editReply('Could not find the admin user. Please contact the administrator.');
            }
        }
        catch (err) {
            console.error('Error sending renew DM to admin:', err);
            return interaction.editReply('Failed to send renewal request to admin.');
        }
    }
    // ===== ADMIN MODAL: CREATE / GENERATE KEY FOR USER =====
    else if (customId === 'modal_admin_gen') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('Unauthorized.');
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
                noHwidValidation: true,
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
            // Attempt DM to user
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
            console.error("Admin Modal Gen Error:", err);
            return interaction.editReply(`❌ Error creating key: ${err.message || String(err)}`);
        }
    }
    // ===== ADMIN MODAL: FIND KEYS =====
    else if (customId === 'modal_admin_find') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('Unauthorized.');
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
                const hwids = k.hwids || [];
                resultText += `**${i + 1}. ${k.custom_name}** (<@${k.discord_id}>)\nKey: \`${k.key_value}\`\nHWIDs (${hwids.length}/3):\n`;
                if (hwids.length > 0) {
                    hwids.forEach((h, hi) => {
                        resultText += `  • \`${h.hwid_value}\` (${h.custom_name})\n`;
                    });
                }
                else {
                    resultText += `  • (None bound)\n`;
                }
                resultText += '\n';
            }
            return interaction.editReply(resultText);
        }
        catch (err) {
            return interaction.editReply(`❌ Search Error: ${err.message}`);
        }
    }
    // ===== ADMIN MODAL: RESET HWID =====
    else if (customId === 'modal_admin_reset') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('Unauthorized.');
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        try {
            if (supabase_1.supabase) {
                await supabase_1.supabase.from('keys').update({ hwids: [] }).eq('key_value', keyValue);
            }
            await panda_1.panda.resetHwid(keyValue);
            return interaction.editReply(`✅ **HWID Reset Successful!**\nKey: \`${keyValue}\`\nAll HWIDs unlinked in Database and Pandauth.`);
        }
        catch (err) {
            return interaction.editReply(`❌ Reset Error: ${err.message}`);
        }
    }
    // ===== ADMIN MODAL: EXTEND KEY =====
    else if (customId === 'modal_admin_extend') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('Unauthorized.');
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
    // ===== ADMIN MODAL: DELETE KEY =====
    else if (customId === 'modal_admin_delete') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('Unauthorized.');
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
    // ===== ADMIN MODAL: ADD HWID =====
    else if (customId === 'modal_admin_add_hwid') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('Unauthorized.');
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value').trim();
        const hwidName = interaction.fields.getTextInputValue('input_hwid_name').trim() || 'Admin Added HWID';
        try {
            if (!supabase_1.supabase)
                return interaction.editReply('Database not initialized.');
            const { data } = await supabase_1.supabase.from('keys').select('*').eq('key_value', keyValue);
            if (!data || data.length === 0)
                return interaction.editReply(`❌ Key \`${keyValue}\` not found in database.`);
            const keyRecord = data[0];
            const currentHwids = keyRecord.hwids || [];
            if (currentHwids.length >= 3)
                return interaction.editReply(`❌ Key already has 3 HWIDs bound.`);
            currentHwids.push({ custom_name: hwidName, hwid_value: hwidValue });
            await supabase_1.supabase.from('keys').update({ hwids: currentHwids }).eq('id', keyRecord.id);
            try {
                await panda_1.panda.resetHwid(keyValue);
            }
            catch (e) { }
            return interaction.editReply(`✅ **Added HWID!**\nKey: \`${keyValue}\`\nHWID: \`${hwidValue}\` (${hwidName})\nCount: ${currentHwids.length}/3`);
        }
        catch (err) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
    // ===== ADMIN MODAL: REMOVE HWID =====
    else if (customId === 'modal_admin_del_hwid') {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId)
            return interaction.editReply('Unauthorized.');
        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value').trim();
        try {
            if (!supabase_1.supabase)
                return interaction.editReply('Database not initialized.');
            const { data } = await supabase_1.supabase.from('keys').select('*').eq('key_value', keyValue);
            if (!data || data.length === 0)
                return interaction.editReply(`❌ Key \`${keyValue}\` not found in database.`);
            const keyRecord = data[0];
            const currentHwids = keyRecord.hwids || [];
            const newHwids = currentHwids.filter((h) => h.hwid_value !== hwidValue);
            if (newHwids.length === currentHwids.length) {
                return interaction.editReply(`❌ HWID \`${hwidValue}\` not found in this key.`);
            }
            await supabase_1.supabase.from('keys').update({ hwids: newHwids }).eq('id', keyRecord.id);
            return interaction.editReply(`✅ **Removed HWID!**\nKey: \`${keyValue}\`\nHWID: \`${hwidValue}\``);
        }
        catch (err) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }
}
