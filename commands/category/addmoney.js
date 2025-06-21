const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const User = require('../../models/user.model.js'); // Đảm bảo đường dẫn đúng đến model User
const { primary } = require('../../color.json'); // Màu sắc cho embed

module.exports = {
    category: 'Admin',
    data: new SlashCommandBuilder()
        .setName('addmoney')
        .setDescription('Thêm tiền vào tài khoản Casino của người dùng.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Người dùng bạn muốn thêm tiền vào tài khoản.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số tiền muốn thêm (phải là số nguyên dương).')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        // Kiểm tra quyền hạn admin
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({
            content: `Bạn không có quyền thực hiện lệnh này.`,
            flags: MessageFlags.Ephemeral
        });

        const targetUser = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');

        // Tìm tài khoản người dùng mục tiêu trong DB
        let userDB = await User.findOne({ userId: targetUser.id });

        if (!userDB) {
            // Nếu người dùng chưa có tài khoản, tạo mới cho họ với số tiền được thêm
            userDB = await User.create({
                userId: targetUser.id,
                username: targetUser.username,
                balance: amount, // Bắt đầu với số tiền được admin thêm vào
                lastDaily: 0, // Đặt các giá trị mặc định khác
                lastWeekly: 0,
                lastMonthly: 0
            });

            const embed = new EmbedBuilder()
                .setColor(primary)
                .setDescription(`✅ Đã tạo tài khoản Casino cho **${targetUser.username}** và thêm **$${new Intl.NumberFormat("en").format(amount)}** vào tài khoản.`);
            return interaction.reply({ embeds: [embed] , flags: MessageFlags.Ephemeral}); // Không ephemeral để mọi người biết
        } else {
            // Cập nhật số dư
            userDB.balance += amount;
            await userDB.save();

            const embed = new EmbedBuilder()
                .setColor(primary)
                .setDescription(`✅ Đã thêm **$${new Intl.NumberFormat("en").format(amount)}** vào tài khoản của **${targetUser.username}**.
                \nSố dư mới: **$${new Intl.NumberFormat("en").format(userDB.balance)}**`);
            return interaction.reply({ embeds: [embed] , flags: MessageFlags.Ephemeral}); // Không ephemeral
        }
    },
};