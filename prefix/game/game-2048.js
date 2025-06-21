const { TwoZeroFourEight } = require('discord-gamecord');
const { primary, success, danger } = require('../../color.json');

module.exports = {
    cooldown: 3000,
    category: 'Funny',
    name: '2048',
    description: "Chơi game 2048",
    run: async(client, message, arg) => {
        const Game = new TwoZeroFourEight({
        message: message,
        isSlashGame: false,
        embed: {
            title: '2048',
            color: primary
        },
        emojis: {
            up: '⬆️',
            down: '⬇️',
            left: '⬅️',
            right: '➡️',
        },
        timeoutTime: 60000,
        buttonStyle: 'PRIMARY',
        playerOnlyMessage: 'Chỉ {player} mới có thể dùng nút này.'
        });

        Game.startGame();
        Game.on('gameOver', result => {
        // console.log(result);  // =>  { result... }
        });
    } 
}