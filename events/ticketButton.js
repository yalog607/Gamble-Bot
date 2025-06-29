const {
    Events,
    MessageFlags,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType,
} = require("discord.js");
const { TicketSetup, ActiveTicket } = require("../models/ticket.model");
const { createTranscript } = require('discord-html-transcripts');
const { primary } = require('../color.json');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'design_button'){
            const setup = await TicketSetup.findOne({ guildId: interaction.guildId});
            if (!setup) return;
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)){
                return interaction.reply({
                    content: 'Bạn không có quyền để thực hiện hành động này',
                    flags: MessageFlags.Ephemeral
                })
            };
            
            const styleRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('style_Primary')
                        .setLabel('Primary')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('style_Secondary')
                        .setLabel('Secondary')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('style_Danger')
                        .setLabel('Danger')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('style_Success')
                        .setLabel('Success')
                        .setStyle(ButtonStyle.Success),
                );
            
            await interaction.reply({
                content: 'Chọn màu cho nút Ticket',
                components: [styleRow],
                flags: MessageFlags.Ephemeral
            });
            const message = await interaction.fetchReply();
            const styleCollector = message.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 300000
            });
            let buttonData = {};

            styleCollector.on('collect', async i => {
                if (i.customId.startsWith('style_')) {
                    buttonData.style = i.customId.replace('style_', '');
                    await i.update({
                        content: 'Thêm nhãn cho nút Ticket',
                        components: []
                    });

                    const labelCollector = i.channel.createMessageCollector({
                        filter: m => m.author.id === i.user.id,
                        time: 300000,
                        max: 1
                    });
                    labelCollector.on('collect', async m => {
                        buttonData.label = m.content;
                        await m.delete();

                        const emojiRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('skip_emoji')
                                    .setLabel('Bỏ qua')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('add_emoji')
                                    .setLabel('Thêm Emoji')
                                    .setStyle(ButtonStyle.Primary)
                            );
                        await i.editReply({
                            content: 'Bạn có muốn thêm emoji cho nút Ticket không?',
                            components: [emojiRow]
                        });
                        
                    })
                } else if(i.customId === 'add_emoji'){
                    await i.update({
                        content: 'Hãy cung cấp emoji (nhập duy nhất 1 emoji)',
                        components: []
                    });

                    const emojiCollector = i.channel.createMessageCollector({
                        filter: m => m.author.id === i.user.id,
                        max: 1,
                        time: 300000
                    });

                    emojiCollector.on('collect', async m => {
                        buttonData.emoji = m.content;
                        await m.delete();
                        await createTicketButton(i, buttonData);
                    });
                } else if(i.customId === 'skip_emoji'){
                    await i.update({
                        content: 'Nút đang được tạo!',
                        components: []
                    });
                    await createTicketButton(i, buttonData);
                }
            });
        } 
        // Handle ticket creation
        if (interaction.customId.startsWith('create_ticket_')) {
            const setup = await TicketSetup.findOne({guildId: interaction.guildId});
            if (!setup) return;

            const existingTicket = await  ActiveTicket.findOne({
                guildId: interaction.guildId,
                userId: interaction.user.id,
                closed: false
            });
            if (existingTicket){
                return interaction.reply({
                    content: 'Bạn đã có một Ticket đang mở!',
                    flags: MessageFlags.Ephemeral
                })
            }
            const ticketNumber = Math.floor(Math.random() * 9000) + 1000;
            const channelName = `ticket-${ticketNumber}`;
            const channel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: setup.categoryId,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    },
                    {
                        id: setup.supportRoleId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    }
                ]
            });
            const ticket = new ActiveTicket({
                guildId: interaction.guildId,
                channelId: channel.id,
                userId: interaction.user.id,
                ticketId: ticketNumber.toString()
            });
            await ticket.save();

            const embed = new EmbedBuilder()
                .setTitle(`Ticket #${ticketNumber}`)
                .setDescription(`Sẽ có người hỗ trợ cho bạn sớm nhất có thể.\n\n**User:** ${interaction.user}\n**Support Role: ** <@&${setup.supportRoleId}>`)
                .setColor(primary)
                .setTimestamp();
            
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔐 Đóng Ticket')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('🔖 Nhận khách')
                    .setStyle(ButtonStyle.Success)
            )
            await channel.send({
                content: `<@&${setup.supportRoleId}>`,
                embeds: [embed],
                components: [buttons]
            });

            await interaction.reply({
                content: `Ticket của bạn đã được tạo: ${channel}`,
                flags: MessageFlags.Ephemeral
            });
        }

        if (interaction.customId === 'close_ticket'){
            const ticket = await ActiveTicket.findOne({
                channelId: interaction.channel.id,
                closed: false
            });
            if (!ticket) return;

            const setup = await TicketSetup.findOne({ guildId: interaction.guild.id});
            if (!setup) return;

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept')
                        .setLabel('Đồng ý')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('deny')
                        .setLabel('Hủy')
                        .setStyle(ButtonStyle.Secondary),
                )
                
            const response = await interaction.reply({
                content: `Xác nhận muốn đóng ticket?`,
                components: [row],
                withResponse: true,
            })
            const message = await interaction.fetchReply();
            const collector = message.createMessageComponentCollector({ time: 300000 });
            collector.on('collect', async i => {
                if (i.customId === 'accept'){
                    const transcript = await createTranscript(interaction.channel, {
                        limit: -1,
                        filename: `ticket-${ticket.ticketId}.html`
                    });

                    const transcriptChannel = await interaction.guild.channels.fetch(setup.transcriptChannelId);
                    await transcriptChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`Ticket #${ticket.ticketId} đã đóng`)
                                .setDescription(`**Đóng bởi**: ${interaction.user}\n **User:** <@${ticket.userId}>`)
                                .setColor('Random')
                                .setTimestamp()
                        ],
                        files: [transcript]
                    })
                    ticket.closed = true;
                    await ticket.save();

                    await interaction.channel.delete();
                } else if (i.customId === 'deny') {
                    await message.delete();
                }
            })
        }

        if (interaction.customId === 'claim_ticket'){
            const ticket = await ActiveTicket.findOne({
                channelId: interaction.channel.id,
                closed: false,
            });
            if (!ticket) return;

            if (ticket.claimed.status) {
                return interaction.reply({
                    content: `Ticket này đã được nhận bởi <@${ticket.claimed.by}>`,
                    flags: MessageFlags.Ephemeral
                })
            }
            ticket.claimed = {
                status: true,
                by: interaction.user.id
            };
            await ticket.save();

            const embed = new EmbedBuilder()
                .setTitle('Ticket đã được xử lý')
                .setDescription(`Khách hàng sẽ được hổ trợ bởi ${interaction.user}`)
                .setTimestamp()
            await interaction.reply({embeds: [embed]})
        }
    },
};

