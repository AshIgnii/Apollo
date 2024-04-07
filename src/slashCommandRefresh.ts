import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import env from 'dotenv';

env.config({
	path: './config/.env',
});

const token: string | undefined = process.env.TOKEN;
const clientID: string | undefined = process.env.CLIENT_ID;


const commands: any = [];
const commandsPath = './Commands';
const commandFiles: string[] = fs
	.readdirSync(commandsPath)
	.filter((file: string) => file.endsWith('.ts'));

async function register() {
	for (const file of commandFiles) {
		const commandModule = await import(`../Commands/${file}`);
		const command = commandModule.default;
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
			console.log(`Found ${command.data.name}! \n\t${JSON.stringify(command.data)} \n`);
		} else {
			console.log(`[WARNING] The command at ${`../Commands/${file}`} is missing a required "data" or "execute" property.`);
		}

	}

	if (token && clientID) {
		const rest = new REST().setToken(token);

		(async () => {
			try {
				console.log(`Started refreshing ${commands.length} application (/) commands.`);

				const data: any = await rest.put(
					Routes.applicationCommands(clientID),
					{ body: commands },
				);

				console.log(`Successfully reloaded ${data.length} application (/) commands.`);
			} catch (error) {
				console.error(error);
			}
		})();
	}
}

register();