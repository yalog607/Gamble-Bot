const User = require('../../models/user.model.js');
const { EmbedBuilder } = require("discord.js");
const { primary, success, danger } = require('../../color.json');
const { adminId } = require('../../config.json');

module.exports = {
    cooldown: 3000,
    category: 'Casino',
    name: 'leaderboard', // Tên lệnh
    aliases: ['lb', 'top', 'ldb'], // Các biệt danh của lệnh
    description: 'Bảng xếp hạng số tiền Casino', // Mô tả lệnh
    run: async(client, message, args) => { // Thay đổi từ execute(interaction) sang run(client, message, args)
        try {
            const guildMembers = await message.guild.members.fetch();
            const memberIdsInGuild = guildMembers.map(member => member.id);

            const topUsers = await User.find({ 
                userId: { $in: memberIdsInGuild, $ne: adminId } 
            })
            .sort({ balance: -1 })
            .limit(10);
            
            // Lấy thông tin người gọi lệnh cho footer
            const playerUsername = message.author.username;
            const playerAvatarURL = message.author.displayAvatarURL({ dynamic: true });

            const embed = new EmbedBuilder()
                .setColor(primary)
                .setTitle('💰 Bảng xếp hạng Casino 💰') // Thêm tiêu đề cho đẹp
                .setDescription('**Top 10 người chơi có số tiền cao nhất**');
            
            if (topUsers.length === 0) {
                embed.setDescription('Chưa có ai trong bảng xếp hạng. Hãy là người đầu tiên dùng lệnh start!');
            } else {
                for (let i = 0; i < topUsers.length; i++) {
                    const user = topUsers[i];
                    const userNameToDisplay = user.username || `Người dùng #${user.userId.substring(0, 4)}...`; 
                    embed.addFields({
                        name: `${i+1}. ${userNameToDisplay}`, 
                        value: `Số tiền: **$${new Intl.NumberFormat("en").format(user.balance)}**`, 
                        inline: false
                    });
                }
            }
            
            embed.setFooter({ text: `Người gửi: ${playerUsername}`, iconURL: playerAvatarURL }); // Thêm footer
            
            return await message.channel.send({embeds: [embed]}); // Sử dụng message.channel.send
        } catch (error) {
            console.error('Lỗi ở leaderboard command (prefix): ', error); // Log lỗi chi tiết hơn
            const playerUsername = message.author.username;
            const playerAvatarURL = message.author.displayAvatarURL({ dynamic: true });

            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`Có lỗi xảy ra khi hiển thị bảng xếp hạng. Vui lòng thử lại sau.`)
                .setFooter({ text: `Người gửi: ${playerUsername}`, iconURL: playerAvatarURL });
            return await message.channel.send({embeds: [errorEmbed]});
        }
    }
};