const { EmbedBuilder, Collection } = require("discord.js");
const User = require("../../models/user.model.js"); // Đường dẫn tới User model của bạn
const { incBalance } = require("../../helpers/userHelper.js"); // Import hàm tăng số dư
const {prefix} = require('../../config.json');
const { checkCoolDown } = require("../../helpers/utility.js");
const Job = require('../../models/cooldownjob.model.js');

function getRandomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const COOLDOWN_TIME = getRandomInteger(15 * 60 * 1000, 18 * 60 * 1000);
const EARN_AMOUNT = getRandomInteger(8000,20000); // Số tiền kiếm được mỗi lần dùng lệnh job

module.exports = {
    category: 'Casino',
    name: "job",
    aliases: ["work", "lamviec"],
    description: "Làm việc và kiếm tiền",
    run: async (client, message, args) => {
        const playerUsername = message.author.username;
        const userID = message.author.id;

        try {
            // Kiểm tra xem người dùng đã có tài khoản casino chưa
            const userData = await User.findOne({ userId: userID });
            if (!userData) {
                return await message.reply( `Bạn chưa có tài khoản Casino. Dùng lệnh \`${prefix}start\` để tạo tài khoản.`);
            }

            const checkTimeLeft = await checkCoolDown(userID, Job, COOLDOWN_TIME);
            if (!checkTimeLeft.status) {
                const timeLeft = `**${checkTimeLeft.timeLeft.minutes}** phút`;
                return await message.reply(`Nghỉ mệt đã ní ơi ~.~ Đợi thêm ${timeLeft} nữa.`);
            }

            // Tăng số dư cho người dùng
            await incBalance(userID, EARN_AMOUNT);

            await message.channel.send(`⚒️ **${playerUsername}** | Bạn đã làm việc chăm chỉ và kiếm được **$${new Intl.NumberFormat(
                        "en"
                    ).format(EARN_AMOUNT)}**.`);

        } catch (error) {
            console.error("Có lỗi ở lệnh job:", error);
            await message.reply("Có lỗi xảy ra khi thực hiện lệnh job. Vui lòng liên hệ với admin.");
        }
    },
};