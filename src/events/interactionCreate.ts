import { Interaction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction, ButtonInteraction, MessageFlags, ButtonBuilder, ButtonStyle } from 'discord.js';
import { panelCommand } from '../commands/panel';
import { statsCommand } from '../commands/stats';
import axios from 'axios';
import { panda } from '../panda';
import { supabase } from '../supabase';

export async function handleInteraction(interaction: Interaction) {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'panel') {
            await panelCommand.execute(interaction as any);
        } else if (interaction.commandName === 'stats') {
            await statsCommand.execute(interaction);
        }
    } else if (interaction.isButton()) {
        await handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
        await handleModal(interaction);
    }
}

async function handleButton(interaction: ButtonInteraction) {
    const { customId } = interaction;

    // V2 UI Router Logic
    switch (customId) {
        case 'keys':
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            try {
                let userKeys: any[] = [];

                // 1. Fetch from Supabase if configured
                if (supabase) {
                    const { data, error } = await supabase.from('keys').select('*').eq('discord_id', interaction.user.id);
                    if (!error && data) {
                        userKeys = data;
                    }
                }

                // 2. Fetch from Pandauth as enrichment/fallback
                try {
                    const pandaKeys = await panda.getKeysByDiscord(interaction.user.id);
                    if (Array.isArray(pandaKeys) && pandaKeys.length > 0) {
                        for (const pk of pandaKeys) {
                            const val = pk.value || pk.key || pk.keyValue;
                            if (val && !userKeys.some((k: any) => k.key_value === val)) {
                                userKeys.push({
                                    custom_name: pk.note || 'Pandauth Key',
                                    key_value: val,
                                    created_at: pk.createdAt || pk.created_at
                                });
                            }
                        }
                    }
                } catch (pErr) {
                    console.warn("Could not query Pandauth by discordId:", pErr);
                }

                const payload = panelCommand.renderPanel({ page: 'keys', myKeys: userKeys }) as any;
                await interaction.editReply(payload);
            } catch (err: any) {
                console.error("Error fetching keys:", err);
                await interaction.editReply({ content: 'Failed to retrieve keys. Please try again later.' });
            }
            return;
        case 'dismiss_ephemeral':
            await interaction.deferUpdate();
            await interaction.deleteReply();
            return;
        case 'add':
            const addModal = new ModalBuilder()
                .setCustomId('modal_add_hwid')
                .setTitle('Add HWID to Key');

            const keyInput = new TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const hwidNameInput = new TextInputBuilder()
                .setCustomId('input_hwid_name')
                .setLabel('Custom HWID Name')
                .setPlaceholder('e.g., My Main PC')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const hwidValueInput = new TextInputBuilder()
                .setCustomId('input_hwid_value')
                .setLabel('HWID String')
                .setPlaceholder('Paste your HWID here')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            addModal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(keyInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(hwidNameInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(hwidValueInput)
            );
            await interaction.showModal(addModal);
            return;
        case 'remove':
            const removeModal = new ModalBuilder()
                .setCustomId('modal_remove_hwid')
                .setTitle('Remove HWID from Key');

            const rKeyInput = new TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const rHwidValueInput = new TextInputBuilder()
                .setCustomId('input_hwid_value')
                .setLabel('Exact HWID String to Remove')
                .setPlaceholder('Paste the HWID here')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            removeModal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(rKeyInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(rHwidValueInput)
            );
            await interaction.showModal(removeModal);
            return;
        case 'show_hwids':
            const showModal = new ModalBuilder()
                .setCustomId('modal_show_hwid')
                .setTitle('Show Key HWIDs');
            const showKeyInput = new TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            showModal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(showKeyInput));
            await interaction.showModal(showModal);
            return;

        case 'reset_hwid':
            const resetModal = new ModalBuilder()
                .setCustomId('modal_reset_hwid')
                .setTitle('Reset Key HWID');
            const resetKeyInput = new TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setPlaceholder('Enter key to reset HWID')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            resetModal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(resetKeyInput));
            await interaction.showModal(resetModal);
            return;

        case 'buy':
            const modal = new ModalBuilder()
                .setCustomId('modal_buy')
                .setTitle('Buy Monthly Plan (300 THB)');

            const linkInput = new TextInputBuilder()
                .setCustomId('input_tw_link')
                .setLabel('TrueMoney Gift Link')
                .setPlaceholder('https://gift.truemoney.com/campaign/?v=xxxxxx')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const nameInput = new TextInputBuilder()
                .setCustomId('input_custom_name')
                .setLabel('Custom Key Name')
                .setPlaceholder('e.g., My Main PC')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(linkInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput)
            );
            await interaction.showModal(modal);
            return;
        case 'buy_cashcard':
            const ccModal = new ModalBuilder()
                .setCustomId('modal_buy_cashcard')
                .setTitle('Topup with TrueMoney Cash Card');

            const ccInput = new TextInputBuilder()
                .setCustomId('input_cashcard_14')
                .setLabel('TrueMoney Cash Card (14 digits)')
                .setPlaceholder('Enter your 14 digits here...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(14)
                .setMaxLength(14);

            const ccNameInput = new TextInputBuilder()
                .setCustomId('input_custom_name')
                .setLabel('Custom Key Name')
                .setPlaceholder('e.g., My Main PC')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            ccModal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(ccInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(ccNameInput)
            );
            await interaction.showModal(ccModal);
            return;

        case 'renew':
            const renewModal = new ModalBuilder()
                .setCustomId('modal_renew')
                .setTitle('Renew Key (ต่ออายุ 30 วัน)');

            const renewKeyInput = new TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setPlaceholder('กรอก Key ที่ต้องการต่ออายุ')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const renewLinkInput = new TextInputBuilder()
                .setCustomId('input_tw_link')
                .setLabel('TrueMoney Gift Link (300 THB)')
                .setPlaceholder('https://gift.truemoney.com/campaign/?v=xxxxxx')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            renewModal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(renewKeyInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(renewLinkInput)
            );
            await interaction.showModal(renewModal);
            return;

        case 'renew_cashcard':
            const renewCcModal = new ModalBuilder()
                .setCustomId('modal_renew_cashcard')
                .setTitle('Renew Key (TrueMoney Cash Card)');

            const renewCcKeyInput = new TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value (e.g. VIP-XXXX)')
                .setPlaceholder('กรอก Key ที่ต้องการต่ออายุ')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const renewCcInput = new TextInputBuilder()
                .setCustomId('input_cashcard_14')
                .setLabel('TrueMoney Cash Card (14 digits)')
                .setPlaceholder('Enter your 14 digits here...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(14)
                .setMaxLength(14);

            renewCcModal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(renewCcKeyInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(renewCcInput)
            );
            await interaction.showModal(renewCcModal);
            return;
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

                await panda.extendKey(keyToRenew, 30);

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
            } else {
                // New key flow (original)
                const keyNameMatch = msgContent.match(/Key Name: `(.*)`/);
                const customName = keyNameMatch ? keyNameMatch[1] : 'CashCard VIP';

                const generatedKey = await panda.generateKey({
                    count: 1,
                    prefix: "VIP",
                    expirationType: "byDays",
                    expirationDays: 30,
                    isPremium: true,
                    noHwidValidation: true,
                    discordId: userId,
                    note: `${customName} (Discord: ${userId})`
                });

                if (supabase) {
                    const { error: insertErr } = await supabase.from('keys').insert([{
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
        } catch (err: any) {
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
        } catch (err) {
            console.error(err);
            await interaction.editReply(`Error notifying user.`);
        }
        return;
    }

    if (customId === 'btn_info') {
        await interaction.reply({ content: 'Monthly Pricing Info: Gain access to exclusive premium features.', flags: MessageFlags.Ephemeral });
    }
    else if (customId === 'btn_buy') {
        const modal = new ModalBuilder()
            .setCustomId('modal_buy_key')
            .setTitle('Buy Monthly Plan');

        const discordIdInput = new TextInputBuilder()
            .setCustomId('discord_id')
            .setLabel('Discord ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const customNameInput = new TextInputBuilder()
            .setCustomId('custom_name')
            .setLabel('Custom Key Name')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const voucherInput = new TextInputBuilder()
            .setCustomId('voucher')
            .setLabel('TrueMoney Voucher')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(discordIdInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(customNameInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(voucherInput)
        );
        await interaction.showModal(modal);
    }
    else if (customId === 'btn_show_keys') {
        const modal = new ModalBuilder()
            .setCustomId('modal_show_keys')
            .setTitle('Show Keys');

        const discordIdInput = new TextInputBuilder()
            .setCustomId('discord_id')
            .setLabel('Discord ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(discordIdInput));
        await interaction.showModal(modal);
    }
    else if (customId === 'btn_show_hwid') {
        const modal = new ModalBuilder()
            .setCustomId('modal_show_hwid')
            .setTitle('Show HWID');

        const discordIdInput = new TextInputBuilder()
            .setCustomId('discord_id')
            .setLabel('Discord ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const actualKeyInput = new TextInputBuilder()
            .setCustomId('actual_key')
            .setLabel('Actual Key')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(discordIdInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(actualKeyInput)
        );
        await interaction.showModal(modal);
    }
    else if (customId === 'btn_add_hwid') {
        const modal = new ModalBuilder()
            .setCustomId('modal_add_hwid')
            .setTitle('Add HWID');

        const discordIdInput = new TextInputBuilder()
            .setCustomId('discord_id')
            .setLabel('Discord ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const actualKeyInput = new TextInputBuilder()
            .setCustomId('actual_key')
            .setLabel('Actual Key')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(discordIdInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(actualKeyInput)
        );
        await interaction.showModal(modal);
    }
    else if (customId === 'btn_remove_hwid') {
        const modal = new ModalBuilder()
            .setCustomId('modal_remove_hwid')
            .setTitle('Remove HWID');

        const discordIdInput = new TextInputBuilder()
            .setCustomId('discord_id')
            .setLabel('Discord ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const actualKeyInput = new TextInputBuilder()
            .setCustomId('actual_key')
            .setLabel('Actual Key')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const hwidInput = new TextInputBuilder()
            .setCustomId('hwid')
            .setLabel('HWID to Remove')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(discordIdInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(actualKeyInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(hwidInput)
        );
        await interaction.showModal(modal);
    }
}

async function handleModal(interaction: ModalSubmitInteraction) {
    const { customId } = interaction;

    // Placeholder responses for now
    if (customId === 'modal_buy_cashcard') {
        const cashcard = interaction.fields.getTextInputValue('input_cashcard_14');
        const customName = interaction.fields.getTextInputValue('input_custom_name');
        
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const adminId = process.env.ADMIN_ID;
        if (!adminId) {
            return interaction.editReply('Admin ID (ADMIN_ID) is not configured in the system. Please contact the administrator.');
        }

        try {
            const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
            if (adminUser) {
                const approveBtn = new ButtonBuilder()
                    .setCustomId(`approve_cc_${interaction.user.id}`)
                    .setLabel('Done (Generate Key)')
                    .setStyle(ButtonStyle.Success);
                
                const rejectBtn = new ButtonBuilder()
                    .setCustomId(`reject_cc_${interaction.user.id}`)
                    .setLabel('Reject')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approveBtn, rejectBtn);

                await adminUser.send({
                    content: `**New Cash Card Topup Request**\nUser: <@${interaction.user.id}> (${interaction.user.username})\nUser ID: \`${interaction.user.id}\`\nKey Name: \`${customName}\`\nCash Card 14 Digits: \`${cashcard}\`\n\nPlease check the cash card. If valid, click Done to generate a key for the user.`,
                    components: [row]
                });
                
                return interaction.editReply('Your cash card has been sent to the admin. Please wait for the admin to verify and send you the key.');
            } else {
                return interaction.editReply('Could not find the admin user. Please contact the administrator.');
            }
        } catch (err) {
            console.error('Error sending DM to admin:', err);
            return interaction.editReply('Failed to send request to admin.');
        }
    }
    else if (customId === 'modal_buy') {
        const link = interaction.fields.getTextInputValue('input_tw_link');
        const customName = interaction.fields.getTextInputValue('input_custom_name');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const twPhone = process.env.TW_PHONE || '0000000000';
            const expectedPrice = 300;

            if (!link.includes('gift.truemoney.com/campaign')) {
                return interaction.editReply('Invalid TrueMoney gift link!');
            }

            const hash = link.split('?v=')[1];
            if (!hash) return interaction.editReply('Invalid TrueMoney gift link hash!');

            // got-scraping bypasses Cloudflare TLS fingerprinting
            const { gotScraping } = await import('got-scraping');

            const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${hash}/verify?mobile=${twPhone}`;
            let verifyData: any;
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
            } catch (e: any) {
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
            let redeemData: any;
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
            } catch (e: any) {
                console.error("TrueMoney Redeem Error:", e.response?.body || e.message);
                return interaction.editReply(`Redeem failed (Network Error).`);
            }

            if (redeemData.status?.code !== 'SUCCESS') {
                return interaction.editReply(`Redeem failed: ${redeemData.status?.message || 'Unknown'}`);
            }

            // TRUE MONEY PAYMENT SUCCESS, GENERATE KEY
            const generatedKey = await panda.generateKey({
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
            if (supabase) {
                const { error: dbError } = await supabase
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
            } else {
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

        } catch (err) {
            console.error(err);
            return interaction.editReply('System error processing payment.');
        }
    }
    else if (customId === 'modal_buy_key') {
        const discordId = interaction.fields.getTextInputValue('discord_id');
        const customName = interaction.fields.getTextInputValue('custom_name');
        const voucher = interaction.fields.getTextInputValue('voucher');
        await interaction.reply({ content: `Received Buy Key request for ${discordId} - ${customName}. Voucher: ${voucher}`, flags: MessageFlags.Ephemeral });
    }
    else if (customId === 'modal_show_keys') {
        const discordId = interaction.fields.getTextInputValue('discord_id');
        await interaction.reply({ content: `Received Show Keys request for ${discordId}`, flags: MessageFlags.Ephemeral });
    }

    else if (customId === 'modal_add_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const customName = interaction.fields.getTextInputValue('input_hwid_name');
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!supabase) {
            return interaction.editReply('Database not initialized.');
        }

        try {
            // 1. Fetch the key to ensure it belongs to the user
            const { data, error: fetchError } = await supabase
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
            const { error: updateError } = await supabase
                .from('keys')
                .update({ hwids: currentHwids })
                .eq('id', keyRecord.id);

            if (updateError) {
                console.error("Supabase Update Error:", updateError);
                return interaction.editReply('Failed to save HWID to database.');
            }

            // Sync unbind with Pandauth so it doesn't reject new HWIDs
            try {
                await panda.resetHwid(keyValue);
            } catch (e) {
                // Ignore pandauth reset errors
            }

            return interaction.editReply(`Successfully bound HWID **${customName}** to key \`${keyValue}\`.`);

        } catch (err) {
            console.error(err);
            return interaction.editReply('System error processing HWID addition.');
        }
    }
    else if (customId === 'modal_show_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!supabase) {
            return interaction.editReply('Database not initialized.');
        }

        try {
            const { data, error: fetchError } = await supabase
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
            hwidsList.forEach((hwid: any, i: number) => {
                hwidText += `${i + 1}. \`${hwid.hwid_value}\` (${hwid.custom_name})\n`;
            });

            return interaction.editReply(hwidText);
        } catch (e) {
            console.error("Parse Note Error:", e);
            return interaction.editReply('Failed to fetch HWID data.');
        }
    }
    else if (customId === 'modal_remove_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!supabase) {
            return interaction.editReply('Database not initialized.');
        }

        try {
            // 1. Fetch the key to ensure it belongs to the user
            const { data, error: fetchError } = await supabase
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
            const newHwids = currentHwids.filter((h: any) => h.hwid_value !== hwidValue);

            if (newHwids.length === currentHwids.length) {
                return interaction.editReply('That HWID was not found on this key.');
            }

            // 3. Update Supabase
            const { error: updateError } = await supabase
                .from('keys')
                .update({ hwids: newHwids })
                .eq('id', keyRecord.id);

            if (updateError) {
                console.error("Supabase Update Error:", updateError);
                return interaction.editReply('Failed to remove HWID from database.');
            }

            return interaction.editReply(`Successfully removed HWID **${hwidValue}** from key \`${keyValue}\`.`);

        } catch (err) {
            console.error(err);
            return interaction.editReply('System error processing HWID removal.');
        }
    }

    else if (customId === 'modal_reset_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // 1. Verify key ownership if Supabase is connected
            if (supabase) {
                const { data, error: fetchError } = await supabase
                    .from('keys')
                    .select('*')
                    .eq('key_value', keyValue)
                    .eq('discord_id', interaction.user.id);

                if (fetchError || !data || data.length === 0) {
                    return interaction.editReply('Invalid key or you do not own this key.');
                }

                // Clear bound HWIDs array in Supabase
                await supabase
                    .from('keys')
                    .update({ hwids: [] })
                    .eq('id', data[0].id);
            }

            // 2. Reset HWID in Pandauth
            await panda.resetHwid(keyValue);

            return interaction.editReply(`✅ **HWID Reset Successful!**\nKey: \`${keyValue}\`\n\nYour key is now ready to use on your new device/PC without Error 300.`);
        } catch (err: any) {
            console.error("Reset HWID Error:", err);
            return interaction.editReply(`Error resetting HWID: ${err.message || String(err)}`);
        }
    }

    // ===== RENEW KEY (TrueMoney Gift Link) =====
    else if (customId === 'modal_renew') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const link = interaction.fields.getTextInputValue('input_tw_link');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // Verify key belongs to user in Supabase
            if (supabase) {
                const { data, error: fetchError } = await supabase
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
            if (!hash) return interaction.editReply('Invalid TrueMoney gift link hash!');

            const { gotScraping } = await import('got-scraping');

            // Verify voucher
            const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${hash}/verify?mobile=${twPhone}`;
            let verifyData: any;
            try {
                const verifyRes = await gotScraping.get({
                    url: verifyUrl,
                    headerGeneratorOptions: { browsers: ['firefox'], operatingSystems: ['windows'], locales: ['en-US'] },
                    headers: { 'Referer': link },
                    responseType: 'json'
                });
                verifyData = verifyRes.body;
            } catch (e: any) {
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
            let redeemData: any;
            try {
                const redeemRes = await gotScraping.post({
                    url: redeemUrl,
                    headerGeneratorOptions: { browsers: ['firefox'], operatingSystems: ['windows'], locales: ['en-US'] },
                    headers: { 'Referer': link, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobile: twPhone, voucher_hash: hash }),
                    responseType: 'json'
                });
                redeemData = redeemRes.body;
            } catch (e: any) {
                return interaction.editReply(`Redeem failed (Network Error).`);
            }

            if (redeemData.status?.code !== 'SUCCESS') {
                return interaction.editReply(`Redeem failed: ${redeemData.status?.message || 'Unknown'}`);
            }

            // PAYMENT SUCCESS — Extend key via Pandauth
            await panda.extendKey(keyValue, 30); // +30 days

            const adminId = process.env.ADMIN_ID;
            if (adminId) {
                const adminUser = await interaction.client.users.fetch(adminId).catch(() => null);
                if (adminUser) {
                    await adminUser.send(`**[LOG] Key Renewed (TrueMoney Link)**\nUser: <@${interaction.user.id}> (${interaction.user.username})\nKey: \`${keyValue}\`\nAmount: \`${expectedPrice} THB\`\n+30 Days`).catch(() => null);
                }
            }

            return interaction.editReply(`ต่ออายุ Key สำเร็จ!\n\n**Key:** \`${keyValue}\`\nเพิ่ม 30 วัน เรียบร้อยแล้ว`);

        } catch (err) {
            console.error(err);
            return interaction.editReply('System error processing renewal.');
        }
    }

    // ===== RENEW KEY (TrueMoney Cash Card) =====
    else if (customId === 'modal_renew_cashcard') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const cashcard = interaction.fields.getTextInputValue('input_cashcard_14');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Verify key belongs to user in Supabase
        if (supabase) {
            const { data, error: fetchError } = await supabase
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
                const approveBtn = new ButtonBuilder()
                    .setCustomId(`approve_renew_cc_${interaction.user.id}`)
                    .setLabel('Approve Renewal')
                    .setStyle(ButtonStyle.Success);

                const rejectBtn = new ButtonBuilder()
                    .setCustomId(`reject_cc_${interaction.user.id}`)
                    .setLabel('Reject')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approveBtn, rejectBtn);

                await adminUser.send({
                    content: `**[KEY RENEWAL REQUEST] Cash Card**\nUser: <@${interaction.user.id}> (${interaction.user.username})\nUser ID: \`${interaction.user.id}\`\nKey: \`${keyValue}\`\nCash Card 14 Digits: \`${cashcard}\`\n\nPlease verify the cash card and click Approve to extend the key by 30 days.`,
                    components: [row]
                });

                return interaction.editReply('ส่งคำขอต่ออายุไปยัง Admin แล้ว กรุณารอ Admin ตรวจสอบและอนุมัติ');
            } else {
                return interaction.editReply('Could not find the admin user. Please contact the administrator.');
            }
        } catch (err) {
            console.error('Error sending renew DM to admin:', err);
            return interaction.editReply('Failed to send renewal request to admin.');
        }
    }

}
