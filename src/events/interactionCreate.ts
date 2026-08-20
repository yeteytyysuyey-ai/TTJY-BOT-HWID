import { Interaction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction, ButtonInteraction, MessageFlags } from 'discord.js';
import { panelCommand } from '../commands/panel';
import axios from 'axios';
import { panda } from '../panda';
import { supabase } from '../supabase';

export async function handleInteraction(interaction: Interaction) {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'panel') {
            await panelCommand.execute(interaction as any);
        }
    } else if (interaction.isButton()) {
        await handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
        await handleModal(interaction);
    }
}

async function handleButton(interaction: ButtonInteraction) {
    const { customId } = interaction;

    // Fallback for V1 buttons (if any are still active)
    if (customId === 'btn_info') {
        await interaction.reply({ content: 'Monthly Pricing Info: Gain access to exclusive premium features.', ephemeral: true });
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
    if (customId === 'modal_buy') {
        const link = interaction.fields.getTextInputValue('input_tw_link');
        const customName = interaction.fields.getTextInputValue('input_custom_name');

        await interaction.deferReply({ ephemeral: true });

        try {
            const twPhone = process.env.TW_PHONE || '0000000000';
            const expectedPrice = 10;

            if (!link.includes('gift.truemoney.com/campaign')) {
                return interaction.editReply('❌ Invalid TrueMoney gift link!');
            }

            const hash = link.split('?v=')[1];
            if (!hash) return interaction.editReply('❌ Invalid TrueMoney gift link hash!');

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
                return interaction.editReply(`❌ Voucher verification failed: \n\`\`\`${errBody}\`\`\``);
            }

            if (verifyData.status?.code !== 'SUCCESS') {
                let errMsg = verifyData.status?.message || verifyData.message || JSON.stringify(verifyData);
                return interaction.editReply(`❌ Voucher error: ${errMsg}`);
            }

            const voucherAmount = parseInt(verifyData.data.voucher.amount_baht);
            if (voucherAmount !== expectedPrice) {
                return interaction.editReply(`❌ Invalid amount! Expected ${expectedPrice} THB, got ${voucherAmount} THB.`);
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
                return interaction.editReply(`❌ Redeem failed (Network Error).`);
            }

            if (redeemData.status?.code !== 'SUCCESS') {
                return interaction.editReply(`❌ Redeem failed: ${redeemData.status?.message || 'Unknown'}`);
            }

            // TRUE MONEY PAYMENT SUCCESS, GENERATE KEY
            const generatedKey = await panda.generateKey({
                count: 1,
                prefix: "VIP",
                expirationType: "byDays",
                expirationDays: 30,
                isPremium: true
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
                    return interaction.editReply(`✅ Payment successful, but failed to save to database. Your key is: \`${generatedKey}\``);
                }
            } else {
                console.warn("Supabase not initialized, skipping DB insert.");
            }

            return interaction.editReply(`✅ Payment successful! Your VIP key has been generated and saved to your account.\n\n🔑 **Key:** \`${generatedKey}\``);

        } catch (err) {
            console.error(err);
            return interaction.editReply('❌ System error processing payment.');
        }
    }
    else if (customId === 'modal_buy_key') {
        const discordId = interaction.fields.getTextInputValue('discord_id');
        const customName = interaction.fields.getTextInputValue('custom_name');
        const voucher = interaction.fields.getTextInputValue('voucher');
        await interaction.reply({ content: `Received Buy Key request for ${discordId} - ${customName}. Voucher: ${voucher}`, ephemeral: true });
    }
    else if (customId === 'modal_show_keys') {
        const discordId = interaction.fields.getTextInputValue('discord_id');
        await interaction.reply({ content: `Received Show Keys request for ${discordId}`, ephemeral: true });
    }

    else if (customId === 'modal_add_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const customName = interaction.fields.getTextInputValue('input_hwid_name');
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value');

        await interaction.deferReply({ ephemeral: true });

        if (!supabase) {
            return interaction.editReply('❌ Database not initialized.');
        }

        try {
            // 1. Fetch the key to ensure it belongs to the user
            const { data, error: fetchError } = await supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);

            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('❌ Invalid key or you do not own this key.');
            }

            const keyRecord = data[0];
            const currentHwids = keyRecord.hwids || [];

            // 2. Check Max HWIDs limit (3)
            if (currentHwids.length >= 3) {
                return interaction.editReply('❌ Maximum HWID limit (3) reached for this key.');
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
                return interaction.editReply('❌ Failed to save HWID to database.');
            }

            return interaction.editReply(`✅ Successfully bound HWID **${customName}** to key \`${keyValue}\`.`);

        } catch (err) {
            console.error(err);
            return interaction.editReply('❌ System error processing HWID addition.');
        }
    }
    else if (customId === 'modal_show_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        await interaction.deferReply({ ephemeral: true });

        if (!supabase) {
            return interaction.editReply('❌ Database not initialized.');
        }

        try {
            const { data, error: fetchError } = await supabase
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
                return interaction.editReply(`🔑 **Key:** \`${keyValue}\`\n\nNo HWIDs are currently bound to this key.`);
            }

            let hwidText = `🔑 **Key:** \`${keyValue}\`\n\n**Bound HWIDs (Supabase):**\n`;
            hwidsList.forEach((hwid: any, i: number) => {
                hwidText += `${i + 1}. \`${hwid.hwid_value}\` (${hwid.custom_name})\n`;
            });

            return interaction.editReply(hwidText);
        } catch (e) {
            console.error("Parse Note Error:", e);
            return interaction.editReply('❌ Failed to fetch HWID data.');
        }
    }
    else if (customId === 'modal_remove_hwid') {
        const keyValue = interaction.fields.getTextInputValue('input_key_value');
        const hwidValue = interaction.fields.getTextInputValue('input_hwid_value');

        await interaction.deferReply({ ephemeral: true });

        if (!supabase) {
            return interaction.editReply('❌ Database not initialized.');
        }

        try {
            // 1. Fetch the key to ensure it belongs to the user
            const { data, error: fetchError } = await supabase
                .from('keys')
                .select('*')
                .eq('key_value', keyValue)
                .eq('discord_id', interaction.user.id);

            if (fetchError || !data || data.length === 0) {
                return interaction.editReply('❌ Invalid key or you do not own this key.');
            }

            const keyRecord = data[0];
            const currentHwids = keyRecord.hwids || [];

            // 2. Filter out the HWID
            const newHwids = currentHwids.filter((h: any) => h.hwid_value !== hwidValue);

            if (newHwids.length === currentHwids.length) {
                return interaction.editReply('❌ That HWID was not found on this key.');
            }

            // 3. Update Supabase
            const { error: updateError } = await supabase
                .from('keys')
                .update({ hwids: newHwids })
                .eq('id', keyRecord.id);

            if (updateError) {
                console.error("Supabase Update Error:", updateError);
                return interaction.editReply('❌ Failed to remove HWID from database.');
            }

            return interaction.editReply(`✅ Successfully removed HWID \`${hwidValue}\` from key \`${keyValue}\`.`);

        } catch (err) {
            console.error(err);
            return interaction.editReply('❌ System error processing HWID removal.');
        }
    }
}
