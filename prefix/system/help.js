const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { primary } = require('../../color.json'); // Đảm bảo đường dẫn đúng
const { prefix } = require("../../config.json");

module.exports = {
    cooldown: 3000,
    name: 'help',
    aliases: ['h'], // Các biệt danh cho lệnh
    description: 'Hiển thị danh sách tất cả các lệnh của bot',
    category: 'System', // Category cho lệnh help này. Đảm bảo nó KHÔNG nằm trong danh sách ẩn.
    run: async(client, message, args) => {
        const commands = client.prefix; // <-- THAY ĐỔI TẠI ĐÂY
        const actualPrefix = prefix || ',';

        // Nhóm các lệnh theo category, loại trừ 'Admin'
        const categorizedCommands = new Map();
        commands.forEach(command => {
            // Kiểm tra xem lệnh có các thuộc tính cần thiết và không thuộc category 'Admin' không
            // LƯU Ý: Mỗi lệnh prefix của bạn cũng cần có thuộc tính 'category'
            if (command.name && command.description && command.category && command.category !== 'Admin') {
                if (!categorizedCommands.has(command.category)) {
                    categorizedCommands.set(command.category, []);
                }
                categorizedCommands.get(command.category).push(command);
            }
        });

        const categories = Array.from(categorizedCommands.keys());
        if (categories.length === 0) {
            const noCommandsEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription('Hiện tại không có lệnh nào được phân loại hoặc hiển thị.');
            return message.channel.send({ embeds: [noCommandsEmbed] });
        }

        // Sắp xếp các category theo thứ tự mong muốn (ví dụ: theo bảng chữ cái)
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
                // Sử dụng command.aliases nếu có, ngược lại là rỗng
                let aliases = cmd.aliases && cmd.aliases.length > 0 ? ` (Alias: \`${cmd.aliases.join('`, `')}\`)` : '';
                let usage = cmd.usage && cmd.usage.length > 0 ? ` ${cmd.usage}` : '';
                return `\`${actualPrefix}${cmd.name}${usage}\`${aliases} - ${cmd.description}`;
            }).join('\n');

            embed.addFields({
                name: 'Các lệnh có sẵn:',
                value: commandList.length > 0 ? commandList : 'Không có lệnh nào trong danh mục này.',
                inline: false
            });

            const notices = [
                '<bet>: Số tiền cược',
                '<amount>: Số tiền',
                '<user>: Tag người chơi'
            ];
            const noticeList = notices.map(note => {
                return `\`${note}\``;
            }).join('\n');

            embed.addFields({
                name: 'Chú thích:',
                value: noticeList.length > 0 ? noticeList : 'Không có chú thích',
                inline: false
            });
            

            embed.setFooter({ text: `Yêu cầu bởi: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
            return embed;
        };

        // Hàm tạo hàng nút cho tất cả các category
        const createCategoryRows = (currentSelectedCategory) => {
            const rows = [];
            let currentRow = new ActionRowBuilder();
            let buttonCount = 0;

            for (const category of categories) {
                // Discord giới hạn 5 nút trên mỗi ActionRow
                if (buttonCount === 5) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                    buttonCount = 0;
                }

                currentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`help_category_${category}`) // Custom ID đặc trưng cho từng category
                        .setLabel(category)
                        .setStyle(category === currentSelectedCategory ? ButtonStyle.Success : ButtonStyle.Secondary) // Nút của category đang chọn sẽ có màu khác
                );
                buttonCount++;
            }
            // Thêm hàng cuối cùng nếu còn nút
            if (currentRow.components.length > 0) {
                rows.push(currentRow);
            }
            return rows;
        };

        // Gửi phản hồi ban đầu với category đầu tiên và các nút
        const initialEmbed = createHelpEmbed(currentCategory);
        const initialRows = createCategoryRows(currentCategory);

        const response = await message.channel.send({
            embeds: [initialEmbed],
            components: initialRows,
        });

        // Tạo Collector để lắng nghe tương tác nút
        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id && i.customId.startsWith('help_category_'), // Chỉ người dùng gốc và nút category
            time: 300000 // Collector sẽ hết hạn sau 5 phút
        });

        collector.on('collect', async i => {
            const selectedCategory = i.customId.replace('help_category_', ''); // Lấy tên category từ custom ID

            // Đảm bảo người dùng không thể bấm vào một nút 'Admin' giả mạo nếu có
            if (selectedCategory === 'Admin') {
                await i.deferUpdate(); // Defer update để tránh lỗi
                return; // Bỏ qua nếu người dùng cố gắng chọn category Admin
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
            const disabledRows = createCategoryRows(currentCategory); // Tạo lại hàng nút
            disabledRows.forEach(row => {
                row.components.forEach(button => button.setDisabled(true));
            });

            try {
                // Kiểm tra xem tin nhắn có còn tồn tại không trước khi chỉnh sửa
                await response.edit({ components: disabledRows });
            } catch (error) {
                console.error("Lỗi khi vô hiệu hóa nút help (prefix):", error);
            }
        });
    }
};