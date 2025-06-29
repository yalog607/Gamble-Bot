const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const { TicketSetup, ActiveTicket } = require('../../models/ticket.model.js');
const { purple, primary } = require('../../color.json');

module.exports = {
    category: 'Ticket',
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Quản lý hệ thống ticket')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Cài đặt hệ thống ticket')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Vô hiệu hóa hệ thống ticket')
                .addStringOption(option =>
                    option
                        .setName('panelchannelid')
                        .setDescription('ID của channel chứa bảng Ticket')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'disable') {
            const panelChannelId = interaction.options.getString('panelchannelid');

            const setup = await TicketSetup.findOneAndDelete({
                guildId: interaction.guildId,
                panelChannelId: panelChannelId
            });

            if (!setup) {
                return interaction.reply({ content: 'Ticket chưa được thiết lập trong Server này!', flags: MessageFlags.Ephemeral });
            }

            try {
                const channel = await interaction.guild.channels.fetch(panelChannelId);
                const messages = await channel.messages.fetch();
                const panelMessage = messages.find(m => m.embeds.length > 0 && m.components.length > 0 && m.author.id === interaction.client.user.id);
                if (panelMessage) {
                    await panelMessage.delete();
                }
                return interaction.reply({
                    content: 'Hệ thống Ticket đã được vô hiệu hóa và bảng Ticket đã được xóa!',
                    flags: MessageFlags.Ephemeral
                })
            } catch (error) {
                console.log('Lỗi trong command/ticket.js', error);
                return interaction.reply({
                    content: 'Hệ thống ticket đã được vô hiệu hóa nhưng không thể xóa bảng Ticket!',
                    flags: MessageFlags.Ephemeral
                })
            }
        }

        if (subCommand === 'setup') {
            let setupData = {
                guildId: interaction.guildId,
                embedConfig: {
                    title: 'Thiết lập Ticket',
                    description: 'Nhấn vào các nút bên dưới để tùy chỉnh Ticket',
                    timestamp: false
                },
                button: [
                    {
                        style: 'Primary',
                        label: 'Design Button',
                        customId: 'ticket_action_0',
                        emoji: ''
                    }
                ]
            };

            const setupEmbed = new EmbedBuilder()
                .setTitle(setupData.embedConfig.title)
                .setDescription(setupData.embedConfig.description)
                .addFields(
                    {
                        name: '', value: 'Màu xanh là **bắt buộc**\nMàu đen là **tùy chọn**'
                    }
                );

            const buttons = [
                new ButtonBuilder()
                    .setCustomId('title_setup')
                    .setLabel('Tiêu đề')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('description_setup')
                    .setLabel('Mô tả')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('image_setup')
                    .setLabel('Hình ảnh')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('thumbnail_setup')
                    .setLabel('Thumbnail')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('color_setup')
                    .setLabel('Color')
                    .setStyle(ButtonStyle.Secondary),
            ];

            const buttons2 = [
                new ButtonBuilder()
                    .setCustomId('footer_setup')
                    .setLabel('Footer Text')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('category_setup')
                    .setLabel('Category')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('role_setup')
                    .setLabel('Support Role')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('transcript_setup')
                    .setLabel('Transcript Channel')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('buttons_setup')
                    .setLabel('Số lượng nút')
                    .setStyle(ButtonStyle.Primary),

            ];

            const buttons3 = [
                new ButtonBuilder()
                    .setCustomId('send_panel')
                    .setLabel('Send Panel')
                    .setStyle(ButtonStyle.Success),
            ];

            const button = [
                new ButtonBuilder()
                    .setCustomId('ticket_action_0')
                    .setLabel('Design Button')
                    .setStyle(ButtonStyle.Primary)
            ];

            let row = new ActionRowBuilder().addComponents(button);
            const row1 = new ActionRowBuilder().addComponents(buttons);
            const row2 = new ActionRowBuilder().addComponents(buttons2);
            const row3 = new ActionRowBuilder().addComponents(buttons3);

            let userButtonSetupStates = new Map();
            userButtonSetupStates.set(interaction.user.id, {});
            const response = await interaction.reply({
                embeds: [setupEmbed],
                components: [row, row1, row2, row3],
                flags: MessageFlags.Ephemeral,
                withResponse: true,
            });
            const collector = response.resource.message.createMessageComponentCollector({ time: 300000 });
            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'Thiết lập này không dành cho bạn', flags: MessageFlags.Ephemeral });
                }
                const customID = i.customId;
                const currentUserButtonData = userButtonSetupStates.get(i.user.id);
                if (customID.startsWith('ticket_action_')) {
                    await i.deferUpdate();
                    currentUserButtonData.customId = customID;
                    userButtonSetupStates.set(i.user.id, currentUserButtonData);

                    const styleRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId('style_Primary').setLabel('Primary').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('style_Secondary').setLabel('Secondary').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('style_Danger').setLabel('Danger').setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('style_Success').setLabel('Success').setStyle(ButtonStyle.Success), // Sửa lỗi màu
                        );

                    await interaction.editReply({
                        content: '**Chọn màu cho Button**',
                        components: [styleRow],
                        embeds: []
                    });

                } else if (customID.startsWith('style_')) {
                    await i.update({
                        content: '**Thêm nhãn cho nút Ticket**',
                        components: [],
                    });
                    currentUserButtonData.style = customID.replace('style_', ''); // Cập nhật style
                    userButtonSetupStates.set(i.user.id, currentUserButtonData); // Lưu lại trạng thái

                    const labelCollector = i.channel.createMessageCollector({
                        filter: m => m.author.id === i.user.id,
                        time: 300000,
                        max: 1
                    });
                    labelCollector.on('collect', async m => {
                        currentUserButtonData.label = m.content; // Cập nhật label
                        userButtonSetupStates.set(i.user.id, currentUserButtonData); // Lưu lại trạng thái

                        await m.delete();

                        const emojiRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setCustomId('skip_emoji').setLabel('Bỏ qua').setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder().setCustomId('add_emoji').setLabel('Thêm Emoji').setStyle(ButtonStyle.Primary)
                            );
                        await interaction.editReply({
                            content: '**Bạn có muốn thêm emoji cho nút Ticket không?**',
                            components: [emojiRow]
                        });
                    });
                    labelCollector.on('end', collected => {
                        if (collected.size === 0 && userButtonSetupStates.has(i.user.id)) {
                            interaction.editReply({ content: 'Hết thời gian chờ nhập nhãn. Lệnh đã bị hủy.', components: [] })
                                .catch(console.error);
                            userButtonSetupStates.delete(i.user.id); // Xóa trạng thái khi kết thúc
                            collector.stop('timeout'); // Dừng collector chính
                        }
                    });

                } else if (customID === 'add_emoji') {
                    await i.update({
                        content: '**Hãy cung cấp emoji (nhập duy nhất 1 emoji)**',
                        components: []
                    });

                    const emojiCollector = i.channel.createMessageCollector({
                        filter: m => m.author.id === i.user.id,
                        max: 1,
                        time: 300000
                    });

                    emojiCollector.on('collect', async m => {
                        await m.delete();
                        currentUserButtonData.emoji = m.content; // Cập nhật emoji
                        userButtonSetupStates.set(i.user.id, currentUserButtonData); // Lưu lại trạng thái

                        const targetButtonCustomId = currentUserButtonData.customId;
                        let listNewButton = [];
                        for (let i = 0; i < setupData.button.length; i++) {
                            if (setupData.button[i].customId === targetButtonCustomId) {
                                setupData.button[i] = currentUserButtonData;
                                listNewButton.push(setupData.button[i]);
                            } else {
                                listNewButton.push(setupData.button[i]);
                            }
                        };
                        setupData.button = listNewButton;
                        userButtonSetupStates.set(i.user.id, {});

                        // Tái tạo lại tất cả các nút
                        let listButton = [];
                        for (const config of setupData.button) {
                            const newButton = new ButtonBuilder()
                                .setCustomId(config.customId)
                                .setLabel(config.label)
                                .setStyle(ButtonStyle[config.style]); // Chắc chắn ButtonStyle[config.style] là hợp lệ

                            if (config.emoji) { // Xử lý emoji phức tạp hơn
                                const animatedMatch = config.emoji.match(/<a:(\w+):(\d+)>/);
                                const staticMatch = config.emoji.match(/<:(\w+):(\d+)>/);
                                if (animatedMatch) {
                                    newButton.setEmoji({ name: animatedMatch[1], id: animatedMatch[2], animated: true });
                                } else if (staticMatch) {
                                    newButton.setEmoji({ name: staticMatch[1], id: staticMatch[2], animated: false });
                                } else {
                                    newButton.setEmoji(config.emoji); // Emoji unicode
                                }
                            }
                            listButton.push(newButton);
                        }
                        const newRow = new ActionRowBuilder().addComponents(listButton);
                        row = newRow;

                        // Cập nhật tin nhắn ephemeral gốc
                        await i.editReply({content: 'Đã tạo nút thành công!', flags: MessageFlags.Ephemeral});
                        await interaction.editReply({ content: '', embeds: [setupEmbed], components: [row, row1, row2, row3] });
                    });

                    emojiCollector.on('end', collected => {
                        if (collected.size === 0 && userButtonSetupStates.has(i.user.id)) {
                            interaction.editReply({ content: 'Hết thời gian chờ nhập emoji. Lệnh đã bị hủy.', components: [] })
                                .catch(console.error);
                            userButtonSetupStates.delete(i.user.id);
                            collector.stop('timeout');
                        }
                    });

                } else if (customID === 'skip_emoji') {
                    currentUserButtonData.emoji = ''; // Đặt rỗng nếu bỏ qua
                    userButtonSetupStates.set(i.user.id, currentUserButtonData);

                    const targetButtonCustomId = currentUserButtonData.customId;
                    let listNewButton = [];
                    for (let i = 0; i < setupData.button.length; i++) {
                        if (setupData.button[i].customId === targetButtonCustomId) {
                            setupData.button[i] = currentUserButtonData;
                            listNewButton.push(setupData.button[i]);
                        } else {
                            listNewButton.push(setupData.button[i]);
                        }
                    };
                    setupData.button = listNewButton;
                    userButtonSetupStates.set(i.user.id, {});

                    let listButton = [];
                    for (const config of setupData.button) {
                        const newButton = new ButtonBuilder()
                            .setCustomId(config.customId)
                            .setLabel(config.label)
                            .setStyle(ButtonStyle[config.style]);

                        if (config.emoji) {
                            const animatedMatch = config.emoji.match(/<a:(\w+):(\d+)>/);
                            const staticMatch = config.emoji.match(/<:(\w+):(\d+)>/);
                            if (animatedMatch) {
                                newButton.setEmoji({ name: animatedMatch[1], id: animatedMatch[2], animated: true });
                            } else if (staticMatch) {
                                newButton.setEmoji({ name: staticMatch[1], id: staticMatch[2], animated: false });
                            } else {
                                newButton.setEmoji(config.emoji);
                            }
                        }
                        listButton.push(newButton);
                    }
                    const newRow = new ActionRowBuilder().addComponents(listButton);
                    row = newRow;
                    await i.reply({content: 'Đã tạo nút thành công!', flags: MessageFlags.Ephemeral});
                    await interaction.editReply({ content: '', embeds: [setupEmbed], components: [row, row1, row2, row3] });
                }
                switch (i.customId) {
                    case 'title_setup':
                        await i.reply({
                            content: `Hãy nhập tiêu đề cho Ticket...`,
                            flags: MessageFlags.Ephemeral
                        });

                        const titleCollector = i.channel.createMessageCollector({
                            filter: m => m.author.id === i.user.id,
                            max: 1,
                            time: 300000
                        });

                        titleCollector.on('collect', async m => {
                            setupData.embedConfig.title = m.content;
                            setupEmbed.setTitle(m.content);
                            await m.delete();
                            await i.editReply({ content: 'Tiêu đề đã được thiết lập!', flags: MessageFlags.Ephemeral });
                            await interaction.editReply({ embeds: [setupEmbed], components: [row, row1, row2, row3], });
                        });
                        break;
                    case 'description_setup':
                        await i.reply({
                            content: `Hãy nhập mô tả cho Ticket...`,
                            flags: MessageFlags.Ephemeral
                        });

                        const descCollector = i.channel.createMessageCollector({
                            filter: m => m.author.id === i.user.id,
                            max: 1,
                            time: 300000
                        });

                        descCollector.on('collect', async m => {
                            setupData.embedConfig.description = m.content;
                            setupEmbed.setDescription(m.content);
                            await m.delete();
                            await i.editReply({ content: 'Mô tả đã được thiết lập!', flags: MessageFlags.Ephemeral });
                            await interaction.editReply({ embeds: [setupEmbed], components: [row, row1, row2, row3], });
                        });
                        break;
                    case 'image_setup':
                        await i.reply({
                            content: `Hãy nhập link của hình ảnh cho Ticket...(nhập 'skip' để bỏ qua)`,
                            flags: MessageFlags.Ephemeral
                        });

                        const imgCollector = i.channel.createMessageCollector({
                            filter: m => m.author.id === i.user.id,
                            max: 1,
                            time: 300000
                        });

                        imgCollector.on('collect', async m => {
                            if (m.content.toLowerCase() !== 'skip') {
                                setupData.embedConfig.image = m.content;
                                setupEmbed.setImage(m.content);
                            }
                            await m.delete();
                            await i.editReply({ content: 'Hình ảnh đã được thiết lập!', flags: MessageFlags.Ephemeral });
                            await interaction.editReply({ embeds: [setupEmbed], components: [row, row1, row2, row3], });
                        });
                        break;
                    case 'thumbnail_setup':
                        await i.reply({
                            content: `Hãy nhập link của thumbnail cho Ticket...(nhập 'skip' để bỏ qua)`,
                            flags: MessageFlags.Ephemeral
                        });

                        const thumbCollector = i.channel.createMessageCollector({
                            filter: m => m.author.id === i.user.id,
                            max: 1,
                            time: 300000
                        });

                        thumbCollector.on('collect', async m => {
                            if (m.content.toLowerCase() !== 'skip') {
                                setupData.embedConfig.thumbnail = m.content;
                                setupEmbed.setThumbnail(m.content);
                            }
                            await m.delete();
                            await i.editReply({ content: 'Thumbnail đã được thiết lập!', flags: MessageFlags.Ephemeral });
                            await interaction.editReply({ embeds: [setupEmbed], components: [row, row1, row2, row3], });
                        });
                        break;
                    case 'color_setup':
                        await i.reply({ content: 'Nhập mã HEX màu cho embed `(ví dụ: #f11968)`', flags: MessageFlags.Ephemeral });
                        const colorSetCollector = i.channel.createMessageCollector({
                            filter: m => m.author.id === i.user.id,
                            max: 1,
                            time: 300000
                        });
                        colorSetCollector.on('collect', async m => {
                            setupData.embedConfig.color = `${m.content}`;
                            setupEmbed.setColor(`${m.content}`);
                            await m.delete();
                            await i.editReply({ content: 'Màu cho viền embed đã được thiết lập!', flags: MessageFlags.Ephemeral });
                            await interaction.editReply({ embeds: [setupEmbed], components: [row, row1, row2, row3], });
                        });
                        break;
                    case 'footer_setup':
                        await i.reply({
                            content: `Hãy nhập footer cho Ticket...`,
                            flags: MessageFlags.Ephemeral
                        });

                        const footCollector = i.channel.createMessageCollector({
                            filter: m => m.author.id === i.user.id,
                            max: 1,
                            time: 300000
                        });

                        footCollector.on('collect', async m => {
                            setupData.embedConfig.footer = m.content;
                            setupEmbed.setFooter({ text: m.content });
                            await m.delete();
                            await i.editReply({ content: 'Footer đã được thiết lập!', flags: MessageFlags.Ephemeral });
                            await interaction.editReply({ embeds: [setupEmbed], components: [row, row1, row2, row3], });
                        });
                        break;
                    case 'category_setup':
                        await i.reply({ content: 'Hãy nhập ID của danh mục, đây là nơi những Ticket sẽ được tạo', flags: MessageFlags.Ephemeral });
                        const categoryCollector = i.channel.createMessageCollector({
                            filter: m => m.author.id === i.user.id,
                            max: 1,
                            time: 300000
                        });
                        categoryCollector.on('collect', async m => {
                            setupData.categoryId = m.content;
                            await m.delete();
                            await i.editReply({ content: 'Danh mục của những Ticket đã được thiết lập!', flags: MessageFlags.Ephemeral });
                        });
                        break;
                    case 'role_setup':
                        await i.reply({ content: 'Hãy tag role của những người sẽ trả lời Ticket hoặc nhập ID của role', flags: MessageFlags.Ephemeral });
                        const roleCollector = i.channel.createMessageCollector({
                            filter: m => m.author.id === i.user.id,
                            max: 1,
                            time: 300000
                        });
                        roleCollector.on('collect', async m => {
                            const roleId = m.content.replace(/[<@&>]/g, '');
                            setupData.supportRoleId = roleId;
                            await m.delete();
                            await i.editReply({ content: 'Support role đã được thiết lập!', flags: MessageFlags.Ephemeral });
                        });
                        break;
                    case 'transcript_setup':
                        await i.reply({ content: 'Nhập ID của channel sẽ được gửi các transcript logs', flags: MessageFlags.Ephemeral });
                        const transcriptCollector = i.channel.createMessageCollector({
                            filter: m => m.author.id === i.user.id,
                            max: 1,
                            time: 300000
                        });
                        transcriptCollector.on('collect', async m => {
                            setupData.transcriptChannelId = m.content;
                            await m.delete();
                            await i.editReply({ content: 'Kênh dành cho transcript đã được thiết lập!', flags: MessageFlags.Ephemeral });
                        });
                        break;
                    case 'buttons_setup':
                        await i.reply({ content: 'Nhập số lượng nút muốn hiển thị cho Ticket (tối đa là 5)', flags: MessageFlags.Ephemeral });
                        const amountButtons = i.channel.createMessageCollector({
                            filter: m => m.author.id === i.user.id,
                            max: 1,
                            time: 300000
                        });

                        amountButtons.on('collect', async m => {
                            let count = Number(m.content);
                            if (isNaN(count)) {
                                await m.delete();
                                await i.editReply({ content: 'Dữ liệu nhập vào không phải dạng số!', flags: MessageFlags.Ephemeral });
                                return;
                            }
                            if (count > 5 || count < 1) {
                                await m.delete();
                                await i.editReply({ content: 'Số lượng phải nằm trong phạm vi 1-5 nút!', flags: MessageFlags.Ephemeral });
                                return;
                            }
                            setupData.amountButtons = count;

                            let buttonArray = [];
                            let buttonSetupData = []
                            while (count--) {
                                const buttonCustomId = `ticket_action_${count}`;
                                const button = new ButtonBuilder()
                                    .setCustomId(buttonCustomId)
                                    .setLabel('Design Button')
                                    .setStyle(ButtonStyle.Primary);
                                buttonArray.push(button);
                                const buttonDATA = {
                                    style: 'Primary',
                                    label: 'Design Button',
                                    emoji: '',
                                    customId: buttonCustomId
                                }
                                buttonSetupData.push(buttonDATA);
                            }
                            setupData.button = buttonSetupData;
                            row = new ActionRowBuilder().addComponents(buttonArray);
                            await m.delete();
                            await i.editReply({ content: 'Số lượng nút được thiết lập!', flags: MessageFlags.Ephemeral });
                            await interaction.editReply({ embeds: [setupEmbed], components: [row, row1, row2, row3,] });
                        });
                        break;
                    case 'send_panel':
                        if (
                            !setupData.embedConfig.title ||
                            !setupData.embedConfig.description ||
                            !setupData.categoryId ||
                            !setupData.supportRoleId ||
                            !setupData.transcriptChannelId ||
                            !setupData.button.length
                        ) {
                            await i.reply({ content: 'Vui lòng cung cấp đầy đủ thông tin cần thiết cho Ticket (các nút màu xanh)!', flags: MessageFlags.Ephemeral });
                            break;
                        }
                        await i.reply({ content: 'Nhập ID của channel sẽ được gửi bảng Ticket', flags: MessageFlags.Ephemeral });
                        const channelCollector = i.channel.createMessageCollector({
                            filter: m => m.author.id === i.user.id,
                            max: 1,
                            time: 300000
                        });
                        channelCollector.on('collect', async m => {
                            setupData.panelChannelId = m.content;
                            await m.delete();
                            console.log(setupData);

                            const ticketSetup = new TicketSetup(setupData);
                            await ticketSetup.save();

                            const channel = await interaction.guild.channels.fetch(setupData.panelChannelId);
                            const panelEmbed = new EmbedBuilder()
                                .setTitle(setupData.embedConfig.title)
                                .setDescription(setupData.embedConfig.description)
                                .setColor(purple)
                                .setFooter({
                                    text: setupData.embedConfig.footer ? setupData.embedConfig.footer : 'Ticket',
                                    iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
                                });

                            if (setupData.embedConfig.image) panelEmbed.setImage(setupData.embedConfig.image);
                            if (setupData.embedConfig.thumbnail) panelEmbed.setThumbnail(setupData.embedConfig.thumbnail);
                            if (setupData.embedConfig.color) panelEmbed.setColor(setupData.embedConfig.color);
                            
                            const ticketButtons = [];
                            for (const button of setupData.button) {
                                const ticketButtonCustomId = `create_ticket_${button.customId}`;
                                const ticketButton = new ButtonBuilder()
                                    .setCustomId(ticketButtonCustomId)
                                    .setLabel(button.label)
                                    .setStyle(ButtonStyle[button.style]);
                                if (button.emoji) ticketButton.setEmoji(button.emoji);
                                ticketButtons.push(ticketButton);
                            }
                            const finalRow = new ActionRowBuilder().addComponents(ticketButtons);

                            await channel.send({
                                embeds: [panelEmbed],
                                components: [finalRow]
                            });

                            await i.editReply({ content: 'Bảng ticket đã được gửi, nhấn vào Design Button để thêm nút Ticket', flags: MessageFlags.Ephemeral });
                        });
                        break;
                }
            })
        }
    }
};
