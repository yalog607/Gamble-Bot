function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function convertInt(int) {
	return new Intl.NumberFormat("en").format(int);
}

async function checkCoolDown (userId, Schema, newTime) {
	let cooldown = await Schema.findOne({
		userId: userId
	});

	if (cooldown && cooldown.cooldownExpiration > Date.now()) {
		const remainingTime = cooldown.cooldownExpiration - Date.now();
		const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
		const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);

		const timeLeft = {
			hours: hours,
			minutes: minutes
		};
		const ans = {
			status: false,
			timeLeft: timeLeft
		}
		return ans;
	}
	const newCooldown = {
		userId: userId,
		cooldownExpiration: Date.now() + newTime
	};
	cooldown = await Schema.findOneAndUpdate(
		{userId: userId},
		newCooldown,
		{ upsert: true, new: true } // upsert: tạo nếu không tìm thấy, new: trả về tài liệu đã cập nhật
	);
	const ans = {
		status: true,
	}
	return ans;
}

module.exports = {
	getRandomInt,
	convertInt,
	checkCoolDown
};