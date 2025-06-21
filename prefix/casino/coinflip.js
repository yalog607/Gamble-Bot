const { EmbedBuilder } = require("discord.js");
const User = require("../../models/user.model.js"); // Đường dẫn tới User model của bạn
const { incBalance, decBalance } = require("../../helpers/userHelper.js"); // Import hàm tăng/giảm số dư
const { prefix } = require('../../config.json');
const { success, danger } = require('../../color.json');

// Thêm giới hạn tiền cược tối đa ở đây
const MAX_BET_AMOUNT = 300000;

function getRandomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    cooldown: 5000,
    category: 'Casino',
    name: "coinflip",
    aliases: ["cf", "latdongxu"],
    description: "Lật đồng xu head/tail (hoặc h/t)",
    usage: "<số tiền | all> <head/tail/h/t>", // Hướng dẫn sử dụng lệnh
    run: async (client, message, args) => {
        const playerUsername = message.author.username;
        const playerAvatarURL = message.author.displayAvatarURL({ dynamic: true }); // Đã sửa lỗi chính tả ở đây
        const userID = message.author.id;

        try {
            // Kiểm tra xem người dùng đã có tài khoản casino chưa
            const userData = await User.findOne({ userId: userID });
            if (!userData) {
                const embed = new EmbedBuilder()
                    .setColor(danger)
                    .setDescription(
                        `Bạn chưa có tài khoản Casino. Dùng lệnh \`${client.prefix}start\` để tạo tài khoản.`
                    )
                    .setFooter({
                        text: `Người gửi: ${playerUsername}`,
                        iconURL: playerAvatarURL,
                    });
                return await message.channel.send({ embeds: [embed] });
            }

            // Lấy số tiền đặt cược từ args[0]
            let betAmountInput = args[0]?.toLowerCase(); // Chuyển về chữ thường để kiểm tra "all"
            let betAmount;

            // --- Xử lý logic "all" hoặc số tiền cụ thể ---
            if (betAmountInput === "all") {
                betAmount = userData.balance; // Đặt cược toàn bộ số tiền
            } else {
                betAmount = parseInt(betAmountInput); // Chuyển đổi sang số nguyên
            }

            if (isNaN(betAmount) || betAmount <= 0) {
                const embed = new EmbedBuilder()
                    .setColor(danger)
                    .setDescription(`Vui lòng nhập số tiền cược hợp lệ (phải là số dương) hoặc 'all'.`);
                return await message.channel.send({ embeds: [embed] });
            }
            // ---------------------------------------------

            // Kiểm tra giới hạn tiền cược tối đa
            if (betAmount > MAX_BET_AMOUNT) {
                betAmount = MAX_BET_AMOUNT; // Đặt lại số tiền cược về mức tối đa
            }

            // Kiểm tra xem người chơi có đủ tiền để đặt cược không
            if (userData.balance < betAmount) {
                const embed = new EmbedBuilder()
                    .setColor(danger)
                    .setDescription(`Bạn không đủ tiền để đặt cược **$${new Intl.NumberFormat("en").format(betAmount)}**. Số dư hiện tại của bạn là **$${new Intl.NumberFormat("en").format(userData.balance)}**.`);
                return await message.channel.send({ embeds: [embed] });
            }

            // Lấy lựa chọn của người chơi và chuẩn hóa nó
            let playerChoiceInput = args[1]?.toLowerCase();
            let playerChoice; // Biến này sẽ lưu 'head' hoặc 'tail' đã chuẩn hóa

            if (playerChoiceInput === "h") {
                playerChoice = "head";
            } else if (playerChoiceInput === "t") {
                playerChoice = "tail";
            } else if (playerChoiceInput === "head" || playerChoiceInput === "tail") {
                playerChoice = playerChoiceInput;
            } else {
                const embed = new EmbedBuilder()
                    .setColor(danger)
                    .setDescription(`Vui lòng chọn "head", "tail", "h", hoặc "t". Ví dụ: \`${prefix}cf 1000 h\``);
                return await message.channel.send({ embeds: [embed] });
            }

            // Giảm số dư của người chơi ngay lập tức (tiền đã được đặt cược)
            await decBalance(userID, betAmount);
            // Cập nhật userData.balance trong bộ nhớ để tính toán số dư hiện tại sau khi cược
            userData.balance -= betAmount; 

            // Tiến hành lật đồng xu
            const coinResult = Math.random() < 0.5 ? "head" : "tail"; // 50% head, 50% tail
            let winAmount = 0;
            let resultMessage = "";
            let embedColor = "";

            if (playerChoice === coinResult) {
                // Người chơi thắng
                winAmount = betAmount * 2; // Thắng gấp đôi số tiền cược
                await incBalance(userID, winAmount); // Tăng số dư
                resultMessage = `🎉 Chúc mừng! Đồng xu đã ra **${coinResult.toUpperCase()}** và bạn đã thắng **$${new Intl.NumberFormat("en").format(betAmount)}**!`;
                embedColor = success; // Màu xanh lá cây cho thắng
                userData.balance += winAmount; // Cập nhật số dư cuối cùng trong bộ nhớ
            } else {
                // Người chơi thua
                resultMessage = `💔 Rất tiếc! Đồng xu đã ra **${coinResult.toUpperCase()}** và bạn đã thua **$${new Intl.NumberFormat("en").format(betAmount)}**.`;
                embedColor = danger; // Màu đỏ cho thua
                // userData.balance đã được cập nhật khi đặt cược, không cần thay đổi thêm
            }

            // Gửi embed kết quả
            const resultEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle("🪙 Kết quả Coin Flip!")
                .setDescription(resultMessage)
                .addFields(
                    { name: "Bạn đã chọn", value: `\`${playerChoice.toUpperCase()}\``, inline: true },
                    { name: "Số tiền cược", value: `$${new Intl.NumberFormat("en").format(betAmount)}`, inline: true },
                    { name: "Số dư hiện tại", value: `$${new Intl.NumberFormat("en").format(userData.balance)}`, inline: true }
                )
                .setFooter({
                    text: `Người chơi: ${playerUsername}`,
                    iconURL: playerAvatarURL,
                });

            await message.channel.send({ embeds: [resultEmbed] });

        } catch (error) {
            console.error("Có lỗi ở lệnh coinflip:", error);
            const errorEmbed = new EmbedBuilder()
                .setColor(danger)
                .setDescription("Có lỗi xảy ra khi thực hiện lệnh coinflip. Vui lòng liên hệ với admin.");
            await message.channel.send({ embeds: [errorEmbed] });
        }
    },
};