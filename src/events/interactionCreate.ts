import { Interaction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction, ButtonInteraction, MessageFlags, ButtonBuilder, ButtonStyle } from 'discord.js';
import { panelCommand } from '../commands/panel';
import { statsCommand } from '../commands/stats';
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

                // Fetch keys from Supabase (single source of truth)
                if (supabase) {
                    const { data, error } = await supabase.from('keys').select('*').eq('discord_id', interaction.user.id);
                    if (!error && data) {
                        userKeys = data;
                    }
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

            const hwidValueInput = new TextInputBuilder()
                .setCustomId('input_hwid_value')
                .setLabel('HWID String')
                .setPlaceholder('Paste your HWID here')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            addModal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(keyInput),
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
                .setTitle('Show Key HWID');
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

        // ===== ADMIN DM PANEL BUTTONS =====
        case 'admin_btn_gen':
            const adminGenModal = new ModalBuilder()
                .setCustomId('modal_admin_gen')
                .setTitle('Create VIP Key for User');

            const gUserInput = new TextInputBuilder()
                .setCustomId('input_target_user')
                .setLabel('Target Discord User ID or Mention')
                .setPlaceholder('e.g. 123456789012345678')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const gDaysInput = new TextInputBuilder()
                .setCustomId('input_days')
                .setLabel('Key Validity Days')
                .setPlaceholder('30')
                .setValue('30')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const gNameInput = new TextInputBuilder()
                .setCustomId('input_key_name')
                .setLabel('Key Custom Name')
                .setPlaceholder('e.g. VIP-Customer')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            adminGenModal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(gUserInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(gDaysInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(gNameInput)
            );
            await interaction.showModal(adminGenModal);
            return;

        case 'admin_btn_find':
            const adminFindModal = new ModalBuilder()
                .setCustomId('modal_admin_find')
                .setTitle('Find Keys by User ID or Key');

            const fQueryInput = new TextInputBuilder()
                .setCustomId('input_query')
                .setLabel('Discord User ID or Key Value')
                .setPlaceholder('e.g. 123456789012345678 or VIP-XXXX')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            adminFindModal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(fQueryInput));
            await interaction.showModal(adminFindModal);
            return;

        case 'admin_btn_reset':
            const adminResetModal = new ModalBuilder()
                .setCustomId('modal_admin_reset')
                .setTitle('Reset HWID for Any Key');

            const rstKeyInput = new TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value to Reset')
                .setPlaceholder('VIP-XXXX-XXXX-XXXX')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            adminResetModal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(rstKeyInput));
            await interaction.showModal(adminResetModal);
            return;

        case 'admin_btn_extend':
            const adminExtModal = new ModalBuilder()
                .setCustomId('modal_admin_extend')
                .setTitle('Extend Key Expiration');

            const extKeyInput = new TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value to Extend')
                .setPlaceholder('VIP-XXXX-XXXX-XXXX')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const extDaysInput = new TextInputBuilder()
                .setCustomId('input_days')
                .setLabel('Days to Add')
                .setPlaceholder('30')
                .setValue('30')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            adminExtModal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(extKeyInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(extDaysInput)
            );
            await interaction.showModal(adminExtModal);
            return;

        case 'admin_btn_delete':
            const adminDelModal = new ModalBuilder()
                .setCustomId('modal_admin_delete')
                .setTitle('Delete Key from System');

            const delKeyInput = new TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value to Delete')
                .setPlaceholder('VIP-XXXX-XXXX-XXXX')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            adminDelModal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(delKeyInput));
            await interaction.showModal(adminDelModal);
            return;

        case 'admin_btn_addhwid':
            const adminAddHwidModal = new ModalBuilder()
                .setCustomId('modal_admin_add_hwid')
                .setTitle('Bind HWID to Key');

            const ahKeyInput = new TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value')
                .setPlaceholder('VIP-XXXX-XXXX-XXXX')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const ahHwidInput = new TextInputBuilder()
                .setCustomId('input_hwid_value')
                .setLabel('HWID String')
                .setPlaceholder('Paste HWID here')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            adminAddHwidModal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(ahKeyInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(ahHwidInput)
            );
            await interaction.showModal(adminAddHwidModal);
            return;

        case 'admin_btn_delhwid':
            const adminDelHwidModal = new ModalBuilder()
                .setCustomId('modal_admin_del_hwid')
                .setTitle('Remove HWID from Key');

            const dhKeyInput = new TextInputBuilder()
                .setCustomId('input_key_value')
                .setLabel('Key Value')
                .setPlaceholder('VIP-XXXX-XXXX-XXXX')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const dhHwidInput = new TextInputBuilder()
                .setCustomId('input_hwid_value')
                .setLabel('HWID String to Remove')
                .setPlaceholder('Paste HWID here')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            adminDelHwidModal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(dhKeyInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dhHwidInput)
            );
            await interaction.showModal(adminDelHwidModal);
            return;

        case 'admin_btn_stats':
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            try {
                if (!supabase) {
                    return interaction.editReply('Database not initialized.');
                }
                const { data: keysData, error: sErr } = await supabase.from('keys').select('key_value, hwids');
                if (sErr || !keysData) return interaction.editReply('Failed to fetch statistics.');
                const totalKeys = keysData.length;
                const boundHwids = keysData.filter((k: any) => k.hwids && k.hwids.length > 0).length;
                return interaction.editReply(`📊 **Key Statistics:**\n• Total Active Keys: **${totalKeys}** keys\n• HWID Bound: **${boundHwids}** keys`);
            } catch (err: any) {
                return interaction.editReply(`Error: ${err.message}`);
            }
    }

    // Fallback for V1 buttons (if any are still active)
    if (customId.startsWith('approve_cc_') || customId.startsWith('approve_renew_cc_')) {
        const parts = customId.split('_');
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
                // New key flow
                const keyNameMatch = msgContent.match(/Key Name: `(.*)`/);
                const customName = keyNameMatch ? keyNameMatch[1] : 'CashCard VIP';

                const generatedKey = await panda.generateKey({
                    count: 1,
                    prefix: "VIP",
                    expirationType: "byDays",
                    expirationDays: 30,
                    isPremium: true,
                    discordId: userId,
                    note: `${customName} (Discord: ${userId})`
                });

                if (supabase) {
                    const { error: insertErr } = await supabase.from('keys').insert([{
                        discord_id: userId,
                        custom_name: customName,
                        key_value: generatedKey,
                        hwids: []
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
}

async function handleModal(interaction: ModalSubmitInteraction) {
    const { customId } = interaction;

    // ===== BUY (Cash Card — manual admin approval) =====
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

    // ===== BUY (TrueMoney Gift Link — auto redeem) =====
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
                        'Referer': 'https://gift.truemoney.com/campaign/',
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
                        'Referer': 'https://gift.truemoney.com/campaign/',
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

            // PAYMENT SUCCESS — generate key via Panda (HWID validation disabled)
            const generatedKey = await panda.generateKey({
                count: 1,
                prefix: "VIP",
                expirationType: "byDays",
                expirationDays: 30,
                isPremium: true,
                discordId: interaction.user.id,
                note: `${customName} (Discord: ${interaction.user.id})`
            });

            // Write key to DB — HWID starts as null (unbound)
            if (supabase) {
                const { error: dbError } = await supabase
                    .from('keys')
                    .insert([{
                        discord_id: interaction.user.id,
                        custom_name: customName,
                        key_value: generatedKey,
                        hwids: []
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

    // ===== ADD HWID — DB only, 1 HWID per key =====
    else if (customId === 'modal_add_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!supabase) {
            return interaction.editReply('Database not initialized.');
        }

        try {
            // 1. Fetch the key — must belong to the requesting user
            const { data, error: fetchError } = await supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);

            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }

            const keyRecord = data[0];

            // 2. Enforce 1 HWID per key policy
            if ((keyRecord.hwids && keyRecord.hwids.length > 0 ? (keyRecord.hwids[0].hwid_value || keyRecord.hwids[0]) : null)) {
                return interaction.editReply(`❌ **This key already has an HWID bound.**\nCurrent HWID: \`${(keyRecord.hwids && keyRecord.hwids.length > 0 ? (keyRecord.hwids[0].hwid_value || keyRecord.hwids[0]) : null)}\`\n\nUse **Reset HWID** first if you want to rebind.`);
            }

            // 3. Write HWID to DB (single value — no array)
            const { error: updateError } = await supabase
                .from('keys')
                .update({ hwids: [{ custom_name: 'Device', hwid_value: hwidValue }] })
                .eq('id', keyRecord.id);

            if (updateError) {
                console.error("Supabase Update Error:", updateError);
                return interaction.editReply('Failed to save HWID to database.');
            }

            return interaction.editReply(`✅ **HWID bound successfully!**\nKey: \`${keyValue}\`\nHWID: \`${hwidValue}\`\n\nYour key is now locked to this device.`);

        } catch (err) {
            console.error(err);
            return interaction.editReply('System error processing HWID addition.');
        }
    }

    // ===== SHOW HWID — from DB =====
    else if (customId === 'modal_show_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!supabase) {
            return interaction.editReply('Database not initialized.');
        }

        try {
            const pandaKeyRes = await panda.getKey(keyValue);
            if (!pandaKeyRes || !pandaKeyRes.data || (pandaKeyRes.data.discordId !== interaction.user.id && pandaKeyRes.data.discord_id !== interaction.user.id)) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }
            const { data, error: fetchError } = await supabase.from('keys').select('*').eq('key_value', keyValue);

            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }

            const keyRecord = data[0];

            if (!(keyRecord.hwids && keyRecord.hwids.length > 0 ? (keyRecord.hwids[0].hwid_value || keyRecord.hwids[0]) : null)) {
                return interaction.editReply(`**Key:** \`${keyValue}\`\n\n⚠️ No HWID is currently bound to this key.\nUse **Add HWID** to bind your device.`);
            }

            return interaction.editReply(`**Key:** \`${keyValue}\`\n\n**Bound HWID:**\n\`${(keyRecord.hwids && keyRecord.hwids.length > 0 ? (keyRecord.hwids[0].hwid_value || keyRecord.hwids[0]) : null)}\``);
        } catch (e) {
            console.error("Show HWID Error:", e);
            return interaction.editReply('Failed to fetch HWID data.');
        }
    }

    // ===== REMOVE HWID — DB only =====
    else if (customId === 'modal_remove_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!supabase) {
            return interaction.editReply('Database not initialized.');
        }

        try {
            const pandaKeyRes = await panda.getKey(keyValue);
            if (!pandaKeyRes || !pandaKeyRes.data || (pandaKeyRes.data.discordId !== interaction.user.id && pandaKeyRes.data.discord_id !== interaction.user.id)) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }
            const { data, error: fetchError } = await supabase.from('keys').select('*').eq('key_value', keyValue);

            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }

            const keyRecord = data[0];

            if ((keyRecord.hwids && keyRecord.hwids.length > 0 ? (keyRecord.hwids[0].hwid_value || keyRecord.hwids[0]) : null) !== hwidValue) {
                return interaction.editReply('That HWID is not bound to this key.');
            }

            const { error: updateError } = await supabase
                .from('keys')
                .update({ hwids: [] })
                .eq('id', keyRecord.id);

            if (updateError) {
                console.error("Supabase Update Error:", updateError);
                return interaction.editReply('Failed to remove HWID from database.');
            }

            return interaction.editReply(`✅ **HWID removed successfully.**\nKey \`${keyValue}\` is now unbound.`);

        } catch (err) {
            console.error(err);
            return interaction.editReply('System error processing HWID removal.');
        }
    }

    // ===== RESET HWID — DB only, no Panda call =====
    else if (customId === 'modal_reset_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!supabase) {
            return interaction.editReply('Database not initialized.');
        }

        try {
            const pandaKeyRes = await panda.getKey(keyValue);
            if (!pandaKeyRes || !pandaKeyRes.data || (pandaKeyRes.data.discordId !== interaction.user.id && pandaKeyRes.data.discord_id !== interaction.user.id)) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }
            const { data, error: fetchError } = await supabase.from('keys').select('*').eq('key_value', keyValue);

            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }

            // Clear HWID in DB only — no Panda call needed
            await supabase
                .from('keys')
                .update({ hwids: [] })
                .eq('id', data[0].id);

            return interaction.editReply(`✅ **HWID Reset Successful!**\nKey: \`${keyValue}\`\n\nYour key is now unbound. Use **Add HWID** to bind your new device.`);
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
                const pandaKeyRes = await panda.getKey(keyValue);
            if (!pandaKeyRes || !pandaKeyRes.data || (pandaKeyRes.data.discordId !== interaction.user.id && pandaKeyRes.data.discord_id !== interaction.user.id)) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }
            const { data, error: fetchError } = await supabase.from('keys').select('*').eq('key_value', keyValue);

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

            const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${hash}/verify?mobile=${twPhone}`;
            let verifyData: any;
            try {
                const verifyRes = await gotScraping.get({
                    url: verifyUrl,
                    headerGeneratorOptions: { browsers: ['firefox'], operatingSystems: ['windows'], locales: ['en-US'] },
                    headers: { 'Referer': 'https://gift.truemoney.com/campaign/' },
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

            const redeemUrl = `https://gift.truemoney.com/campaign/vouchers/${hash}/redeem`;
            let redeemData: any;
            try {
                const redeemRes = await gotScraping.post({
                    url: redeemUrl,
                    headerGeneratorOptions: { browsers: ['firefox'], operatingSystems: ['windows'], locales: ['en-US'] },
                    headers: { 'Referer': 'https://gift.truemoney.com/campaign/', 'Content-Type': 'application/json' },
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

            // PAYMENT SUCCESS — extend key via Pandauth
            await panda.extendKey(keyValue, 30);

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

    // ===== RENEW KEY (TrueMoney Cash Card — manual admin approval) =====
    else if (customId === 'modal_renew_cashcard') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const cashcard = interaction.fields.getTextInputValue('input_cashcard_14');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (supabase) {
            const pandaKeyRes = await panda.getKey(keyValue);
            if (!pandaKeyRes || !pandaKeyRes.data || (pandaKeyRes.data.discordId !== interaction.user.id && pandaKeyRes.data.discord_id !== interaction.user.id)) {
                return interaction.editReply('Invalid key or you do not own this key.');
            }
            const { data, error: fetchError } = await supabase.from('keys').select('*').eq('key_value', keyValue);

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

    // ===== ADMIN: CREATE / GENERATE KEY FOR USER =====
    else if (customId === 'modal_admin_gen') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) return interaction.editReply('Unauthorized.');

        const rawUser = interaction.fields.getTextInputValue('input_target_user');
        const targetUserId = rawUser.replace(/[<@!>]/g, '').trim();
        const days = parseInt(interaction.fields.getTextInputValue('input_days')) || 30;
        const keyName = interaction.fields.getTextInputValue('input_key_name') || `VIP Key (${days} Days)`;

        try {
            const generatedKey = await panda.generateKey({
                count: 1,
                prefix: "VIP",
                expirationType: "byDays",
                expirationDays: days,
                isPremium: true,
                discordId: targetUserId,
                note: `${keyName} (Discord: ${targetUserId})`
            });

            if (supabase) {
                await supabase.from('keys').insert([{
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
            } catch (e) {
                dmNotice = '⚠️ Could not DM user (DM closed).';
            }

            return interaction.editReply(`✅ **Key Created Successfully!**\n\n• **User:** <@${targetUserId}> (\`${targetUserId}\`)\n• **Key:** \`${generatedKey}\`\n• **Name:** \`${keyName}\`\n• **Days:** ${days}\n• **Status:** ${dmNotice}`);
        } catch (err: any) {
            console.error("Admin Modal Gen Error:", err);
            return interaction.editReply(`❌ Error creating key: ${err.message || String(err)}`);
        }
    }

    // ===== ADMIN: FIND KEYS =====
    else if (customId === 'modal_admin_find') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) return interaction.editReply('Unauthorized.');

        const query = interaction.fields.getTextInputValue('input_query').trim();
        const cleanQuery = query.replace(/[<@!>]/g, '');

        try {
            let foundKeys: any[] = [];
            if (supabase) {
                const { data } = await supabase
                    .from('keys')
                    .select('*')
                    .or(`discord_id.eq.${cleanQuery},key_value.eq.${query}`);
                if (data) foundKeys = data;
            }

            if (foundKeys.length === 0) {
                return interaction.editReply(`❌ No keys found matching \`${query}\`.`);
            }

            let resultText = `🔍 **Search Results for:** \`${query}\` (${foundKeys.length} keys found)\n\n`;
            for (const [i, k] of foundKeys.entries()) {
                const hwidDisplay = k.hwid ? `\`${k.hwid}\`` : '(None bound)';
                resultText += `**${i+1}. ${k.custom_name}** (<@${k.discord_id}>)\nKey: \`${k.key_value}\`\nHWID: ${hwidDisplay}\n\n`;
            }

            return interaction.editReply(resultText);
        } catch (err: any) {
            return interaction.editReply(`❌ Search Error: ${err.message}`);
        }
    }

    // ===== ADMIN: RESET HWID (DB only) =====
    else if (customId === 'modal_admin_reset') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) return interaction.editReply('Unauthorized.');

        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();

        try {
            if (!supabase) return interaction.editReply('Database not initialized.');

            // Reset HWID in DB only — no Panda call
            const { error } = await supabase.from('keys').update({ hwids: [] }).eq('key_value', keyValue);
            if (error) throw new Error(error.message);

            return interaction.editReply(`✅ **HWID Reset Successful!**\nKey: \`${keyValue}\`\nHWID cleared in database. User can now rebind on a new device.`);
        } catch (err: any) {
            return interaction.editReply(`❌ Reset Error: ${err.message}`);
        }
    }

    // ===== ADMIN: EXTEND KEY =====
    else if (customId === 'modal_admin_extend') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) return interaction.editReply('Unauthorized.');

        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const days = parseInt(interaction.fields.getTextInputValue('input_days')) || 30;

        try {
            await panda.extendKey(keyValue, days);
            return interaction.editReply(`✅ **Key Extended Successfully!**\nKey: \`${keyValue}\`\nAdded: **+${days} days**.`);
        } catch (err: any) {
            return interaction.editReply(`❌ Extend Error: ${err.message}`);
        }
    }

    // ===== ADMIN: DELETE KEY =====
    else if (customId === 'modal_admin_delete') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) return interaction.editReply('Unauthorized.');

        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();

        try {
            if (supabase) {
                await supabase.from('keys').delete().eq('key_value', keyValue);
            }
            try {
                await panda.deleteKey(keyValue);
            } catch (p) {}
            return interaction.editReply(`🗑️ **Key Deleted Successfully!**\nKey: \`${keyValue}\` removed from system.`);
        } catch (err: any) {
            return interaction.editReply(`❌ Delete Error: ${err.message}`);
        }
    }

    // ===== ADMIN: BIND HWID TO KEY (DB only, 1 per key) =====
    else if (customId === 'modal_admin_add_hwid') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) return interaction.editReply('Unauthorized.');

        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value').trim();

        try {
            if (!supabase) return interaction.editReply('Database not initialized.');

            const { data } = await supabase.from('keys').select('*').eq('key_value', keyValue);
            if (!data || data.length === 0) return interaction.editReply(`❌ Key \`${keyValue}\` not found in database.`);

            const keyRecord = data[0];

            // Overwrite HWID (admin can force-bind)
            const { error } = await supabase.from('keys').update({ hwids: [{ custom_name: 'Device', hwid_value: hwidValue }] }).eq('id', keyRecord.id);
            if (error) throw new Error(error.message);

            return interaction.editReply(`✅ **HWID Bound!**\nKey: \`${keyValue}\`\nHWID: \`${hwidValue}\``);
        } catch (err: any) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }

    // ===== ADMIN: REMOVE HWID (DB only) =====
    else if (customId === 'modal_admin_del_hwid') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) return interaction.editReply('Unauthorized.');

        const keyValue = interaction.fields.getTextInputValue('input_key_value').trim();
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value').trim();

        try {
            if (!supabase) return interaction.editReply('Database not initialized.');

            const { data } = await supabase.from('keys').select('*').eq('key_value', keyValue);
            if (!data || data.length === 0) return interaction.editReply(`❌ Key \`${keyValue}\` not found in database.`);

            const keyRecord = data[0];

            if ((keyRecord.hwids && keyRecord.hwids.length > 0 ? (keyRecord.hwids[0].hwid_value || keyRecord.hwids[0]) : null) !== hwidValue) {
                return interaction.editReply(`❌ HWID \`${hwidValue}\` is not bound to this key.`);
            }

            const { error } = await supabase.from('keys').update({ hwids: [] }).eq('id', keyRecord.id);
            if (error) throw new Error(error.message);

            return interaction.editReply(`✅ **Removed HWID!**\nKey: \`${keyValue}\`\nHWID: \`${hwidValue}\` cleared.`);
        } catch (err: any) {
            return interaction.editReply(`❌ Error: ${err.message}`);
        }
    }

}
