const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { primary } = require('../../color.json');
const { prefix } = require('../../config.json')

module.exports = {
    // Đây là cách định nghĩa lệnh slash command
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Hiển thị danh sách tất cả các lệnh của bot'),
    
    cooldown: 5, // Cooldown cho lệnh slash (tính bằng giây)
    category: 'System', // Category cho lệnh này.

    async execute(interaction) {
        const client = interaction.client;
        const allCommands = new Map();

        // Thu thập prefix commands
        if (client.prefix) { // Đảm bảo biến này tồn tại và chứa các lệnh prefix
            client.prefix.forEach(cmd => {
                allCommands.set(cmd.name, cmd);
            });
        }
        // Thu thập slash commands
        if (client.slashCommands) { // Đảm bảo biến này tồn tại và chứa các lệnh slash
            client.slashCommands.forEach(cmd => {
                // Kiểm tra nếu lệnh slash có cùng tên với lệnh prefix, ưu tiên slash
                if (!allCommands.has(cmd.data.name)) {
                     allCommands.set(cmd.data.name, {
                        name: cmd.data.name,
                        description: cmd.data.description,
                        category: cmd.category || 'Unknown', // Lệnh slash cũng cần category
                        aliases: [] // Slash commands không có aliases
                    });
                }
            });
        }

        if (allCommands.size === 0) {
            const noCommandsEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription('Hiện tại không có lệnh nào được đăng ký.');
            return await interaction.reply({ embeds: [noCommandsEmbed], flags: MessageFlags.Ephemeral}); // ephemeral để chỉ người dùng thấy
        }

        // Nhóm các lệnh theo category, loại trừ 'Admin' và các lệnh không có mô tả/category
        const categorizedCommands = new Map();
        allCommands.forEach(command => {
            // Kiểm tra xem lệnh có các thuộc tính cần thiết và không thuộc category 'Admin'
            const cmdName = command.name || (command.data && command.data.name);
            const cmdDescription = command.description || (command.data && command.data.description);
            const cmdCategory = command.category || (command.data && command.data.category); // Giả định lệnh slash cũng có category

            if (cmdName && cmdDescription && cmdCategory && cmdCategory !== 'Admin') {
                if (!categorizedCommands.has(cmdCategory)) {
                    categorizedCommands.set(cmdCategory, []);
                }
                categorizedCommands.get(cmdCategory).push({
                    name: cmdName,
                    description: cmdDescription,
                    aliases: command.aliases || [] // Slash commands sẽ có aliases rỗng
                });
            }
        });

        const categories = Array.from(categorizedCommands.keys());
        if (categories.length === 0) {
            const noCommandsEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription('Hiện tại không có lệnh nào được phân loại hoặc hiển thị (sau khi lọc).');
            return await interaction.reply({ embeds: [noCommandsEmbed], flags: MessageFlags.Ephemeral});
        }

        // Sắp xếp các category theo thứ tự mong muốn
        categories.sort();

        let currentCategory = categories[0]; // Mặc định hiển thị category đầu tiên

        // Hàm tạo Embed cho category hiện tại
        const createHelpEmbed = (categoryName) => {
            const cmds = categorizedCommands.get(categoryName);

            const embed = new EmbedBuilder()
                .setColor(primary)
                .setTitle(`📚 Lệnh Bot - ${categoryName} 📚`)
                .setDescription(`Sử dụng các nút bên dưới để xem lệnh của từng danh mục.\n\n`);

            const commandList = cmds.map(cmd => {
                // Với slash commands, không có prefix hoặc aliases hiển thị trực tiếp
                // Cần phân biệt rõ giữa prefix và slash command nếu muốn hiển thị khác nhau
                let commandIdentifier;
                if (client.prefix && client.prefix.has(cmd.name)) { // Là prefix command
                    commandIdentifier = `\`${prefix || ','}${cmd.name}\``;
                    const aliases = cmd.aliases && cmd.aliases.length > 0 ? ` (Alias: \`${cmd.aliases.join('`, `')}\`)` : '';
                    return `${commandIdentifier}${aliases} - ${cmd.description}`;
                } else if (client.slashCommands && client.slashCommands.has(cmd.name)) { // Là slash command
                     commandIdentifier = `\`/${cmd.name}\``; // Slash command
                     return `${commandIdentifier} - ${cmd.description}`;
                } else { // Trường hợp không xác định được loại lệnh
                    return `\`${cmd.name}\` - ${cmd.description}`;
                }
               
            }).join('\n');

            embed.addFields({
                name: 'Các lệnh có sẵn:',
                value: commandList.length > 0 ? commandList : 'Không có lệnh nào trong danh mục này.',
                inline: false
            });

            embed.setFooter({ text: `Yêu cầu bởi: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
            return embed;
        };

        // Hàm tạo hàng nút cho tất cả các category
        const createCategoryRows = (currentSelectedCategory) => {
            const rows = [];
            let currentRow = new ActionRowBuilder();
            let buttonCount = 0;

            for (const category of categories) {
                if (buttonCount === 5) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                    buttonCount = 0;
                }

                currentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`help_category_${category}_${interaction.user.id}`) // Thêm User ID vào customId để chỉ người dùng này có thể tương tác
                        .setLabel(category)
                        .setStyle(category === currentSelectedCategory ? ButtonStyle.Success : ButtonStyle.Secondary)
                );
                buttonCount++;
            }
            if (currentRow.components.length > 0) {
                rows.push(currentRow);
            }
            return rows;
        };

        // Gửi phản hồi ban đầu với category đầu tiên và các nút
        const initialEmbed = createHelpEmbed(currentCategory);
        const initialRows = createCategoryRows(currentCategory);

        // Sử dụng interaction.reply() để gửi phản hồi
        const response = await interaction.reply({
            embeds: [initialEmbed],
            components: initialRows,
            fetchReply: true // Để có thể lấy được tin nhắn đã gửi và tạo collector
        });

        // Tạo Collector để lắng nghe tương tác nút
        const collector = response.createMessageComponentCollector({
            // Filter: i.customId phải bắt đầu bằng 'help_category_' VÀ chứa User ID của người dùng ban đầu
            filter: i => i.customId.startsWith('help_category_') && i.customId.endsWith(`_${interaction.user.id}`),
            time: 300000 // Collector sẽ hết hạn sau 5 phút
        });

        collector.on('collect', async i => {
            // Lấy category từ customId, loại bỏ phần 'help_category_' và User ID
            const selectedCategory = i.customId.replace(`help_category_`, '').replace(`_${interaction.user.id}`, ''); 

            if (selectedCategory === 'Admin') {
                await i.deferUpdate(); 
                return; 
            }

            currentCategory = selectedCategory;

            const updatedEmbed = createHelpEmbed(currentCategory);
            const updatedRows = createCategoryRows(currentCategory);

            await i.update({ // Sử dụng i.update() để cập nhật tin nhắn hiện có
                embeds: [updatedEmbed],
                components: updatedRows
            });
        });

        collector.on('end', async () => {
            // Khi collector kết thúc, vô hiệu hóa tất cả các nút
            const disabledRows = createCategoryRows(currentCategory); 
            disabledRows.forEach(row => {
                row.components.forEach(button => button.setDisabled(true));
            });

            try {
                // Kiểm tra xem tin nhắn có còn tồn tại không trước khi chỉnh sửa
                await interaction.editReply({ components: disabledRows });
            } catch (error) {
                console.error("Lỗi khi vô hiệu hóa nút help (slash):", error);
            }
        });
    }
};