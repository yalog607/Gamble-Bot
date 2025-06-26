const User = require('../../models/user.model.js');
const { EmbedBuilder } = require("discord.js");
const { success, danger } = require('../../color.json'); // Đảm bảo đường dẫn đúng
const { prefix } = require('../../config.json');

module.exports = {
    cooldown: 3000,
    category: 'Casino',
    name: 'give', // Tên lệnh
    aliases: ['pay', 'chuyen'], // Các biệt danh cho lệnh
    description: 'Chuyển tiền cho người khác', // Mô tả lệnh
    usage: "<user> <amount>", 
    run: async(client, message, args) => { // Thay đổi từ execute(interaction) sang run(client, message, args)
        const sender = message.author; // Người gửi là tác giả tin nhắn
        
        // Cần parse args để lấy người nhận và số tiền
        // args[0] sẽ là người nhận (mention hoặc ID)
        // args[1] sẽ là số tiền
        
        // Lấy người nhận từ args[0]
        let recipent = message.mentions.users.first(); // Ưu tiên mention
        if (!recipent && args[0]) {
            // Nếu không có mention, thử tìm theo ID
            recipent = await client.users.fetch(args[0]).catch(() => null);
        }

        // Kiểm tra xem có người nhận hợp lệ không
        if (!recipent) {
            return await message.reply(`Vui lòng tag người nhận hoặc cung cấp ID hợp lệ.`);
        }

        // Kiểm tra người gửi và người nhận có phải là cùng một người không
        if (sender.id === recipent.id) {
            return await message.reply(`Bạn không thể tự chuyển tiền cho chính mình!`);
        }

        const amount = parseInt(args[1]); // Số tiền từ args[1]

        // Kiểm tra số tiền hợp lệ
        if (isNaN(amount) || amount <= 0) {
            return await message.reply(`Vui lòng nhập số tiền hợp lệ để chuyển (phải lớn hơn 0).`);
        }

        try {
            const senderDB = await User.findOne({userId: sender.id});
            const recipentDB = await User.findOne({userId: recipent.id});

            // Lấy thông tin người gửi/người nhận cho footer
            const senderUsername = sender.username;
            const recipentUsername = recipent.username;

            if (!senderDB) {
                return await message.reply(`Bạn chưa có tài khoản Casino.\nDùng lệnh \`\`\`${prefix}start\`\`\` để tạo tài khoản.`);
            }
            if (!recipentDB) {
                return await message.reply(`Người nhận \`${recipentUsername}\` chưa có tài khoản Casino.\nHọ cần dùng lệnh \`\`\`${prefix}start\`\`\` để tạo tài khoản.`);
            }

            if (senderDB.balance < amount) {
                return await message.reply(`Bạn không đủ tiền để chuyển.`);
            }
            
            senderDB.balance -= amount;
            recipentDB.balance += amount;
            await senderDB.save();
            await recipentDB.save();

            return await message.channel.send(`💳 **${senderUsername}** | Chuyển thành công **$${new Intl.NumberFormat("en").format(amount)}** cho \`${recipentUsername}\`.`);
        } catch (error) {
            console.error('Có lỗi trong give command (prefix):', error);
            return await message.reply(`Có lỗi xảy ra khi chuyển tiền. Vui lòng thử lại sau.`);
        }
    }
};