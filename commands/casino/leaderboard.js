const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const User = require('../../models/user.model.js');
const { EmbedBuilder } = require("discord.js");
const { primary } = require('../../color.json');
const { adminId } = require('../../config.json');

module.exports = {
    cooldown: 3,
    category: 'Casino',
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Bảng xếp hạng số tiền Casino'),
        async execute(interaction) {
            try {
                const guildMembers = await interaction.guild.members.fetch();
                const memberIdsInGuild = guildMembers.map(member => member.id);
                const topUsers = await User.find({ 
                    userId: { $in: memberIdsInGuild, $ne: adminId } 
                })
                .sort({ balance: -1 })
                .limit(10);
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription('**💰 Bảng xếp hạng Casino 💰**');
                topUsers.forEach((user, index) => {
                    embed.addFields(
                        {name: `${index+1}. ${user.username}`, value: `Số tiền: **$${new Intl.NumberFormat("en").format(user.balance)}**`}
                    )
                })
                return interaction.reply({embeds: [embed]});
            } catch (error) {
                console.log('Lỗi ở leaderboard command: ', error);
            }
        }
}