const { SlashCommandBuilder, EmbedBuilder, SlashCommandStringOption } = require('discord.js')
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice')
const { getQueue } = require('../util.js')
const fs = require('fs')
const ytsr = require('ytsr');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Adds a song to the queue to be played')
        .addStringOption(option =>
            option
                .setName('song')
                .setDescription('URL or search query for a song')
                .setRequired(true)
        ),
    async execute(interaction) {
        const voiceState = interaction.member.voice
        const voiceChannel = interaction.guild.channels.cache.find(channel => channel.id == voiceState.channelId)
        let connection = getVoiceConnection(voiceChannel.guild.id)
        let alreadyInChannel = false

        if (voiceState.channelId === null) {
            await interaction.editReply({
                content: 'You need to be in a voice channel in order to use this command',
                ephemeral: true
            })
            return
        } else if (voiceState.joinable === false) {
            await interaction.editReply({
                content: 'I dont have access to your current voice channel',
                ephemeral: true
            })
            return
        } else if (connection !== undefined) {
            let currentChannel = await interaction.guild.channels.cache.find(channel => channel.id == connection.joinConfig.channelId)
            if (currentChannel.id != voiceChannel.id) {
                if (currentChannel.members.size > 1) {
                    await interaction.editReply({
                        content: 'Im already connected to another voice channel',
                        ephemeral: true
                    })
                    return
                } else if (currentChannel.members.size == 1) {
                    let queue = await getQueue(interaction.guild)
                    if (typeof queue == 'string') {
                        queue = JSON.parse(queue)
                    }

                    let channelQueue = queue.channels.find((obj) => obj.channel == currentChannel.id)
                    if (typeof channelQueue != 'undefined' || channelQueue != null) {
                        await queue.channels.splice(queue.channels.indexOf(`${currentChannel.id}`), 1)
                        fs.writeFileSync(`./queue/${interaction.guild.id}.json`, JSON.stringify(queue))
                    }

                    connection.disconnect()
                    connection.destroy()
                }
            } else {
                alreadyInChannel = true
            }
        } else {
            let queue = await getQueue(interaction.guild)
            if (typeof queue == 'string') {
                queue = JSON.parse(queue)
            }

            if (queue.channels.size > 0) {
                let stringJSON = `{
                    "channel": "${voiceChannel.id}", 
                    "queue": [] 
                }`
                stringJSON = JSON.parse(stringJSON)
                queue.channels.push(stringJSON)
                fs.writeFileSync(`./queue/${interaction.guild.id}.json`, JSON.stringify(queue))
            }
        }

        let queue = await getQueue(interaction.guild)

        if (typeof queue == 'string') {
            queue = JSON.parse(queue)
        }

        if (!alreadyInChannel) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            })
        }

        let song = interaction.options.getString('song')

        let channelQueue = queue.channels.find((obj) => obj.channel == voiceChannel.id)

        if (typeof channelQueue == 'undefined' || channelQueue == null) {
            let stringJSON = `{
                "channel": "${voiceChannel.id}", 
                "queue": ["${song}"] 
            }`
            stringJSON = JSON.parse(stringJSON)
            queue.channels.push(stringJSON)
            fs.writeFileSync(`./queue/${interaction.guild.id}.json`, JSON.stringify(queue))
        } else {
            queue.channels.find((obj) => obj.channel == voiceChannel.id).queue.push(`${song}`)
            fs.writeFileSync(`./queue/${interaction.guild.id}.json`, JSON.stringify(queue))
        }

        await interaction.editReply({
            content: '👍'
        })
    },
};
