const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require("discord.js");
const User = require("../../models/user.model.js"); // Đường dẫn tới User model của bạn
const { incBalance, decBalance } = require("../../helpers/userHelper.js"); // Import hàm tăng/giảm số dư
const { prefix } = require('../../config.json');
const { success, danger, purple } = require('../../color.json');
const { convertInt } = require('../../helpers/utility.js');

// Cấu hình trò chơi
const MAX_BET_AMOUNT = 300000; // Giới hạn tiền cược tối đa
const WIN_MULTIPLIER = 2.5;    // Hệ số nhân tiền thắng (đặt 100 thắng 300)

// Emojis và hình ảnh
const CUP_EMOJI = '🪣'; // Emoji cốc đỏ
const BALL_EMOJI = '⚪'; // Emoji quả bóng trắng
const COIN_EMOJI = '🪙'; // Emoji đồng tiền (hoặc thay bằng emoji custom của bạn)

// Collection để theo dõi game đang diễn ra của user, ngăn spam
const activeGames = new Collection(); 

// Hàm lấy số nguyên ngẫu nhiên
function getRandomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    // Cooldown cho lệnh prefix (nếu bạn có hệ thống cooldown chung cho các lệnh)
    cooldown: 5000, 
    category: 'Casino',
    name: "cups",
    aliases: ["cup"],
    description: "Đoán vị trí của quả bóng trong 3 chiếc cốc",
    usage: "<bet>", 
    run: async (client, message, args) => {
        const playerUsername = message.author.username;
        const playerAvatarURL = message.author.displayAvatarURL({ dynamic: true });
        const userID = message.author.id;

        // Kiểm tra xem người dùng đang có một game cups khác đang diễn ra không
        if (activeGames.has(userID)) {
            const embed = new EmbedBuilder()
                .setColor(danger)
                .setDescription(`Bạn đang có một trò chơi \`cups\` khác đang diễn ra. Vui lòng hoàn thành hoặc đợi trò chơi đó kết thúc.`);
            return await message.channel.send({ embeds: [embed] });
        }

        try {
            // Kiểm tra xem người dùng đã có tài khoản casino chưa
            const userData = await User.findOne({ userId: userID });
            if (!userData) {
                const embed = new EmbedBuilder()
                    .setColor(danger)
                    .setDescription(`Bạn chưa có tài khoản Casino. Dùng lệnh \`${prefix}start\` để tạo tài khoản.`)
                    .setFooter({ text: `Người gửi: ${playerUsername}`, iconURL: playerAvatarURL });
                return await message.channel.send({ embeds: [embed] });
            }

            // --- Xử lý số tiền cược ---
            let betAmountInput = args[0]?.toLowerCase();
            let betAmount;

            if (betAmountInput === "all") {
                betAmount = userData.balance; 
            } else {
                betAmount = parseInt(betAmountInput); 
            }

            if (isNaN(betAmount) || betAmount <= 0) {
                const embed = new EmbedBuilder()
                    .setColor(danger)
                    .setDescription(`Vui lòng nhập số tiền cược hợp lệ (phải là số dương) hoặc 'all'. Ví dụ: \`${prefix}cups 1000\``);
                return await message.channel.send({ embeds: [embed] });
            }

            // Giới hạn số tiền cược tối đa
            if (betAmount > MAX_BET_AMOUNT) {
                betAmount = MAX_BET_AMOUNT;
            }

            // Kiểm tra đủ tiền
            if (userData.balance < betAmount) {
                const embed = new EmbedBuilder()
                    .setColor(danger)
                    .setDescription(`Bạn không đủ tiền để đặt cược **$${convertInt(betAmount)}** ${COIN_EMOJI}. Số dư hiện tại của bạn là **${convertInt(userData.balance)}** ${COIN_EMOJI}.`);
                return await message.channel.send({ embeds: [embed] });
            }

            // --- Trừ tiền cược của người chơi ngay lập tức ---
            await decBalance(userID, betAmount);
            userData.balance -= betAmount; // Cập nhật số dư trong bộ nhớ cho hiển thị

            // Đánh dấu người dùng đang trong một trò chơi cups
            activeGames.set(userID, true);

            // Vị trí bóng ngẫu nhiên (lưu ý: vị trí 0, 1, 2 để dễ làm việc với mảng)
            const ballPositionIndex = getRandomInteger(0, 2); 

            // Xây dựng hàng nút lựa chọn
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        // Đúng customId: `gameType_action_chosenValue_userID_ballPosition_betAmount`
                        // Example: `cups_choice_1_123456789_0_100`
                        .setCustomId(`cups_choice_1_${userID}_${ballPositionIndex}_${betAmount}`) 
                        .setLabel('1')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`cups_choice_2_${userID}_${ballPositionIndex}_${betAmount}`)
                        .setLabel('2')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`cups_choice_3_${userID}_${ballPositionIndex}_${betAmount}`)
                        .setLabel('3')
                        .setStyle(ButtonStyle.Primary),
                );

            // Gửi embed ban đầu để người chơi chọn cốc
            const initialCupsDisplay = Array(3).fill(CUP_EMOJI).join(' '); 

            const initialEmbed = new EmbedBuilder()
                .setColor(purple) // Màu tím/xám như trong hình
                .setTitle("Cups")
                .setDescription(
                    `**Chọn 1 chiếc cốc**\n` +
                    `\n` +
                    `${initialCupsDisplay}\n\n` + 
                    `Bạn đã cược **$${convertInt(betAmount)}** ${COIN_EMOJI}`
                )
                .setFooter({
                    text: `Người chơi: ${playerUsername}`,
                    iconURL: playerAvatarURL,
                });

            const sentMessage = await message.channel.send({
                embeds: [initialEmbed],
                components: [row]
            });

            // --- Collector để lắng nghe button click ---
            const filter = i => i.customId.startsWith('cups_choice_') && i.user.id === userID;
            const collector = sentMessage.createMessageComponentCollector({ filter, time: 30000 }); // Thời gian chờ 30 giây

            collector.on('collect', async i => {
                // Đảm bảo chỉ xử lý tương tác của người chơi hiện tại và chỉ một lần
                if (i.customId.includes(userID) && i.customId.startsWith('cups_choice_') && i.message.id === sentMessage.id) {
                    collector.stop(); // Dừng collector ngay sau khi nhận được lựa chọn hợp lệ

                    // *** ĐÃ SỬA CHỖ NÀY ***
                    // Correct parsing for customId: `cups_choice_chosenValue_userID_ballPosition_betAmount`
                    const parts = i.customId.split('_');
                    const chosenCup = parseInt(parts[2]); // Lấy chosenCupNumber (ví dụ: '1')
                    const storedUserID = parts[3]; // Lấy userID (để đảm bảo đúng người chơi)
                    const actualBallPositionIndex = parseInt(parts[4]); // Lấy ballPositionIndex (ví dụ: '0')
                    const actualBetAmount = parseInt(parts[5]); // Lấy betAmount (ví dụ: '100')
                    // *********************

                    let winAmount = 0;
                    let resultDescription = "";
                    let embedColor = "";

                    // Xây dựng chuỗi emoji cốc sau khi lật
                    let finalCupsDisplay = '';
                    for (let x = 0; x < 3; x++) {
                        if (x === actualBallPositionIndex) { 
                            finalCupsDisplay += `${BALL_EMOJI} `; // Quả bóng ở vị trí này
                        } else {
                            finalCupsDisplay += `${CUP_EMOJI} `; // Cốc rỗng
                        }
                    }
                    
                    try {
                        const updatedUserData = await User.findOne({ userId: userID }); // Lấy lại dữ liệu user để có balance mới nhất
                        if (!updatedUserData) {
                            console.error("User data not found for button click during game:", userID);
                            return i.update({ content: 'Có lỗi xảy ra, không tìm thấy tài khoản người chơi.', components: [] });
                        }

                        if ((chosenCup - 1) === actualBallPositionIndex) { 
                            // Người chơi thắng
                            winAmount = actualBetAmount * WIN_MULTIPLIER;
                            await incBalance(userID, winAmount);
                            
                            resultDescription = `Bạn thắng **$${convertInt(winAmount)}**\nBạn đã tìm thấy quả bóng!`;
                            embedColor = success; // Màu xanh lá cây cho thắng
                            // updatedUserData.balance đã được cập nhật bởi incBalance, không cần cập nhật lại trong bộ nhớ
                        } else {
                            // Người chơi thua
                            resultDescription = `Bạn thua **$${convertInt(actualBetAmount)}**\nBạn chọn cốc số **${chosenCup}** nhưng quả bóng ở trong cốc số **${actualBallPositionIndex + 1}**`;
                            embedColor = danger; // Màu đỏ cho thua
                            // Số dư đã được cập nhật khi đặt cược (đã trừ ban đầu)
                        }

                        // Cập nhật embed với kết quả cuối cùng
                        const finalEmbed = new EmbedBuilder()
                            .setColor(embedColor)
                            .setTitle("Cups")
                            .setDescription(
                                `**Kết quả**\n` +
                                `\n` +
                                `${finalCupsDisplay}\n\n` +
                                `${resultDescription}`
                            )
                            .setFooter({
                                text: `Người chơi: ${playerUsername}`,
                                iconURL: playerAvatarURL,
                            });

                        // Chỉnh sửa tin nhắn gốc và loại bỏ các button
                        await i.update({
                            embeds: [finalEmbed],
                            components: [] 
                        });

                    } catch (err) {
                        console.error("Lỗi khi xử lý click button cups:", err);
                        await i.update({ content: 'Có lỗi xảy ra khi xử lý lựa chọn của bạn!', components: [] });
                    } finally {
                        activeGames.delete(userID); // Xóa game khỏi activeGames khi kết thúc
                    }
                }
            });

            collector.on('end', async (collected, reason) => {
                // Nếu người chơi không chọn trong thời gian quy định
                if (reason === 'time' && activeGames.has(userID)) {
                    // Hoàn lại tiền cho người chơi nếu họ không chọn
                    await incBalance(userID, betAmount); 
                    const expiredEmbed = new EmbedBuilder()
                        .setColor(danger)
                        .setTitle("Cups - Đã hết thời gian!")
                        .setDescription(`Trò chơi của bạn đã hết thời gian. **${convertInt(betAmount)}** ${COIN_EMOJI} tiền cược đã được hoàn lại.`);
                    
                    try {
                        // Cập nhật tin nhắn với thông báo hết thời gian và loại bỏ buttons
                        await sentMessage.edit({ embeds: [expiredEmbed], components: [] });
                    } catch (editError) {
                        console.error("Could not edit message after cups game timed out:", editError);
                    }
                    activeGames.delete(userID); // Xóa game khỏi activeGames khi hết thời gian
                }
            });

        } catch (error) {
            console.error("Có lỗi ở lệnh cups:", error);
            const errorEmbed = new EmbedBuilder()
                .setColor(danger)
                .setDescription("Có lỗi xảy ra khi thực hiện lệnh cups. Vui lòng liên hệ với admin.");
            await message.channel.send({ embeds: [errorEmbed] });
            activeGames.delete(userID); // Đảm bảo xóa khỏi activeGames nếu có lỗi ngay từ đầu
        }
    },
};