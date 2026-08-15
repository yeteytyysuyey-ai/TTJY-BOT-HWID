"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const panel_1 = require("./commands/panel");
const stats_1 = require("./commands/stats");
const interactionCreate_1 = require("./events/interactionCreate");
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '.env') });
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.DirectMessages
    ],
    partials: [discord_js_1.Partials.Channel],
});
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
client.once('clientReady', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    // Register commands
    if (token && clientId) {
        const rest = new discord_js_1.REST({ version: '10' }).setToken(token);
        (async () => {
            try {
                console.log('Started refreshing application (/) commands.');
                await rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: [panel_1.panelCommand.data.toJSON(), stats_1.statsCommand.data.toJSON()] });
                console.log('Successfully reloaded application (/) commands.');
            }
            catch (error) {
                console.error(error);
            }
        })();
    }
    else {
        console.warn("No DISCORD_TOKEN or CLIENT_ID found. Commands were not registered.");
    }
});
client.on('interactionCreate', async (interaction) => {
    try {
        await (0, interactionCreate_1.handleInteraction)(interaction);
    }
    catch (error) {
        console.error('Error handling interaction:', error);
    }
});
if (token) {
    client.login(token);
}
else {
    console.error('DISCORD_TOKEN is not defined in the environment.');
}
