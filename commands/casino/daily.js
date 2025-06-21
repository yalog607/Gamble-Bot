const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const User = require('../../models/user.model.js');
const Daily = require('../../models/cooldowndaily.model.js');
const { primary } = require('../../color.json');

function getRandomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    cooldown: 3,
    category: 'Casino',
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Nhận tiền thường hằng ngày'),
    async execute(interaction) {
        try {
            const user = await User.findOne({
                userId: interaction.user.id
            });
            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Bạn chưa có tài khoản Casino. Dùng lệnh /start để tạo tài khoản.`)
                return await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            }
            let cooldown = await Daily.findOne({
                userId: interaction.user.id
            })
            if (cooldown && cooldown.cooldownExpiration > Date.now()){
                const remainingTime =  cooldown.cooldownExpiration - Date.now();
                const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);

                const timeLeft = `**${hours}** tiếng, **${minutes}** phút`;
                const embed = new EmbedBuilder()
                    .setColor(primary)
                    .setDescription(`Bạn đã nhận thưởng hôm nay.\nHãy đợi thêm ${timeLeft} nữa.`)
                return await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            }
            const dailyCoins = getRandomInteger(3000,5000);
            user.balance += dailyCoins;
            await user.save();
            
            const newDaily = {
                userId: interaction.user.id,
                cooldownExpiration: Date.now() + 24 * 60 * 60 * 1000
            };

            cooldown = await Daily.findOneAndUpdate(
                {userId: interaction.user.id},
                newDaily,
                { upsert: true, new: true }
            )
            const embed = new EmbedBuilder()
                .setColor(primary)
                .setDescription(`Nhận thưởng thành công **$${new Intl.NumberFormat("en").format(dailyCoins)}**`);
            return await interaction.reply({embeds: [embed]});
        } catch (error) {
            console.log(error);
            return await interaction.reply({content: `Có lỗi trong daily command!`, flags: MessageFlags.Ephemeral});
        }
    }
}