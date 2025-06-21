const { EmbedBuilder } = require('discord.js');
const { TicTacToe } = require('discord-gamecord');
const { color, prefix } = require('../../config.json');

module.exports = {
    cooldown: 3000,
    category: 'Funny',
    name: 'tictactoe',
    description: 'Chơi game tictactoe',
    aliases: ['ttt'],
    run: async(client, message, arg) => {
        if(!arg[0]) {
            const embed = new EmbedBuilder()
                .setColor(color)
                .setDescription(`Cú pháp: ${prefix}tictactoe <@user>`);
            return await message.channel.send({embeds: [embed]});
        }
        const Game = new TicTacToe({
        message: message,
        isSlashGame: false,
        opponent: message.mentions.users.first(),
        embed: {
            title: 'Tic Tac Toe',
            color: color,
            statusTitle: 'Status',
            overTitle: 'Game Over'
        },
        emojis: {
            xButton: '❌',
            oButton: '🔵',
            blankButton: '➖'
        },
        mentionUser: true,
        timeoutTime: 60000,
        xButtonStyle: 'DANGER',
        oButtonStyle: 'PRIMARY',
        turnMessage: '{emoji} | Đây là lượt chơi của **{player}**.',
        winMessage: '{emoji} | **{player}** thắng TicTacToe Game.',
        tieMessage: 'Hòa! Không ai chắng trận đấu này!',
        timeoutMessage: 'Trận đấu không được hoàn thành! Không ai thắng trận đấu này!',
        playerOnlyMessage: 'Chỉ {player} và {opponent} mới có thể dùng nút này.'
        });

        Game.startGame();
        Game.on('gameOver', result => {
        // console.log(result);  // =>  { result... }
        });
    }
}