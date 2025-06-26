const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const User = require('../../models/user.model.js'); // Đảm bảo đường dẫn đúng đến model User
const { primary } = require('../../color.json'); // Màu sắc cho embed
const { adminId } = require('../../config.json'); // Đảm bảo bạn có adminId ở đây

module.exports = {
    category: 'Admin', // Category mới cho các lệnh admin
    data: new SlashCommandBuilder()
        .setName('removemoney')
        .setDescription('Giảm tiền từ tài khoản Casino của người dùng.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Người dùng bạn muốn giảm tiền từ tài khoản.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số tiền muốn giảm (phải là số nguyên dương).')
                .setRequired(true)
                .setMinValue(1)), // Chỉ cho phép số dương

    async execute(interaction) {
        // Kiểm tra quyền hạn admin
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({
            content: `Bạn không có quyền thực hiện lệnh này.`,
            flags: MessageFlags.Ephemeral
        });

        const targetUser = interaction.options.getUser('target');
        let amount = interaction.options.getInteger('amount');

        // Tìm tài khoản người dùng mục tiêu trong DB
        const userDB = await User.findOne({ userId: targetUser.id });

        if (!userDB) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`❌ **${targetUser.username}** chưa có tài khoản Casino.`);
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral}); // ephemeral để admin thấy lỗi
        }

        // Đảm bảo số tiền giảm không làm balance âm (trừ khi bạn muốn cho phép)
        if (userDB.balance < amount) {
            amount = userDB.balance;
        }

        // Cập nhật số dư
        userDB.balance -= amount;
        await userDB.save();

        const embed = new EmbedBuilder()
            .setColor(primary)
            .setDescription(`✅ Đã giảm **$${new Intl.NumberFormat("en").format(amount)}** từ tài khoản của **${targetUser.username}**.
            \nSố dư mới: **$${new Intl.NumberFormat("en").format(userDB.balance)}**`);
        return interaction.reply({ embeds: [embed] , flags: MessageFlags.Ephemeral}); // Không ephemeral
    },
};