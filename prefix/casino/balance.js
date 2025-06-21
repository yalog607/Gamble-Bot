const User = require('../../models/user.model.js');
const { EmbedBuilder } = require("discord.js");
const { primary } = require('../../color.json'); // Assuming color.json exists and exports 'primary'

module.exports = {
    cooldown: 3000,
    category: 'Casino',
    name: 'balance', // Tên lệnh
    aliases: ['bal', 'money', 'tien'], // Các biệt danh cho lệnh
    description: 'Kiểm tra số tiền trong tài khoản Casino', // Mô tả lệnh
    run: async(client, message, args) => { // Thay đổi từ execute(interaction) sang run(client, message, args)
        const userId = message.author.id; // Lấy userId từ message.author
        const userCasino = await User.findOne({userId});

        // Lấy thông tin người dùng cho footer (nếu cần, nhưng thường balance command không có footer)
        const playerUsername = message.author.username;
        const playerAvatarURL = message.author.displayAvatarURL({ dynamic: true });

        if (!userCasino){
            const embed = new EmbedBuilder()
                .setColor(primary)
                .setDescription(`Bạn chưa có tài khoản Casino. Dùng lệnh \`\`\`${client.prefix}start\`\`\` để tạo tài khoản.`) // Sử dụng client.prefix
                .setFooter({ text: `Người chơi: ${playerUsername}`, iconURL: playerAvatarURL }); // Thêm footer để nhất quán
            return await message.channel.send({embeds: [embed]}); 
        }
        try {
            const embed = new EmbedBuilder()
                .setColor(primary)
                .setDescription(`Số tiền hiện tại: **$${new Intl.NumberFormat("en").format(userCasino.balance)}**`)
                .setFooter({ text: `Người chơi: ${playerUsername}`, iconURL: playerAvatarURL }); // Thêm footer để nhất quán
            return await message.channel.send({embeds: [embed]}); // Sử dụng message.channel.send để trả lời
        } catch (error) {
            console.error('Error in balance command (prefix):', error);
            // Thông báo lỗi nếu không gửi được tin nhắn
            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription('Không thể kiểm tra số dư. Có lỗi xảy ra. Vui lòng thử lại sau.')
                .setFooter({ text: `Người chơi: ${playerUsername}`, iconURL: playerAvatarURL });
            return await message.channel.send({embeds: [errorEmbed]});
        }
    }
};