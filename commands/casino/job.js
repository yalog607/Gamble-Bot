const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const User = require('../../models/user.model.js'); // Path to your User model
const { incBalance } = require('../../helpers/userHelper.js'); // Import your incBalance helper function

// Helper function to get a random integer within a range
function getRandomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Define the cooldown time (15 minutes in milliseconds)
const COOLDOWN_TIME = 15 * 60 * 1000;
// Define the range for the amount earned
const EARN_AMOUNT_MIN = 8000;
const EARN_AMOUNT_MAX = 20000;

module.exports = {
    // This cooldown is for Discord's built-in application command cooldowns, if you use them.
    // However, the main cooldown logic for 'job' will still be handled by your event handler (e.g., interactionCreate.js)
    // using a more persistent method (like a database or Collection).
    // For now, we'll set it to 15 minutes (in seconds).
    cooldown: COOLDOWN_TIME / 1000, // Convert ms to seconds for SlashCommandBuilder
    category: 'Casino',
    data: new SlashCommandBuilder()
        .setName('job')
        .setDescription('Làm công việc và kiếm tiền sau một thời gian nhất định.'),
    async execute(interaction) {
        const userID = interaction.user.id;
        const playerUsername = interaction.user.username;
        const playerAvatarURL = interaction.user.displayAvatarURL({ dynamic: true });

        // try {
        //     // Check if the user has a casino account
        //     const userData = await User.findOne({ userId: userID });
        //     if (!userData) {
        //         const embed = new EmbedBuilder()
        //             .setColor("#D91656")
        //             .setDescription(
        //                 `Bạn chưa có tài khoản Casino. Dùng lệnh \`/start\` để tạo tài khoản.`
        //             );
        //         // Use ephemeral replies for user-specific error messages
        //         return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        //     }

        //     // Generate a random amount for this specific execution
        //     const EARN_AMOUNT = getRandomInteger(EARN_AMOUNT_MIN, EARN_AMOUNT_MAX);

        //     // Increase the user's balance
        //     await incBalance(userID, EARN_AMOUNT);

        //     // Send success embed
        //     const successEmbed = new EmbedBuilder()
        //         .setColor("#00FF9C") // Green color for success
        //         .setTitle("💰 Công việc hoàn thành!")
        //         .setDescription(
        //             `Bạn đã làm việc chăm chỉ và kiếm được **$${new Intl.NumberFormat(
        //                 "en"
        //             ).format(EARN_AMOUNT)}**.`
        //         )
        //         .addFields(
        //             {
        //                 name: "Số dư hiện tại",
        //                 // Ensure this reflects the updated balance
        //                 value: `$${new Intl.NumberFormat("en").format(userData.balance + EARN_AMOUNT)}`,
        //                 inline: true,
        //             }
        //         )
        //         .setFooter({
        //             text: `Người gửi: ${playerUsername}`,
        //             iconURL: playerAvatarURL,
        //         });

        //     await interaction.reply({ embeds: [successEmbed] });

        // } catch (error) {
        //     console.error("Có lỗi ở lệnh job:", error);
        //     const errorEmbed = new EmbedBuilder()
        //         .setColor("#D91656")
        //         .setDescription("Có lỗi xảy ra khi thực hiện lệnh job. Vui lòng liên hệ với admin.");
        //     // Use ephemeral replies for errors
        //     await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        // }

        return await interaction.reply({content: `Vui lòng dùng lệnh \`${prefix}job\` thay cho lệnh này.`})
    },
};