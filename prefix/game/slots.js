const { Slots } = require('discord-gamecord');
module.exports = {
    cooldown: 3000,
    category: 'Funny',
    name: 'slots',
    aliases: ['slot'],
    description: 'Chơi slots',
    run: async(client, message, arg) => {
        const Game = new Slots({
        message: message,
        isSlashGame: false,
        embed: {
            title: 'Slot Machine',
            color: '#5865F2'
        },
        slots: ['🍇', '🍊', '🍋', '🍌']
        });

        Game.startGame();
        Game.on('gameOver', result => {
        console.log(result);  // =>  { result... }
        });
    }
}