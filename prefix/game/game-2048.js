const { TwoZeroFourEight } = require('discord-gamecord');

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
            color: '#5865F2'
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