const { EmbedBuilder } = require("discord.js");
const User = require("../../models/user.model.js"); // Đường dẫn tới User model của bạn
const { incBalance, decBalance } = require("../../helpers/userHelper.js"); // Import hàm tăng/giảm số dư
const { prefix } = require("../../config.json");
const { success, danger } = require("../../color.json");
const { getRandomInt, convertInt } = require("../../helpers/utility.js");

// Thêm giới hạn tiền cược tối đa ở đây
const MAX_BET_AMOUNT = 300000;

module.exports = {
    cooldown: 5000,
    category: "Casino",
    name: "coinflip",
    aliases: ["cf", "latdongxu"],
    description: "Lật đồng xu head/tail",
    usage: "<bet> <h/t>", // Hướng dẫn sử dụng lệnh
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
                    .setDescription(
                        `Vui lòng nhập số tiền cược hợp lệ (phải là số dương) hoặc 'all'.`
                    );
                return await message.channel.send({ embeds: [embed] });
            }
            // ---------------------------------------------

            // Kiểm tra giới hạn tiền cược tối đa
            if (betAmount > MAX_BET_AMOUNT) {
                betAmount = MAX_BET_AMOUNT; // Đặt lại số tiền cược về mức tối đa
            }

            // Kiểm tra xem người chơi có đủ tiền để đặt cược không
            if (userData.balance < betAmount) {
                return await message.channel.send({ content: `Bạn không đủ tiền để cược <:23265kotek:1387483381180272650>` });
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
                playerChoice = "head";
            }

            // Giảm số dư của người chơi ngay lập tức (tiền đã được đặt cược)
            await decBalance(userID, betAmount);
            userData.balance -= betAmount;

            const responseMsg = await message.channel.send(
                `**${playerUsername}** cược **$${convertInt(
                    betAmount
                )}** vào **${playerChoice}**\nĐồng xu đang được tung... <a:coinflip:1387476414412099704>`
            );
            setTimeout(async () => {
                const coinResult = Math.random() < 0.5 ? "head" : "tail"; // 50% head, 50% tail
                let resultText = "";
                let resultBal = 0;
                let emoji = "";
                let win = playerChoice === coinResult;
                if (win) {
                    resultText = "__Thắng__ rồi nè senpai~";
                    resultBal = betAmount * 2;
                    emoji = '<:catsmile:1387485175352660169>';
                    await incBalance(userID, resultBal);
                } else {
                    resultText = "__Thua__ sạch rồi ní ơi";
                    emoji = "<:catmeu:1387483381180272650>";
                }

                await responseMsg.edit({
                    content: `**${playerUsername}** cược **$${convertInt(
                        betAmount
                    )}** vào **${playerChoice}**\nĐồng xu ra **${coinResult}** <:coin:1387481402395594813> - ${resultText}${win ? ` **$${convertInt(resultBal)}** ` : ' '}${emoji}`,
                });
            }, getRandomInt(1800, 3000));
        } catch (error) {
            console.error("Có lỗi ở lệnh coinflip:", error);
            const errorEmbed = new EmbedBuilder()
                .setColor(danger)
                .setDescription(
                    "Có lỗi xảy ra khi thực hiện lệnh coinflip. Vui lòng liên hệ với admin."
                );
            await message.channel.send({ embeds: [errorEmbed] });
        }
    },
};
