const { EmbedBuilder, Collection } = require("discord.js");
const User = require("../../models/user.model.js"); // Đường dẫn tới User model của bạn
const { incBalance } = require("../../helpers/userHelper.js"); // Import hàm tăng số dư
const {prefix} = require('../../config.json');
const { success, danger } = require('../../color.json');

function getRandomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const COOLDOWN_TIME = 15 * 60 * 1000; // 15 phút (tính bằng milliseconds)
const EARN_AMOUNT = getRandomInteger(8000,20000); // Số tiền kiếm được mỗi lần dùng lệnh job

module.exports = {
    cooldown: COOLDOWN_TIME,
    category: 'Casino',
    name: "job",
    aliases: ["work", "lamviec"],
    description: "Làm việc và kiếm tiền",
    run: async (client, message, args) => {
        const playerUsername = message.author.username;
        const playerAvatarURL = message.author.displayAvatarURL({ dynamic: true });
        const userID = message.author.id;

        try {
            // Kiểm tra xem người dùng đã có tài khoản casino chưa
            const userData = await User.findOne({ userId: userID });
            if (!userData) {
                const embed = new EmbedBuilder()
                    .setColor(danger)
                    .setDescription(
                        `Bạn chưa có tài khoản Casino. Dùng lệnh \`${prefix}start\` để tạo tài khoản.`
                    )
                    .setFooter({
                        text: `Người gửi: ${playerUsername}`,
                        iconURL: playerAvatarURL,
                    });
                return await message.channel.send({ embeds: [embed] });
            }

            // Tăng số dư cho người dùng
            await incBalance(userID, EARN_AMOUNT);

            // Gửi embed thông báo thành công
            const successEmbed = new EmbedBuilder()
                .setColor(success) // Màu xanh lá cây cho thành công
                .setTitle("💰 Công việc hoàn thành!")
                .setDescription(
                    `Bạn đã làm việc chăm chỉ và kiếm được **$${new Intl.NumberFormat(
                        "en"
                    ).format(EARN_AMOUNT)}**.`
                )
                .addFields(
                    {
                        name: "Số dư hiện tại",
                        value: `$${new Intl.NumberFormat("en").format(userData.balance + EARN_AMOUNT)}`,
                        inline: true,
                    }
                )
                .setFooter({
                    text: `Người gửi: ${playerUsername}`,
                    iconURL: playerAvatarURL,
                });

            await message.channel.send({ embeds: [successEmbed] });

        } catch (error) {
            console.error("Có lỗi ở lệnh job:", error);
            const errorEmbed = new EmbedBuilder()
                .setColor(danger)
                .setDescription("Có lỗi xảy ra khi thực hiện lệnh job. Vui lòng liên hệ với admin.");
            await message.channel.send({ embeds: [errorEmbed] });
        }
    },
};