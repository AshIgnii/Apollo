const { SlashCommandBuilder, EmbedBuilder, SlashCommandStringOption } = require('discord.js')
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice')
const { getQueue, YTInput, queueTemplate } = require('../util.js')
const fs = require('fs')
const ytdl = require('ytsr');

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
        let song = interaction.options.getString('song')
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

            if (queue.channels.size > 0) {
                let stringJSON = queueTemplate()
                stringJSON.channel = currentChannel.id

                let otherSongs = queue.channels.find((obj) => obj.channel == currentChannel.id).queue
                if (typeof otherSongs != 'undefined' && otherSongs != null) {
                    stringJSON.queue = queue.channels.find((obj) => obj.channel == currentChannel.id).queue
                }

                stringJSON.queue.push(song)

                queue.channels[`${currentChannel.id}`] = stringJSON

                fs.writeFileSync(`./queue/${interaction.guild.id}.json`, JSON.stringify(queue))
            }
        }

        let queue = await getQueue(interaction.guild)

        if (!alreadyInChannel) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            })
        }

        let channelQueue = queue.channels.find((obj) => obj.channel == voiceChannel.id)

        if (typeof channelQueue == 'undefined' || channelQueue == null) {
            let stringJSON = queueTemplate()
            stringJSON.channel = currentChannel.id

            stringJSON.queue.push(song)

            queue.channels[`${currentChannel.id}`] = stringJSON

            fs.writeFileSync(`./queue/${interaction.guild.id}.json`, JSON.stringify(queue))
        } else {
            queue.channels.find((obj) => obj.channel == voiceChannel.id).queue.push(`${song}`)
            fs.writeFileSync(`./queue/${interaction.guild.id}.json`, JSON.stringify(queue))
        }

        //Play video
        if (connection === undefined) {
            throw new Error(`Connection Lost. Guild:${interaction.guild.id}`)
        }

        let serverQueue = getQueue(connection.joinConfig.guildId).channels.find(channel => channel.id == connection.joinConfig.channelId)

        let songsQueue = serverQueue.queue
        if (songsQueue.length > 1) {
            serverQueue.queue.shift()
            fs.writeFileSync(`./queue/${connection.joinConfig.guildId}.json`, JSON.stringify(serverQueue))
        }

        let videoID = YTInput(songsQueue[0])

        await interaction.editReply({
            content: '👍'
        })
    },
};
