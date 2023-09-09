const discord = require('discord.js');
const chalk = require('chalk')
const env = require('dotenv').config({
    path: './config/.env'
})

if (env.error) {
    console.error(new Error('Unable to retrieve .env'))
    return
}
const token = process.env.TOKEN

const manager = new discord.ShardingManager('./main.js', { token: token });

manager.on('shardCreate', shard => console.log(`Launched ${chalk.greenBright('Shard')}${chalk.rgb(random255(), random255(), random255()).bold(`#${shard.id}`)}`));
manager.spawn();

function random255() {
    return Math.floor(Math.random() * 255)
}