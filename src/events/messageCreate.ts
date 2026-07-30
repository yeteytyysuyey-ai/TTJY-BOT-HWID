import { Message, EmbedBuilder } from 'discord.js';
import { supabase } from '../supabase';

export async function handleMessageCreate(message: Message) {
    if (message.author.bot) return;

    // Only process DMs
    if (message.guildId) return;

    const adminId = process.env.ADMIN_ID;
    if (!adminId || message.author.id !== adminId) {
        return;
    }

    if (message.content.toLowerCase() === '!stats' || message.content.toLowerCase() === '!info') {
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

            let userListText = '';
            
            // Group keys by user
            const userGroups: { [key: string]: number } = {};
            for (const k of keysData) {
                if (!userGroups[k.discord_id]) userGroups[k.discord_id] = 0;
                userGroups[k.discord_id]++;
            }

            for (const [discordId, count] of Object.entries(userGroups)) {
                userListText += `- <@${discordId}> (ID: ${discordId}): ${count} key(s)\n`;
            }

            if (userListText.length > 1024) {
                userListText = userListText.substring(0, 1000) + '...\n(Too many users to display)';
            }

            const embed = new EmbedBuilder()
                .setTitle('📊 Key Statistics / สถิติการขาย')
                .setColor('#00ff00')
                .addFields(
                    { name: 'Total People / จำนวนคนซื้อ', value: `${uniqueUsers} คน`, inline: true },
                    { name: 'Total Keys / จำนวน Key', value: `${totalKeys} คีย์`, inline: true },
                    { name: 'Customer List / รายชื่อลูกค้า (เจ้าของดิส)', value: userListText || 'ยังไม่มีลูกค้า' }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (e) {
            console.error(e);
            await message.reply('An error occurred.');
        }
    }
}
