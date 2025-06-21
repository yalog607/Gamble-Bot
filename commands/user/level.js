const { SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const Level = require('../../models/level.model.js');
const User = require('../../models/user.model.js');
const canvafy = require('canvafy');

module.exports = {
    cooldown: 3,
    category: 'System',
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Kiểm tra level của bản thân hoặc người khác khi @tag')
        .addUserOption(option => 
            option
                .setName('target')
                .setDescription('Người bạn muốn kiểm tra level (nếu có)')
        ),
        async execute(interaction) {
            await interaction.deferReply({flags: MessageFlags.Ephemeral});
            try {
                let targetUser = interaction.user;
                const mentionedUser = interaction.options.getUser('target');
                if (mentionedUser) targetUser = mentionedUser;
                const user = await Level.findOne({userId: targetUser.id});
                const userData = await User.findOne({userId: targetUser.id});
                if (!userData || !user) {
                    return interaction.editReply({
                        content: `**${targetUser.username}** chưa có tài khoản. `
                    })
                }
                const avatarURL = targetUser.displayAvatarURL({format: 'jpg'});
                const xpNeededForNextLevel = 20 + (user.level-1)*20;

                const allUsers = await Level.find();
                allUsers.sort((a,b) => b.level - a.level);
                const userRank = allUsers.findIndex(u => u.userId === targetUser.id)+1;
                const userName = targetUser.username;
                
                const rank = await new canvafy.Rank()
                    .setAvatar(avatarURL)
                    .setUsername(userName)
                    .setBackground('image', 'https://4kwallpapers.com/images/wallpapers/dark-background-abstract-background-network-3d-background-3840x2160-8324.png')
                    .setBarColor('#C5172E')
                    .setLevel(user.level)
                    .setRank(userRank)
                    .setCurrentXp(user.xp)
                    .setRequiredXp(xpNeededForNextLevel)
                    .build();
                return interaction.editReply({
                    files: [new AttachmentBuilder(rank, `rank-${targetUser.id}.png`)]
                })
            } catch (error) {
                console.log("error: ", error);
                return interaction.reply({
                    content: "Có lỗi xảy ra khi thực thi lệnh level",
                    flags: MessageFlags.Ephemeral
                })
            }
        }
}