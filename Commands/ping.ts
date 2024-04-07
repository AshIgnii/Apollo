import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';

const command = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Checks the bot latency'),
	async execute(interaction: CommandInteraction) {
		const cDate = Date.now();
		const ping = (Math.abs(interaction.createdTimestamp - cDate));
		const api = Math.abs(interaction.client.ws.ping);

		const embed = new EmbedBuilder()
			.setAuthor({
				name: 'Pong!',
				iconURL: 'https://images.emojiterra.com/twitter/v13.1/512px/1f3d3.png',
			})
			.setColor('Green')
			.setDescription(`💻 Your latency with Apollo is: \`${ping}ms\`. \n 📡 My latency with the Discord API is: \`${api}ms\``)
			.setTimestamp(interaction.createdTimestamp);

		await interaction.editReply({
			embeds: [embed],
		});
	},
};

export default command;