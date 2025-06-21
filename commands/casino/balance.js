const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const User = require('../../models/user.model.js');
const { EmbedBuilder } = require("discord.js");
const { primary } = require('../../color.json');

module.exports = {
    cooldown: 3,
    category: 'Casino',
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Kiểm tra số tiền trong tài khoản Casino'),
        async execute(interaction) {
            const userId = interaction.user.id;
            const userCasino = await User.findOne({userId});
            if (!userCasino){
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Bạn chưa có tài khoản Casino. Dùng lệnh /start để tạo tài khoản.`)
                return await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            }
            try {
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Số tiền hiện tại: **$${new Intl.NumberFormat("en").format(userCasino.balance)}**`)
                return await interaction.reply({embeds: [embed]});
            } catch (error) {
                return await interaction.reply({content: "Không thể gửi tin nhắn cho user"});
            }
        }
}