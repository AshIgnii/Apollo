import { ShardingManager, Shard } from 'discord.js';
import chalk from 'chalk';

import dotenv from 'dotenv';
dotenv.config({
	path: './config/.env',
});

const clientToken: string | undefined = process.env.TOKEN;
if (!clientToken) {
	throw new Error('Unable to retrieve .env');
}


const manager: ShardingManager = new ShardingManager('./src/main.ts', {totalShards: "auto", token: clientToken, execArgv: ['-r', 'ts-node/register'] });

manager.on('shardCreate', (shard: Shard) => console.log(`Launched ${chalk.greenBright('Shard')}${chalk.rgb(random255(), random255(), random255()).bold(`#${shard.id}`)}`));
manager.spawn();

function random255(): number {
	return Math.floor(Math.random() * 255);
}