import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, PermissionFlagsBits, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } from 'discord.js';
import { supabase } from '../supabase';

const CUSTOMERS_PER_PAGE = 5;

function buildStatsEmbed(page: number, totalPages: number, totalKeys: number, uniqueUsers: number, chunks: string[][]): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setTitle('📊 Key Statistics / สถิติการขาย')
        .setColor('#00ff00')
        .addFields(
            { name: '👥 Total People / จำนวนคนซื้อ', value: `${uniqueUsers} คน`, inline: true },
            { name: '🔑 Total Keys / จำนวน Key', value: `${totalKeys} คีย์`, inline: true },
        )
        .setTimestamp();

    if (chunks.length === 0) {
        embed.addFields({ name: '📋 Customer List', value: 'ยังไม่มีลูกค้า' });
    } else {
        embed.addFields({
            name: `📋 รายชื่อลูกค้า (หน้า ${page + 1}/${totalPages})`,
            value: chunks[page].join('')
        });
    }

    embed.setFooter({ text: `หน้า ${page + 1} / ${totalPages}` });

    return embed;
}

function buildButtons(page: number, totalPages: number): ActionRowBuilder<ButtonBuilder> {
    const prevBtn = new ButtonBuilder()
        .setCustomId('stats_prev')
        .setLabel('◀')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0);

    const pageBtn = new ButtonBuilder()
        .setCustomId('stats_page')
        .setLabel(`${page + 1} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

    const nextBtn = new ButtonBuilder()
        .setCustomId('stats_next')
        .setLabel('▶')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page >= totalPages - 1);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(prevBtn, pageBtn, nextBtn);
}

export const statsCommand = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 View key statistics (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: CommandInteraction) {
        const adminId = process.env.ADMIN_ID;
        if (!adminId || interaction.user.id !== adminId) {
            await interaction.reply({ content: '❌ You are not authorized.', flags: MessageFlags.Ephemeral });
            return;
        }

        if (!supabase) {
            await interaction.reply({ content: 'Database is not initialized.', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const { data: keysData, error } = await supabase
                .from('keys')
                .select('*');

            if (error) {
                console.error('[Stats] Supabase error:', JSON.stringify(error));
                await interaction.editReply('Failed to fetch data from database.');
                return;
            }

            const keys = keysData || [];
            const totalKeys = keys.length;
            const uniqueUsers = new Set(keys.map((k: any) => k.discord_id)).size;

            // Group keys by user with purchase details
            const userGroups: { [key: string]: { count: number; keys: any[] } } = {};
            for (const k of keys) {
                if (!userGroups[k.discord_id]) {
                    userGroups[k.discord_id] = { count: 0, keys: [] };
                }
                userGroups[k.discord_id].count++;
                userGroups[k.discord_id].keys.push(k);
            }

            // Build per-user text entries
            const userEntries = Object.entries(userGroups).map(([discordId, info]) => {
                let text = `👤 <@${discordId}> — **${info.count}** key(s)\n`;
                for (const key of info.keys) {
                    const date = key.created_at
                        ? `<t:${Math.floor(new Date(key.created_at).getTime() / 1000)}:f>`
                        : 'ไม่ทราบ';
                    text += `  └ \`${key.key_value}\` (${key.custom_name || '-'}) — ${date}\n`;
                }
                return text;
            });

            // Split into chunks of 5 customers
            const chunks: string[][] = [];
            for (let i = 0; i < userEntries.length; i += CUSTOMERS_PER_PAGE) {
                chunks.push(userEntries.slice(i, i + CUSTOMERS_PER_PAGE));
            }

            const totalPages = Math.max(chunks.length, 1);
            let currentPage = 0;

            const embed = buildStatsEmbed(currentPage, totalPages, totalKeys, uniqueUsers, chunks);
            const buttons = buildButtons(currentPage, totalPages);

            const reply = await interaction.editReply({
                embeds: [embed],
                components: totalPages > 1 ? [buttons] : []
            });

            if (totalPages <= 1) return;

            // Listen for button clicks (2 minutes timeout)
            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 120_000
            });

            collector.on('collect', async (btnInteraction) => {
                if (btnInteraction.user.id !== adminId) {
                    await btnInteraction.reply({ content: '❌ Not authorized.', flags: MessageFlags.Ephemeral });
                    return;
                }

                if (btnInteraction.customId === 'stats_prev' && currentPage > 0) {
                    currentPage--;
                } else if (btnInteraction.customId === 'stats_next' && currentPage < totalPages - 1) {
                    currentPage++;
                }

                const newEmbed = buildStatsEmbed(currentPage, totalPages, totalKeys, uniqueUsers, chunks);
                const newButtons = buildButtons(currentPage, totalPages);

                await btnInteraction.update({
                    embeds: [newEmbed],
                    components: [newButtons]
                });
            });

            collector.on('end', async () => {
                // Disable buttons after timeout
                const disabledButtons = buildButtons(currentPage, totalPages);
                disabledButtons.components.forEach(btn => btn.setDisabled(true));
                await interaction.editReply({ components: [disabledButtons] }).catch(() => {});
            });

        } catch (e) {
            console.error('[Stats] Unexpected error:', e);
            await interaction.editReply('An error occurred.');
        }
    }
};
