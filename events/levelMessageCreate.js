const levelSchema = require('../models/level.model');
const User = require('../models/user.model');
const canvafy = require('canvafy');
const { Events } = require('discord.js');

const messageXPCoolDowns = new Map();

const xpPerLevel = (level) => {
    const randomXp = Math.floor(Math.random() * 8);
    return randomXp;
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Bỏ qua tin nhắn của bot hoặc tin nhắn trong kênh DM
        if (message.author.bot || !message.guild) return;

        // Bỏ qua nếu tin nhắn quá ngắn để tránh spam XP
        if (message.content.length < 3) return; 

        const userID = message.author.id;
        const channel = message.channel;

        // --- Bắt đầu phần Cooldown mới cho mỗi tin nhắn ---
        // Kiểm tra xem người dùng có đang trong cooldown nhận XP tin nhắn không
        if (messageXPCoolDowns.has(userID)) {
            const expirationTime = messageXPCoolDowns.get(userID);
            if (Date.now() < expirationTime) {
                // Nếu người dùng đang trong cooldown, không cấp XP và thoát
                return; 
            }
        }

        // Nếu không trong cooldown hoặc cooldown đã hết, đặt cooldown mới
        const coolDownTime = 30000; // 60 giây
        messageXPCoolDowns.set(userID, Date.now() + coolDownTime);
        // --- Kết thúc phần Cooldown mới ---

        try {
            const userdata = await User.findOne({ userId: userID });
            if (!userdata) return; 

            let userLevelData = await levelSchema.findOne({ userId: userID });
            if (!userLevelData) {
                userLevelData = await levelSchema.create({
                    userId: userID,
                    xp: 0,
                    level: 1
                });
            }

            // Tăng XP cho tin nhắn
            userLevelData.xp += xpPerLevel(userLevelData.level);
            
            const xpToLevelUp = 20 + (userLevelData.level - 1) * 20; 
            const xpNeeded = xpToLevelUp; 

            // --- Logic Level Up ---
            if (userLevelData.xp >= xpNeeded) {
                userLevelData.xp -= xpNeeded; 
                const oldLevel = userLevelData.level; 
                userLevelData.level++; 

                const balanceToAdd = userLevelData.level === 2 ? 10000 : 10000 + (userLevelData.level - 2) * 5000;

                await User.findOneAndUpdate(
                    { userId: userID },
                    { $inc: { balance: balanceToAdd } },
                    { upsert: true, new: true }
                );

                const levelUpImage = await new canvafy.LevelUp()
                    .setAvatar(
                        message.author.displayAvatarURL({
                            format: 'png',
                            dynamic: true,
                            size: 128
                        })
                    )
                    .setUsername(`${message.author.username}`)
                    .setBackground('image', 'https://4kwallpapers.com/images/wallpapers/dark-background-abstract-background-network-3d-background-3840x2160-8324.png')
                    .setBorder('#000000')
                    .setAvatarBorder('#ff0000')
                    .setOverlayOpacity(0.7)
                    .setLevels(oldLevel, userLevelData.level)
                    .build();

                await channel.send({
                    content: `Chúc mừng ${message.author}! Bạn đã lên cấp **${userLevelData.level}**! Bạn nhận được **$${balanceToAdd.toLocaleString()}**!`,
                    files: [
                        {
                            attachment: levelUpImage,
                            name: `levelup-${userID}.png`
                        }
                    ]
                });
            } 
            
            await userLevelData.save();

        } catch (error) {
            console.error("Lỗi khi xử lý XP từ tin nhắn:", error);
        }
    },
};