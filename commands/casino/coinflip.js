const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    cooldown: 5, // Convert ms to seconds for SlashCommandBuilder
    category: 'Casino',
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Lật đồng xu và đặt cược tiền của bạn vào head/tail (hoặc h/t).'),
    async execute(interaction) {
        const userID = interaction.user.id;
        const playerUsername = interaction.user.username;
        const playerAvatarURL = interaction.user.displayAvatarURL({ dynamic: true });

        return await interaction.reply({content: `Vui lòng dùng lệnh \`${prefix}cf <bet> <h/t>\` thay cho lệnh này.`})
    },
};