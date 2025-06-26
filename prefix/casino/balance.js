const User = require('../../models/user.model.js');
const { EmbedBuilder } = require("discord.js");
const { primary } = require('../../color.json');
const { convertInt } = require('../../helpers/utility.js');

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
            return await message.reply({content: `**${playerUsername}** | Bạn chưa có tài khoản Casino. Dùng lệnh \`\`\`${client.prefix}start\`\`\` để tạo tài khoản.`}); 
        }
        try {
            return await message.channel.send({content: `💳 **${playerUsername}** | Số dư hiện tại của bạn là: **$${convertInt(userCasino.balance)}**`});
        } catch (error) {
            console.error('Error in balance command (prefix):', error);
            return await message.reply({content: `Không thể kiểm tra số dư. Có lỗi xảy ra. Vui lòng thử lại sau.`});
        }
    }
};