const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../util.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the song and clears the queue'),
    async execute(interaction) {
        //TODO
    },
};
