import fs from 'fs';
import chalk from 'chalk';
import { Client, GatewayIntentBits, Collection, InteractionType } from 'discord.js';
import env from 'dotenv';
import { queue } from '../Classes/queue';

env.config({
	path: './config/.env',
});

const token: string | undefined = process.env.TOKEN;

const client: Client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
	],
});

// Command handler
const commands: Collection<string, any> = new Collection();
const commandFiles: string[] = fs
	.readdirSync('./Commands')
	.filter((file: string) => file.endsWith('.ts'));

for (const file of commandFiles) {
	import(`../Commands/${file}`).then(commandModule => {
		const command = commandModule.default;
		commands.set(command.data.name, command);
	});
}

// Assets Loader
const assetFile = fs.readFileSync('./Config/assets.json');
const assets = JSON.parse(assetFile.toString());


const serverQueueCollection: Collection<string, queue> = new Collection();

client.on('ready', () => {
	if (!client.user) {
		throw new Error('No user');
	}
	console.log(`Logged in as ${chalk.cyanBright(client.user.tag)}!`);
});

client.on('interactionCreate', async (interaction) => {
	if (interaction.type !== InteractionType.ApplicationCommand) return;

	const command: any = commands.get(interaction.commandName);

	try {
		if (!command) {
			throw new Error('Slash command does not exist?');
		}

		await interaction.deferReply();

		let serverQueue: queue | undefined;
		if (interaction.guildId) {
			serverQueue = serverQueueCollection.get(interaction.guildId);

			if (serverQueue == undefined) {
				serverQueue = new queue(interaction.guildId);
				serverQueueCollection.set(interaction.guildId, serverQueue);
			}
		}

		await command.execute(interaction, serverQueue, assets);
	} catch (err: any) {
		logError(err, interaction.commandName);
		interaction.editReply({
			content: 'Sorry! An Error has ocurred while executing this command :(',
		});
	}
});

function logError(e: Error, command: string) {
	if (typeof command == 'undefined') {
		command = 'Unknown';
	}
	if (typeof e.cause == 'undefined') {
		e.cause = chalk.yellowBright('Unknown');
	} else {
		e.cause = chalk.redBright(e.cause);
	}

	let stack: string | boolean = false;
	if (e.stack) {
		stack = e.stack.substring(0, 1000).split('\n').join('\n\t') + '...';
	} else {
		stack = 'Unknown';
	}

	console.log(
		chalk.bgRedBright('# An Error has ocurred while executing a command:\n') +
		`\tCommand: ${chalk.yellowBright(command)}\n` +
		`\tName: ${chalk.redBright(e.name)}\n` +
		`\tCause: ${e.cause}\n` +
		`\tStack: ${chalk.redBright(stack)}`,
	);
}

client.login(token);
