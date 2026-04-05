import fs from 'fs';
import chalk from 'chalk';
import { Client, GatewayIntentBits, Collection, InteractionType, CommandInteraction } from 'discord.js';
import env from 'dotenv';
import { queue } from '../Classes/queue';

env.config({
    path: './config/.env',
});

const token: string | undefined = process.env.TOKEN;

const client: Client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
});

interface Command {
    data: { name: string };
    execute: (interaction: CommandInteraction, serverQueue: queue | undefined, assets: Record<string, string>) => Promise<void>;
}

// Command handler
const commands: Collection<string, Command> = new Collection();
const commandFiles: string[] = fs.readdirSync('./Commands').filter((file: string) => file.endsWith('.ts'));

for (const file of commandFiles) {
    void import(`../Commands/${file}`).then((commandModule: { default: Command }) => {
        const command = commandModule.default;
        commands.set(command.data.name, command);
    });
}

// Assets Loader
const assetFile = fs.readFileSync('./Config/assets.json');
const assets: Record<string, string> = JSON.parse(assetFile.toString()) as Record<string, string>;

const serverQueueCollection: Collection<string, queue> = new Collection();

client.on('clientReady', () => {
    if (!client.user) {
        throw new Error('No user');
    }
    console.log(`Logged in as ${chalk.cyanBright(client.user.tag)}!`);
});

async function handleCommand(interaction: CommandInteraction) {
    const command = commands.get(interaction.commandName);
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
    } catch (err: unknown) {
        logError(err instanceof Error ? err : new Error(String(err)), interaction.commandName);
        void interaction.editReply({
            content: 'Sorry! An Error has ocurred while executing this command :(',
        });
    }
}

client.on('interactionCreate', interaction => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    void handleCommand(interaction);
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

    const stack = e.stack ? e.stack.substring(0, 1000).split('\n').join('\n\t') + '...' : 'Unknown';

    console.log(
        chalk.bgRedBright('# An Error has ocurred while executing a command:\n') +
            `\tCommand: ${chalk.yellowBright(command)}\n` +
            `\tName: ${chalk.redBright(e.name)}\n` +
            `\tCause: ${String(e.cause)}\n` +
            `\tStack: ${chalk.redBright(stack)}`,
    );
}

void client.login(token);
