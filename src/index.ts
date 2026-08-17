import { Client, GatewayIntentBits, Partials, Collection, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import { panelCommand } from './commands/panel';
import { statsCommand } from './commands/stats';
import { handleInteraction } from './events/interactionCreate';
import { handleMessageCreate } from './events/messageCreate';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message],
});

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    
    // Register commands
    if (token && clientId) {
        const rest = new REST({ version: '10' }).setToken(token);
        (async () => {
            try {
                console.log('Started refreshing application (/) commands.');
                await rest.put(
                    Routes.applicationCommands(clientId),
                    { body: [panelCommand.data.toJSON(), statsCommand.data.toJSON()] },
                );
                console.log('Successfully reloaded application (/) commands.');
            } catch (error) {
                console.error(error);
            }
        })();
    } else {
        console.warn("No DISCORD_TOKEN or CLIENT_ID found. Commands were not registered.");
    }
});

client.on('interactionCreate', async (interaction) => {
    try {
        await handleInteraction(interaction);
    } catch (error) {
        console.error('Error handling interaction:', error);
    }
});

client.on('messageCreate', async (message) => {
    try {
        await handleMessageCreate(message);
    } catch (error) {
        console.error('Error handling messageCreate:', error);
    }
});



if (token) {
    client.login(token);
} else {
    console.error('DISCORD_TOKEN is not defined in the environment.');
}
