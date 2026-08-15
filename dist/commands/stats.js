"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsCommand = void 0;
const discord_js_1 = require("discord.js");
const supabase_1 = require("../supabase");
const CUSTOMERS_PER_PAGE = 5;
function buildStatsEmbed(page, totalPages, totalKeys, uniqueUsers, chunks) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('📊 Key Statistics / สถิติการขาย')
        .setColor('#00ff00')
        .addFields({ name: '👥 Total People / จำนวนคนซื้อ', value: `${uniqueUsers} คน`, inline: true }, { name: '🔑 Total Keys / จำนวน Key', value: `${totalKeys} คีย์`, inline: true })
        .setTimestamp();
    if (chunks.length === 0) {
        embed.addFields({ name: '📋 Customer List', value: 'ยังไม่มีลูกค้า' });
    }
    else {
        embed.addFields({
            name: `📋 รายชื่อลูกค้า (หน้า ${page + 1}/${totalPages})`,
            value: chunks[page].join('')
        });
    }
    embed.setFooter({ text: `หน้า ${page + 1} / ${totalPages}` });
    return embed;
}
function buildButtons(page, totalPages) {
    const prevBtn = new discord_js_1.ButtonBuilder()
        .setCustomId('stats_prev')
        .setLabel('◀')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(page === 0);
    const pageBtn = new discord_js_1.ButtonBuilder()
        .setCustomId('stats_page')
        .setLabel(`${page + 1} / ${totalPages}`)
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(true);
    const nextBtn = new discord_js_1.ButtonBuilder()
        .setCustomId('stats_next')
        .setLabel('▶')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(page >= totalPages - 1);
    return new discord_js_1.ActionRowBuilder().addComponents(prevBtn, pageBtn, nextBtn);
}
exports.statsCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 View key statistics (Admin only)')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const adminId = process.env.ADMIN_ID;
        if (!adminId || interaction.user.id !== adminId) {
            await interaction.reply({ content: '❌ You are not authorized.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        if (!supabase_1.supabase) {
            await interaction.reply({ content: 'Database is not initialized.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        try {
            const { data: keysData, error } = await supabase_1.supabase
                .from('keys')
                .select('*');
            if (error) {
                console.error('[Stats] Supabase error:', JSON.stringify(error));
                await interaction.editReply('Failed to fetch data from database.');
                return;
            }
            const keys = keysData || [];
            const totalKeys = keys.length;
            const uniqueUsers = new Set(keys.map((k) => k.discord_id)).size;
            // Group keys by user with purchase details
            const userGroups = {};
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
            const chunks = [];
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
            if (totalPages <= 1)
                return;
            // Listen for button clicks (2 minutes timeout)
            const collector = reply.createMessageComponentCollector({
                componentType: discord_js_1.ComponentType.Button,
                time: 120_000
            });
            collector.on('collect', async (btnInteraction) => {
                if (btnInteraction.user.id !== adminId) {
                    await btnInteraction.reply({ content: '❌ Not authorized.', flags: discord_js_1.MessageFlags.Ephemeral });
                    return;
                }
                if (btnInteraction.customId === 'stats_prev' && currentPage > 0) {
                    currentPage--;
                }
                else if (btnInteraction.customId === 'stats_next' && currentPage < totalPages - 1) {
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
                await interaction.editReply({ components: [disabledButtons] }).catch(() => { });
            });
        }
        catch (e) {
            console.error('[Stats] Unexpected error:', e);
            await interaction.editReply('An error occurred.');
        }
    }
};
