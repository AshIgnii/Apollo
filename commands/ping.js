const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks the bot latency'),
    async execute(interaction) {
        let cDate = Date.now()
        let ping = (Math.abs(interaction.createdTimestamp - cDate))
        let api = Math.abs(interaction.client.ws.ping)

        let embed = new EmbedBuilder()
            .setAuthor({
                name: 'Pong!',
                iconURL: 'https://images.emojiterra.com/twitter/v13.1/512px/1f3d3.png'
            })
            .setColor('Green')
            .setDescription(`💻 Your latency with Apollo is: \`${ping}ms\`. \n 📡 My latency with the Discord API is: \`${api}ms\``)
            .setTimestamp(interaction.createdTimestamp)

        await interaction.editReply({
            embeds: [embed]
        });
    },
};
