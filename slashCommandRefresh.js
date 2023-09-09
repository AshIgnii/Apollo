//Libs
const fs = require('fs')
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

const commands = new Array()
const commandDir = './commands'
const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const command = require(`./commands/${file}`)

    if (typeof command != 'undefined' && typeof command.data != 'undefined') {
        commands.push(command.data.toJSON())
    } else {
        console.log('No command data. Skipping file...')
    }
}

const rest = new discord.REST({ version: '10' }).setToken(token)

rest.put(discord.Routes.applicationCommands(clientID), { body: commands })
    .then(() => console.log('successfully refreshed commands'))
    .catch(console.error)