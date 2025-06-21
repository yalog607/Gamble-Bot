const fs = require("node:fs");
const path = require("node:path");
const { Events, Collection, Client, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessagePolls,
	],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith(".js"));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ("data" in command && "execute" in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
			);
		}
	}
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.prefix = new Collection();
const prefixFolderPath = path.join(__dirname, "prefix");
const prefixFolder = fs.readdirSync(prefixFolderPath);
for (const prefixInFolders of prefixFolder) {
	const prefixFilesPath = path.join(prefixFolderPath, prefixInFolders);
	const prefixFiles = fs
		.readdirSync(prefixFilesPath)
		.filter((file) => file.endsWith(".js"));
	for (const prefixFile of prefixFiles) {
		const prefix = path.join(prefixFilesPath, prefixFile);
		const prefixCommand = require(prefix);
		if ("name" in prefixCommand && "run" in prefixCommand) {
			client.prefix.set(prefixCommand.name, prefixCommand);
		} else {
			console.log(
				`[WARNING] The prefix at ${prefPath} is missing a required "name" or "run" property.`
			);
		}
	}
}

client.cooldowns = new Collection();
client.cooldownsPrefix = new Collection();

client.login(token);
