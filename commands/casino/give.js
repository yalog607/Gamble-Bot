const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const User = require('../../models/user.model.js');
const { EmbedBuilder } = require("discord.js");
const { primary } = require('../../color.json');

module.exports = {
    cooldown: 3,
    category: 'Casino',
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Chuyển tiền cho người khác')
        .addUserOption(option => 
            option
                .setName('target')
                .setDescription('Người nhận')
                .setRequired(true)
        )
        .addIntegerOption(option => 
            option
                .setName('amount')
                .setDescription('Số tiền gửi')
                .setRequired(true)
        ),
        async execute(interaction) {
            const sender = interaction.user;
            const recipent = interaction.options.getUser('target');
            const amount = interaction.options.getInteger('amount');

            const senderDB = await User.findOne({userId: sender.id});
            const recipentDB = await User.findOne({userId: recipent.id});

            if (!recipentDB) {
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Người nhận chưa có tài khoản Casino.\nHọ cần dùng lệnh \`\`\`/start\`\`\` để tạo tài khoản.`)
                return await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            }
            if (!senderDB) {
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Bạn chưa có tài khoản Casino.\nDùng \`\`\`/start\`\`\` để tạo tài khoản.`)
                return await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            }
            if (senderDB.balance < amount) {
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Bạn không đủ tiền để chuyển.`)
                return await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            }
            senderDB.balance -= amount;
            recipentDB.balance += amount;
            await senderDB.save();
            await recipentDB.save();

            const embed = new EmbedBuilder()
                .setColor(primary)
                .setDescription(`Chuyển thành công **$${new Intl.NumberFormat("en").format(amount)}** cho \`${recipent.username}\`.`);
            return await interaction.reply({embeds: [embed]});
        }
}