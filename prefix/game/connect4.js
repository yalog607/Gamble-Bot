const { Connect4 } = require('discord-gamecord');
const { EmbedBuilder } = require('discord.js');
const { color, prefix } = require('../../config.json');

module.exports = {
    cooldown: 3000,
    category: 'Funny',
    name: 'connect4',
    aliases: ['conn4'],
    description: 'Xếp chồng từng ô lên mỗi cột, bên nào đạt được 4 ô liền nhau (ngang, dọc, chéo) trước sẽ thắng',
    run: async(client, message, arg) => {
        if(!arg[0]) {
            const embed = new EmbedBuilder()
                .setColor(color)
                .setDescription(`Cú pháp: ${prefix}conn4 <@user>`);
            return await message.channel.send({embeds: [embed]});
        }
        try {
            const Game = new Connect4({
            message: message,
            isSlashGame: false,
            opponent: message.mentions.users.first(),
            embed: {
                title: 'Connect4 Game',
                statusTitle: 'Status',
                color: color
            },
            emojis: {
                board: '⚪',
                player1: '🔴',
                player2: '🟡'
            },
            mentionUser: true,
            timeoutTime: 60000,
            buttonStyle: 'PRIMARY',
            turnMessage: '{emoji} | Đến lượt **{player}**.',
            winMessage: '{emoji} | **{player}** thắng Connect4 Game.',
            tieMessage: 'Hòa! Không ai thắng ván này!',
            timeoutMessage: 'Ván đấu không được hoàn thành! Không ai thắng ván này!',
            playerOnlyMessage: 'Chỉ {player} và {opponent} mới có thể dùng lệnh này.'
            });

            Game.startGame();
            Game.on('gameOver', result => {
            // console.log(result);  // =>  { result... }
            });
        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor('red')
                .setDescription('Có lỗi trong khi chọn người chơi');
            return await message.channel.send({embeds: [embed]});
        }
    }
}