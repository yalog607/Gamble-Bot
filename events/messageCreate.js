const { Events, Collection } = require('discord.js');
module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        const client = message.client;
        const { prefix } = require("../config.json");
        if (!message.content.startsWith(prefix) || message.author.bot || message.author.id == client.user.id || message.channel.type == 'DM') return;
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.prefix.get(commandName) || client.prefix.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;

        // --- LOGIC COOLDOWN BẮT ĐẦU ---
        // Nếu lệnh không có cooldown, cho phép chạy ngay lập tức
        if (!command.cooldown) {
            try {
                await command.run(client, message, args);
            } catch (err) {
                console.error("Error executing command (no cooldown): ", err);
                message.reply('Đã có lỗi khi thực hiện lệnh này!');
            }
            return;
        }

        // Lấy hoặc tạo Collection cho cooldown của lệnh này
        if (!client.cooldownsPrefix.has(command.name)) {
            client.cooldownsPrefix.set(command.name, new Collection());
        }
        const timestamps = client.cooldownsPrefix.get(command.name);

        const now = Date.now();
        const expirationTime = timestamps.get(message.author.id); // Thời gian hết hạn cooldown của người dùng cho lệnh này

        if (expirationTime) { // Nếu có thời gian hết hạn cooldown đã lưu
            if (now < expirationTime) { // Nếu người dùng vẫn đang trong thời gian cooldown
                const remainingTime = expirationTime - now;
                const seconds = Math.ceil(remainingTime / 1000); // Làm tròn lên giây

                const sentMessage = await message.reply(`⏳ Vui lòng đợi **${seconds} giây** nữa trước khi sử dụng lệnh \`${command.name}\` một lần nữa.`);
                // Tự động xóa tin nhắn sau 5 giây để không làm đầy kênh
                setTimeout(() => sentMessage.delete().catch(err => console.error("Could not delete cooldown message:", err)), 5000);
                return;
            }
        }

        // Đặt hoặc cập nhật thời gian cooldown cho người dùng này
        timestamps.set(message.author.id, now + command.cooldown);

        // Tự động xóa người dùng khỏi cooldown sau khi hết thời gian
        // Điều này giúp giữ cho Collection không quá lớn
        setTimeout(() => timestamps.delete(message.author.id), command.cooldown);

        try {
            if (command){
                command.run(client, message, args)
            }
        } catch (err) {
            console.log("Error in messageCreate: ", err);
        }
    },
};