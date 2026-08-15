"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.panelCommand = void 0;
exports.renderPanel = renderPanel;
const discord_js_1 = require("discord.js");
function renderPanel(state) {
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(0x2b2d31);
    if (state.page === 'main') {
        container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent('# TTJY Hub'));
        container.addMediaGalleryComponents(new discord_js_1.MediaGalleryBuilder().addItems(new discord_js_1.MediaGalleryItemBuilder()
            .setURL('https://raw.githubusercontent.com/Yumiara/SSL-TTJY/main/TJYS.png')
            .setDescription('TTJY Hub Banner')));
        new discord_js_1.TextDisplayBuilder().setContent('Premium license management');
        container.addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true).setSpacing(discord_js_1.SeparatorSpacingSize.Small));
        container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent('**License Management**'));
        container.addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('keys').setLabel('Show Keys').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('show_hwids').setLabel('Show HWIDs').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('add').setLabel('Add HWID').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('remove').setLabel('Remove HWID').setStyle(discord_js_1.ButtonStyle.Danger)));
        container.addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true).setSpacing(discord_js_1.SeparatorSpacingSize.Small));
        container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent('**Monthly Pricing**'));
        container.addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(
        // new ButtonBuilder().setCustomId('info').setLabel('Info').setStyle(ButtonStyle.Secondary),
        new discord_js_1.ButtonBuilder().setCustomId('buy').setLabel('Buy [ 8USD/Month ]').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('buy_cashcard').setLabel('TrueMoney Cash Card').setStyle(discord_js_1.ButtonStyle.Primary)));
        container.addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true).setSpacing(discord_js_1.SeparatorSpacingSize.Small));
        container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent('**Renew Key (ต่ออายุ)**'));
        container.addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('renew').setLabel('Renew (TrueMoney Link)').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('renew_cashcard').setLabel('Renew (Cash Card)').setStyle(discord_js_1.ButtonStyle.Primary)));
    }
    else if (state.page === 'keys') {
        container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent('## KEY MANAGEMENT'), new discord_js_1.TextDisplayBuilder().setContent('Your active premium keys'));
        if (state.myKeys && state.myKeys.length > 0) {
            let keyText = '';
            state.myKeys.forEach((k, i) => {
                keyText += `**${i + 1}. ${k.custom_name}**\n\`${k.key_value}\`\n\n`;
            });
            container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(keyText));
        }
        else {
            container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent('You do not have any keys yet.'));
        }
        container.addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('dismiss_ephemeral').setLabel('Dismiss').setStyle(discord_js_1.ButtonStyle.Secondary)));
    }
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [container]
    };
}
const discord_js_2 = require("discord.js");
exports.panelCommand = {
    data: new discord_js_2.SlashCommandBuilder()
        .setName('panel')
        .setDescription('Admin panel')
        .setDefaultMemberPermissions(discord_js_2.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.reply(renderPanel({ page: 'main' }));
    },
    renderPanel
};
