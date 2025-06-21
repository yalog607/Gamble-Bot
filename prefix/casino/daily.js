const User = require('../../models/user.model.js');
const Daily = require('../../models/cooldowndaily.model.js'); // Đảm bảo đường dẫn đúng
const { EmbedBuilder } = require("discord.js");
const { primary } = require('../../color.json'); // Đảm bảo đường dẫn đúng và color.json tồn tại

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
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Bạn chưa có tài khoản Casino. Dùng lệnh \`\`\`${client.prefix}start\`\`\` để tạo tài khoản.`) // Sử dụng client.prefix
                    .setFooter({ text: `Người gửi: ${playerUsername}`, iconURL: playerAvatarURL });
                return await message.channel.send({embeds: [embed]}); // Trả lời nhanh
            }

            let cooldown = await Daily.findOne({
                userId: userId
            });

            if (cooldown && cooldown.cooldownExpiration > Date.now()){
                const remainingTime =  cooldown.cooldownExpiration - Date.now();
                const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);

                const timeLeft = `**${hours}** tiếng, **${minutes}** phút`;
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Bạn đã nhận thưởng hôm nay.\nHãy đợi thêm ${timeLeft} nữa.`)
                    .setFooter({ text: `Người gửi: ${playerUsername}`, iconURL: playerAvatarURL });
                return await message.channel.send({embeds: [embed]}); // Trả lời nhanh
            }
            
            const dailyCoins = getRandomInteger(3000, 5000); // Đảm bảo min, max là số nguyên
            user.balance += dailyCoins;
            await user.save();
            
            const newDaily = {
                userId: userId,
                cooldownExpiration: Date.now() + 24 * 60 * 60 * 1000 // 24 giờ sau
            };

            // Tìm và cập nhật hoặc tạo mới bản ghi cooldown
            cooldown = await Daily.findOneAndUpdate(
                {userId: userId},
                newDaily,
                { upsert: true, new: true } // upsert: tạo nếu không tìm thấy, new: trả về tài liệu đã cập nhật
            );

            const embed = new EmbedBuilder()
                .setColor(primary)
                .setDescription(`Nhận thưởng thành công **$${new Intl.NumberFormat("en").format(dailyCoins)}**`)
                .setFooter({ text: `Người gửi: ${playerUsername}`, iconURL: playerAvatarURL });
            return await message.channel.send({embeds: [embed]}); // Trả lời nhanh
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