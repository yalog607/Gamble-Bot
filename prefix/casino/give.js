const User = require('../../models/user.model.js');
const { EmbedBuilder } = require("discord.js");
const { primary } = require('../../color.json'); // Đảm bảo đường dẫn đúng
const { prefix } = require('../../config.json');

module.exports = {
    cooldown: 3000,
    category: 'Casino',
    name: 'give', // Tên lệnh
    aliases: ['pay', 'chuyen'], // Các biệt danh cho lệnh
    description: 'Chuyển tiền cho người khác', // Mô tả lệnh
    run: async(client, message, args) => { // Thay đổi từ execute(interaction) sang run(client, message, args)
        const sender = message.author; // Người gửi là tác giả tin nhắn
        
        // Cần parse args để lấy người nhận và số tiền
        // args[0] sẽ là người nhận (mention hoặc ID)
        // args[1] sẽ là số tiền
        
        // Lấy người nhận từ args[0]
        let recipent = message.mentions.users.first(); // Ưu tiên mention
        if (!recipent && args[0]) {
            // Nếu không có mention, thử tìm theo ID
            recipent = await client.users.fetch(args[0]).catch(() => null);
        }

        // Kiểm tra xem có người nhận hợp lệ không
        if (!recipent) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`Vui lòng đề cập người nhận hoặc cung cấp ID hợp lệ.`)
                .setFooter({ text: `Người gửi: ${sender.username}`, iconURL: sender.displayAvatarURL({ dynamic: true }) });
            return await message.channel.send({embeds: [embed]});
        }

        // Kiểm tra người gửi và người nhận có phải là cùng một người không
        if (sender.id === recipent.id) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`Bạn không thể tự chuyển tiền cho chính mình!`)
                .setFooter({ text: `Người gửi: ${sender.username}`, iconURL: sender.displayAvatarURL({ dynamic: true }) });
            return await message.channel.send({embeds: [embed]});
        }

        const amount = parseInt(args[1]); // Số tiền từ args[1]

        // Kiểm tra số tiền hợp lệ
        if (isNaN(amount) || amount <= 0) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`Vui lòng nhập số tiền hợp lệ để chuyển (phải lớn hơn 0).`)
                .setFooter({ text: `Người gửi: ${sender.username}`, iconURL: sender.displayAvatarURL({ dynamic: true }) });
            return await message.channel.send({embeds: [embed]});
        }

        try {
            const senderDB = await User.findOne({userId: sender.id});
            const recipentDB = await User.findOne({userId: recipent.id});

            // Lấy thông tin người gửi/người nhận cho footer
            const senderUsername = sender.username;
            const senderAvatarURL = sender.displayAvatarURL({ dynamic: true });
            const recipentUsername = recipent.username;
            const recipentAvatarURL = recipent.displayAvatarURL({ dynamic: true });

            if (!senderDB) {
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Bạn chưa có tài khoản Casino.\nDùng lệnh \`\`\`${prefix}start\`\`\` để tạo tài khoản.`)
                    .setFooter({ text: `Người gửi: ${senderUsername}`, iconURL: senderAvatarURL });
                return await message.channel.send({embeds: [embed]});
            }
            if (!recipentDB) {
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Người nhận \`${recipentUsername}\` chưa có tài khoản Casino.\nHọ cần dùng lệnh \`\`\`${prefix}start\`\`\` để tạo tài khoản.`)
                    .setFooter({ text: `Người gửi: ${senderUsername}`, iconURL: senderAvatarURL });
                return await message.channel.send({embeds: [embed]});
            }

            if (senderDB.balance < amount) {
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Bạn không đủ tiền để chuyển. Bạn có: **$${new Intl.NumberFormat("en").format(senderDB.balance)}**`)
                    .setFooter({ text: `Người gửi: ${senderUsername}`, iconURL: senderAvatarURL });
                return await message.channel.send({embeds: [embed]});
            }
            
            senderDB.balance -= amount;
            recipentDB.balance += amount;
            await senderDB.save();
            await recipentDB.save();

            const embed = new EmbedBuilder()
                .setColor(primary)
                .setDescription(`Chuyển thành công **$${new Intl.NumberFormat("en").format(amount)}** cho \`${recipentUsername}\`.`)
                .setFooter({ text: `Người gửi: ${senderUsername}`, iconURL: senderAvatarURL });
            return await message.channel.send({embeds: [embed]});
        } catch (error) {
            console.error('Có lỗi trong give command (prefix):', error); 
            const senderUsername = sender.username;
            const senderAvatarURL = sender.displayAvatarURL({ dynamic: true });

            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`Có lỗi xảy ra khi chuyển tiền. Vui lòng thử lại sau.`)
                .setFooter({ text: `Người gửi: ${senderUsername}`, iconURL: senderAvatarURL });
            return await message.channel.send({embeds: [errorEmbed]});
        }
    }
};