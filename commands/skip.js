const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../util.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips to the next song on the queue'),
    async execute(interaction) {
        //TODO
    },
};
