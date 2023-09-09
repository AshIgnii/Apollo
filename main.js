//Libs
const fs = require('fs')
const chalk = require('chalk')
const discord = require('discord.js')
const env = require('dotenv').config({
    path: './config/.env'
})

//Setup
if (env.error) {
    console.error(new Error('Unable to retrieve .env'))
    return
}
const token = process.env.TOKEN
const clientID = process.env.CLIENT_ID

//Client
const GatewayIntentBits = discord.GatewayIntentBits
const client = new discord.Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages]
})

//Commands setup
client.commands = new discord.Collection();
const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const command = require(`./Commands/${file}`)
    client.commands.set(command.data.name, command)
}

//ready event
client.on('ready', () => {
    console.log(`Logged in as ${chalk.cyanBright(client.user.tag)}!`)
})

//interactionCreate event
client.on('interactionCreate', async interaction => {
    if (interaction.type !== discord.InteractionType.ApplicationCommand) return

    const command = client.commands.get(interaction.commandName)
    if (!command) return

    try {
        await interaction.deferReply()
        await command.execute(interaction)
    } catch (e) {
        let stack = e.stack.split('at')
        console.log(chalk.bgRedBright('# An Error has ocurred while executing a command: ') + `\n\t Command: ${chalk.yellowBright(interaction.commandName)} \n\t Name: ${chalk.redBright(e.name)} \n\t Cause: ${chalk.redBright(e.cause)} \n\t Stack: ${chalk.redBright(stack[0] + '\t\t at' + stack[1].replace('\n', ''))}`)
        interaction.editReply({content: 'Sorry! An Error has ocurred while executing this command :('})
    }
})

//login
client.login(token)