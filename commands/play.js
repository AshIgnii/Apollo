const { SlashCommandBuilder, EmbedBuilder, SlashCommandStringOption } = require('discord.js')
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice')
const { getQueue, YTInput, queueTemplate, ApolloPlayer } = require('../util.js')
const fs = require('fs')

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
                    stringJSON.queue = otherSongs
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
        
        if (typeof currentChannel == 'undefined') {
            currentChannel = voiceChannel
        }

        if (typeof channelQueue == 'undefined' || channelQueue == null) {
            let stringJSON = await queueTemplate()

            stringJSON.channel = currentChannel.id

            stringJSON.queue.push(song)

            queue.channels.push(stringJSON)

            let writeJSON = JSON.stringify(queue)
            fs.writeFileSync(`./queue/${interaction.guild.id}.json`, writeJSON)
            channelQueue = stringJSON
        } else {
            queue.channels.find((obj) => obj.channel == voiceChannel.id).queue.push(`${song}`)

            let writeJSON = JSON.stringify(queue)
            fs.writeFileSync(`./queue/${interaction.guild.id}.json`, writeJSON)
            channelQueue = queue.channels.find((obj) => obj.channel == voiceChannel.id)
        }

        //Play video
        if (typeof connection == 'undefined') {
            throw new Error(`Connection Lost. Guild:${joinConfig.guildId}`)
        }

        let serverQueue = await getQueue(interaction.client.guilds.cache.find((guild) => guild.id = connection.joinConfig.guildId))
        serverQueueChannel = serverQueue.channels.find((obj) => obj.channel == connection.joinConfig.channelId)

        let songsQueue = serverQueueChannel.queue
        if (songsQueue.length > 1) {
           //TODO
           return
        }

        let videoID = YTInput(songsQueue[0])

        let player = await ApolloPlayer({ channelID: connection.joinConfig.channelId, guild: interaction.client.guilds.cache.find((guild) => guild.id = connection.joinConfig.guildId) }, 'play', [songsQueue], connection)

        player = null //DEBUG

        queue = await getQueue(interaction.client.guilds.cache.find((guild) => guild.id = connection.joinConfig.guildId))
        
        queue.channels.find((obj) => obj.channel == connection.joinConfig.channelId).queue.shift()
        queue.channels.find((obj) => obj.channel == connection.joinConfig.channelId).audioPlayer = player
        fs.writeFileSync(`./queue/${interaction.guild.id}.json`, JSON.stringify(queue))

        await interaction.editReply({
            content: '👍'
        })
    },
};
