const User = require('../../models/user.model.js');
const { EmbedBuilder } = require("discord.js");
const { primary } = require("../../color.json"); // Đảm bảo đường dẫn đúng

module.exports = {
    cooldown: 3000,
    category: 'System',
    name: 'start', // Tên lệnh
    aliases: ['dangky', 'register'], // Các biệt danh cho lệnh
    description: 'Tạo tài khoản casino', // Mô tả lệnh
    run: async(client, message, args) => { // Thay đổi từ execute(interaction) sang run(client, message, args)
        const userId = message.author.id; // Lấy userId từ message.author
        const username = message.author.username; // Lấy username từ message.author

        // Lấy thông tin người gọi lệnh cho footer
        const playerUsername = message.author.username;
        const playerAvatarURL = message.author.displayAvatarURL({ dynamic: true });

        try {
            const userDB = await User.findOne({userId});
            
            if (userDB){
                const embedExists = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Bạn đã có tài khoản Casino rồi!`)
                    .setFooter({ text: `Người gửi: ${playerUsername}`, iconURL: playerAvatarURL });
                // Trong prefix command, không có flags: MessageFlags.Ephemeral
                // Tin nhắn sẽ hiển thị công khai.
                return await message.channel.send({embeds: [embedExists]});
            } else {
                await User.create({
                    userId: userId,
                    username: username, // Lưu username hiện tại
                    balance: 100 // Số tiền khởi tạo
                });

                const embedSuccess = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Tạo tài khoản Casino thành công ✨\nBạn được tặng **$100** để bắt đầu!`) // Thêm thông tin về tiền khởi tạo
                    .setFooter({ text: `Người gửi: ${playerUsername}`, iconURL: playerAvatarURL });
                return await message.channel.send({embeds: [embedSuccess]});
            }
        } catch (error) {
            console.error('Lỗi ở start command (prefix): ', error);
            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại sau.`)
                .setFooter({ text: `Người gửi: ${playerUsername}`, iconURL: playerAvatarURL });
            return await message.channel.send({embeds: [errorEmbed]});
        }
    }
};