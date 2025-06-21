const { Minesweeper } = require('discord-gamecord');

module.exports = {
    cooldown: 3000,
    category: 'Funny',
    name: "mines",
    aliases: ['mine'],
    description: 'Đào mìn',
    run: async(client, message, arg) => {
        try {
            const Game = new Minesweeper({
            message: message,
            isSlashGame: false,
            embed: {
                title: 'Minesweeper',
                color: '#5865F2',
                description: 'Nhấn vào các nút để tìm các ô không phải là mìn.'
            },
            emojis: { flag: '🚩', mine: '💣' },
            mines: 5,
            timeoutTime: 60000,
            winMessage: 'Win game! Bạn đã tìm được tất cả các ô không phải là mìn.',
            loseMessage: 'Bạn đã thua! Lần sau cẩn thận hơn nhé.',
            playerOnlyMessage: 'Chỉ {player} mới có thể dùng lệnh này.'
            });

            Game.startGame();
            Game.on('gameOver', result => {
            // console.log(result);
            });
        } catch (error) {
            console.log("Có lỗi ở mines.js", error);
        }
    }
}