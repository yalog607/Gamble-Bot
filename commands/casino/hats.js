const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    cooldown: 5, // Convert ms to seconds for SlashCommandBuilder
    category: 'Casino',
    data: new SlashCommandBuilder()
        .setName('hats')
        .setDescription('Đoán vị trí của quả bóng trong 3 chiếc cốc'),
    async execute(interaction) {
        const userID = interaction.user.id;
        const playerUsername = interaction.user.username;
        const playerAvatarURL = interaction.user.displayAvatarURL({ dynamic: true });

        return await interaction.reply({content: `Vui lòng dùng lệnh \`${prefix}hats <bet>\` thay cho lệnh này.`})
    },
};