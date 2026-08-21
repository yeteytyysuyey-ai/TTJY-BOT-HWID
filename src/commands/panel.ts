import path from 'path';
import fs from 'fs';
import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder
} from 'discord.js';

function getBannerAttachment(): AttachmentBuilder | null {
    const candidatePaths = [
        path.resolve(__dirname, '../../banner.png'),
        path.resolve(__dirname, '../banner.png'),
        path.resolve(process.cwd(), 'banner.png'),
    ];
    for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
            return new AttachmentBuilder(p, { name: 'banner.png' });
        }
    }
    return null;
}

export function renderPanel(state: any) {

    const container = new ContainerBuilder()
        .setAccentColor(0x2b2d31);

    const files: AttachmentBuilder[] = [];

    if (state.page === 'main') {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# TTJY Hub'),
        );

        const banner = getBannerAttachment();
        if (banner) {
            files.push(banner);
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL('attachment://banner.png')
                        .setDescription('TTJY Hub Banner')
                )
            );
        }

        container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('**License Management**'),
        );

        container.addActionRowComponents(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('keys').setLabel('Show Keys').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('show_hwids').setLabel('Show HWIDs').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('add').setLabel('Add HWID').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('remove').setLabel('Remove HWID').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('reset_hwid').setLabel('Reset HWID').setStyle(ButtonStyle.Danger)
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('**Monthly Pricing**'),
        );

        container.addActionRowComponents(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                // new ButtonBuilder().setCustomId('info').setLabel('Info').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('buy').setLabel('Buy [ 8USD/Month ]').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('buy_cashcard').setLabel('TrueMoney Cash Card').setStyle(ButtonStyle.Primary)
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('**Renew Key (ต่ออายุ)**'),
        );

        container.addActionRowComponents(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('renew').setLabel('Renew (TrueMoney Link)').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('renew_cashcard').setLabel('Renew (Cash Card)').setStyle(ButtonStyle.Primary)
            )
        );
    } else if (state.page === 'keys') {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## KEY MANAGEMENT'),
            new TextDisplayBuilder().setContent('Your active premium keys')
        );

        if (state.myKeys && state.myKeys.length > 0) {
            let keyText = '';
            state.myKeys.forEach((k: any, i: number) => {
                keyText += `**${i + 1}. ${k.custom_name}**\n\`${k.key_value}\`\n\n`;
            });
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(keyText)
            );
        } else {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('You do not have any keys yet.')
            );
        }

        container.addActionRowComponents(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('dismiss_ephemeral').setLabel('Dismiss').setStyle(ButtonStyle.Secondary)
            )
        );
    }

    return {
        flags: MessageFlags.IsComponentsV2,
        components: [container],
        files
    };
}

import {
    SlashCommandBuilder,
    CommandInteraction,
    PermissionFlagsBits
} from 'discord.js';

export const panelCommand = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Admin panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: CommandInteraction) {
        await interaction.reply(renderPanel({ page: 'main' }) as any);
    },

    renderPanel
};