const { Events, MessageFlags, Collection } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
        const { cooldowns } = interaction.client;
		if (!command.cooldown) { // Giả định lệnh có thuộc tính 'cooldown' trong module.exports
             try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Đã có lỗi khi thực hiện lệnh này!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'Đã có lỗi khi thực hiện lệnh này!', flags: MessageFlags.Ephemeral });
                }
            }
            return;
        }

        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name); // Collection các cooldown của lệnh này
        
        // Lấy thời gian cooldown từ command.cooldown (được định nghĩa trong file lệnh)
        // Nếu không có, mặc định là 3 giây.
        const cooldownAmount = (command.cooldown ?? 0) * 1_000; // Chuyển đổi giây sang milliseconds

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime) {
                const remainingTime = expirationTime - now;
                const seconds = Math.ceil(remainingTime / 1_000); // Làm tròn lên giây

                // --- SỬA ĐỔI TẠI ĐÂY: Sử dụng tin nhắn văn bản đơn giản giống MessageCreate ---
                return interaction.reply({ 
                    content: `⏳ Vui lòng đợi **${seconds} giây** nữa trước khi sử dụng lệnh \`${command.data.name}\` một lần nữa.`, 
                    flags: MessageFlags.Ephemeral // Ephemeral để chỉ người dùng thấy thông báo
                });
                // --- KẾT THÚC SỬA ĐỔI ---
            }
        }

        // Đặt thời gian cooldown mới cho người dùng
        timestamps.set(interaction.user.id, now);
        
        // Tự động xóa người dùng khỏi cooldown sau khi hết thời gian
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
		}
	},
};