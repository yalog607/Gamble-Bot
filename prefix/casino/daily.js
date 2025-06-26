const User = require('../../models/user.model.js');
const Daily = require('../../models/cooldowndaily.model.js'); // Đảm bảo đường dẫn đúng
const { EmbedBuilder } = require("discord.js");
const { prefix } = require('../../config.json');
const { checkCoolDown } = require('../../helpers/utility.js');
function getRandomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    cooldown: 3000,
    category: 'Casino',
    name: 'daily', // Tên lệnh
    description: 'Nhận tiền thưởng hằng ngày', // Mô tả lệnh
    run: async(client, message, args) => { // Thay đổi từ execute(interaction) sang run(client, message, args)
        try {
            const userId = message.author.id; // Lấy userId từ message.author
            const playerUsername = message.author.username;
            const playerAvatarURL = message.author.displayAvatarURL({ dynamic: true });

            const user = await User.findOne({
                userId: userId
            });

            if (!user) {
                return await message.reply(`Bạn chưa có tài khoản Casino. Dùng lệnh \`\`\`${prefix}start\`\`\` để tạo tài khoản.`); // Trả lời nhanh
            }

            const timeCooldown = 24 * 60 * 60 * 1000;
            const checkTimeLeft = await checkCoolDown(userId, Daily, timeCooldown);
            if (!checkTimeLeft.status) {
                const timeLeft = `**${checkTimeLeft.timeLeft.hours}** tiếng, **${checkTimeLeft.timeLeft.minutes}** phút`;
                return await message.reply(`Bạn đã nhận thưởng hôm nay. Hãy đợi thêm ${timeLeft} nữa.`);
            }
            
            const dailyCoins = getRandomInteger(3000, 5000); // Đảm bảo min, max là số nguyên
            user.balance += dailyCoins;
            await user.save();
            
            return await message.channel.send(`**${playerUsername}** | Nhận thưởng hằng ngày thành công **$${new Intl.NumberFormat("en").format(dailyCoins)}** 💵`); // Trả lời nhanh
        } catch (error) {
            console.error('Có lỗi trong daily command (prefix):', error); // Log lỗi chi tiết hơn
            const playerUsername = message.author.username;
            const playerAvatarURL = message.author.displayAvatarURL({ dynamic: true });

            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`Có lỗi xảy ra khi nhận thưởng hằng ngày. Vui lòng thử lại sau.`)
                .setFooter({ text: `Người gửi: ${playerUsername}`, iconURL: playerAvatarURL });
            return await message.channel.send({embeds: [errorEmbed]}); // Trả lời nhanh với lỗi
        }
    }
};