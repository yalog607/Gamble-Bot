const { Events, ActivityType } = require('discord.js');
const mongoose = require("mongoose");

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
        const MONGO_URL = require("../config.json").MONGO_URL;
		const conn = mongoose.connect(MONGO_URL);
		if (!conn) console.log('Cannot connect to Database');
		else console.log("Connect to Database successfully");
		await client.guilds.fetch();
		let serverCount = client.guilds.cache.size;
		client.user.setPresence({
			status: 'idle',
			activities: [{ name: `with ${serverCount} servers`, type: ActivityType.Streaming }],
		})
	},
};