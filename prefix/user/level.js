const Level = require('../../models/level.model.js');
const User = require('../../models/user.model.js'); // Đảm bảo đường dẫn đúng
const canvafy = require('canvafy');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js'); // Import EmbedBuilder nếu bạn muốn dùng cho lỗi

module.exports = {
    cooldown: 3000,
    category: 'System',
    name: 'level', // Tên lệnh
    aliases: ['rank', 'xp'], // Các biệt danh của lệnh
    description: 'Kiểm tra level của bản thân hoặc người khác khi @tag', // Mô tả lệnh
    run: async(client, message, args) => { // Thay đổi từ execute(interaction) sang run(client, message, args)
        // Gửi tin nhắn "đang xử lý" ban đầu để phản hồi nhanh chóng
        const initialResponse = await message.channel.send('Đang tải thông tin level...');

        try {
            let targetUser = message.author; // Mặc định là người gửi lệnh
            // Lấy người dùng được đề cập (mention) hoặc ID từ args[0]
            const mentionedUser = message.mentions.users.first();
            if (mentionedUser) {
                targetUser = mentionedUser;
            } else if (args[0]) {
                // Thử tìm user bằng ID nếu không có mention
                const fetchedUser = await client.users.fetch(args[0]).catch(() => null);
                if (fetchedUser) {
                    targetUser = fetchedUser;
                }
            }

            const userLevelData = await Level.findOne({userId: targetUser.id});
            const userData = await User.findOne({userId: targetUser.id}); // Kiểm tra tài khoản casino cũng là một ý hay

            // Lấy thông tin người dùng cho footer của embed lỗi (nếu có)
            const requesterUsername = message.author.username;
            const requesterAvatarURL = message.author.displayAvatarURL({ dynamic: true });

            if (!userData || !userLevelData) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`**${targetUser.username}** chưa có tài khoản Casino hoặc chưa có dữ liệu level.`)
                    .setFooter({ text: `Người gửi: ${requesterUsername}`, iconURL: requesterAvatarURL });
                return await initialResponse.edit({ // Sửa tin nhắn ban đầu
                    content: '', // Xóa nội dung "Đang tải..."
                    embeds: [embed]
                });
            }

            const avatarURL = targetUser.displayAvatarURL({extension: 'png', size: 256}); // Sử dụng extension 'png' hoặc 'jpg', 'size' để đảm bảo chất lượng ảnh cho canvafy
            const xpNeededForNextLevel = 20 + (userLevelData.level - 1) * 20;

            const allUsers = await Level.find();
            // Sắp xếp theo level giảm dần, sau đó theo XP giảm dần để xử lý trường hợp cùng level
            allUsers.sort((a, b) => {
                if (b.level === a.level) {
                    return b.xp - a.xp;
                }
                return b.level - a.level;
            });
            const userRank = allUsers.findIndex(u => u.userId === targetUser.id) + 1;
            const userName = targetUser.username;
            
            const rankImage = await new canvafy.Rank()
                .setAvatar(avatarURL)
                .setUsername(userName)
                // Background có thể là một URL hoặc một path đến file local
                .setBackground('image', 'https://4kwallpapers.com/images/wallpapers/dark-background-abstract-background-network-3d-background-3840x2160-8324.png')
                .setBarColor('#C5172E')
                .setLevel(userLevelData.level)
                .setRank(userRank)
                .setCurrentXp(userLevelData.xp)
                .setRequiredXp(xpNeededForNextLevel)
                .build();
            
            const attachment = new AttachmentBuilder(rankImage, { name: `rank-${targetUser.id}.png` });

            await initialResponse.edit({ // Sửa tin nhắn ban đầu để gửi ảnh
                content: '', // Xóa nội dung "Đang tải..."
                files: [attachment]
            });
        } catch (error) {
            console.error("Lỗi trong level command (prefix): ", error);
            const requesterUsername = message.author.username;
            const requesterAvatarURL = message.author.displayAvatarURL({ dynamic: true });

            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`Có lỗi xảy ra khi kiểm tra level. Vui lòng thử lại sau.`)
                .setFooter({ text: `Người gửi: ${requesterUsername}`, iconURL: requesterAvatarURL });
            await initialResponse.edit({ // Sửa tin nhắn ban đầu để báo lỗi
                content: '', // Xóa nội dung "Đang tải..."
                embeds: [errorEmbed]
            });
        }
    }
};