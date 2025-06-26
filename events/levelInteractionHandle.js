const levelSchema = require('../models/level.model');
const User = require('../models/user.model');
const canvafy = require('canvafy');
const { Events } = require('discord.js');

const xpPerLevel = (level) => {
    const randomXp = Math.floor(Math.random() * 8);
    return randomXp;
}
const cooldowns = new Map();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isCommand()) return;
        const { commandName } = interaction;
        const userdata = await User.findOne({userId: interaction.user.id});
        if(!userdata)return;
        let user = await levelSchema.findOne({userId: interaction.user.id});
        if (!user) {
            user = await levelSchema.create({
                userId: interaction.user.id,
                xp: 0,
                level: 1
            })
        }
        user.xp += xpPerLevel(user.level);
        const xpToLevelUp = 20 + (user.level-1) * 20;
        const xpNeeded = xpToLevelUp;

        if(user.xp >= xpNeeded) {
            if (cooldowns.has(interaction.user.id)) {
                const expirationTime = cooldowns.get(interaction.user.id);
                const timeDifference = expirationTime - Date.now();

                if (timeDifference > 0) return;
            }
            if (user.xp >= xpNeeded) {
                user.xp -= xpNeeded;
                user.level++;

                const coolDownTime = 30000;
                cooldowns.set(interaction.user.id, Date.now()+coolDownTime);

                const balanceToAdd = user.level === 2 ? 10000 : 10000 + (user.level -2) * 5000;

                const updatedUserBalance = await User.findOneAndUpdate(
                    {userId: interaction.user.id},
                    {$inc: {balance: balanceToAdd}},
                    {upsert: true, new: true}
                )
                const oldLevel = user.level - 1;
                const levelUp = await new canvafy.LevelUp()
                    .setAvatar(
                        interaction.user.displayAvatarURL({
                            format: 'png',
                            dynamic: true,
                            size: 128
                        })
                    )
                    .setUsername(`${interaction.user.username}`)
                    .setBackground('image', 'https://4kwallpapers.com/images/wallpapers/dark-background-abstract-background-network-3d-background-3840x2160-8324.png')
                    .setBorder('#000000')
                    .setAvatarBorder('#ff0000')
                    .setOverlayOpacity(0.7)
                    .setLevels(oldLevel, user.level)
                    .build();
                
                interaction.channel.send({
                    content: `Chúc mừng! Bạn nhận được **$${balanceToAdd.toLocaleString()}**!`,
                    files: [
                        {
                            attachment: levelUp,
                            name: `levelup-${interaction.user.id}.png`
                        }
                    ]
                })
                // user.xp = 0;
                user.save();
            }
        } else {
            await user.save();
        }

    },
};