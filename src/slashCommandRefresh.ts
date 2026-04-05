import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'node:fs';
import env from 'dotenv';

env.config({
    path: './config/.env',
});

const token: string | undefined = process.env.TOKEN;
const clientId: string | undefined = process.env.CLIENT_ID;

interface CommandModule {
    data: SlashCommandBuilder;
    execute: unknown;
}

const commands: unknown[] = [];
const commandsPath = './Commands';
const commandFiles: string[] = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.ts'));

async function register() {
    for (const file of commandFiles) {
        const commandModule = (await import(`../Commands/${file}`)) as { default: CommandModule };
        const command = commandModule.default;
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`Found ${command.data.name}! \n\t${JSON.stringify(command.data)} \n`);
        } else {
            console.log(`[WARNING] The command at ${`../Commands/${file}`} is missing a required "data" or "execute" property.`);
        }
    }

    if (token && clientId) {
        const rest = new REST().setToken(token);

        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);

            const data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
            const commandCount = Array.isArray(data) ? data.length : 0;

            console.log(`Successfully reloaded ${commandCount} application (/) commands.`);
        } catch (error) {
            console.error(error);
        }
    }
}

void register();