async function createTicketButton(interaction, buttonData) {
    const setup = await TicketSetup.findOne({ guildId: interaction.guildId});
    if (!setup) return;
    
    const customId = `create_ticket_${Date.now()}`;
    const button = new ButtonBuilder()
        .setCustomId(customId)
        .setLabel(buttonData.label)
        .setStyle(ButtonStyle[buttonData.style]);

    if (buttonData.emoji){
        button.setEmoji(buttonData.emoji);
    }
    setup.buttons = setup.buttons || [];
    setup.buttons.push({
        style: buttonData.style,
        label: buttonData.label,
        emoji: buttonData.emoji,
        customId: customId
    });
    await setup.save();

    const channel = await interaction.guild.channels.fetch(setup.panelChannelId);
    const messages = await channel.messages.fetch({limit: 1});
    const panelMessage = messages.first();
    if (panelMessage) {
        const embed = panelMessage.embeds[0];
        const components = panelMessage.components;
        const existingComponents = components.map(row => {
            return ActionRowBuilder.from(row);
        })
        console.log(components.length);
        const newRow = new ActionRowBuilder().addComponents(button);

        await panelMessage.edit({
            embeds: [embed],
            components: [newRow]
        });

        await interaction.editReply({
            content: 'Đã thêm nút cho bảng Ticket!',
            components: []
        })
    }
}