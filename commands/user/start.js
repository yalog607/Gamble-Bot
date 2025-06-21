const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require("discord.js");
const User = require('../../models/user.model.js');
const { primary } = require("../../color.json");

module.exports = {
    cooldown: 3,
    category: 'System',
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Tạo tài khoản casino')
    ,async execute(interaction){
        const userId = interaction.user.id;
        const userDB = await User.findOne({userId});
        if (userDB){
            return await interaction.reply({
                content: `Bạn đã có tài khoản Casino!`,
                flags: MessageFlags.Ephemeral
            })
        }else {
            await User.create({
                userId: userId,
                username: interaction.user.username,
                balance: 100
            })
            const embedSuccess = new EmbedBuilder()
                .setColor(primary)
                .setDescription(`Tạo tài khoản Casino thành công✨\nBạn được tặng **$100** để bắt đầu!`);
            return await interaction.reply({
                embeds: [embedSuccess],
                flags: MessageFlags.Ephemeral
            })
        }
    }
}