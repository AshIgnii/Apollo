const fs = require('fs')
const ytsr = require('ytsr')
const playdl = require('play-dl')
const { createAudioResource, StreamType, createAudioPlayer, getVoiceConnection, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require('@discordjs/voice')

async function queueTemplate() {
    let template = fs.readFileSync('./queue/queueTemplate.json', { encoding: 'utf8', flag: 'r' })
    if (typeof template == 'string') {
        template = JSON.parse(template)
    }

    return template
}

async function getQueue(server) {
    let serverQueue
    let serverID = server.id

    if (!fs.existsSync('./queue/')) {
        fs.mkdirSync('./queue')
    }

    let files = fs.readdirSync('./queue')
    if (typeof files != 'undefined' && typeof err == 'undefined') {
        let queueFile = files.find((fileName) => fileName == `${serverID}.json`) //Check if queue already exists
        if (typeof queueFile != 'undefined') { //Return existing queue data
            serverQueue = fs.readFileSync(`./queue/${queueFile}`, { encoding: 'utf8', flag: 'r' })
            
            if (typeof serverQueue == 'string') {
                serverQueue = JSON.parse(serverQueue)
            }
            return serverQueue
        } else {
            console.log(`Creating queue for guild: ${server.name}`)
            
            let queueTemplate = {
                'serverName': server.name,
                'channels': []
            }

            fs.writeFileSync(`./queue/${serverID}.json`, JSON.stringify(queueTemplate)) //Create new queue file
            let files = fs.readdirSync(`./queue/`)
            let newFile = files.find((fileName) => fileName == `${serverID}.json`)

            if (typeof newFile == 'undefined') {
                let err = new Error('Something went wrong while creating the file 🤔')
                logError(err)

                return undefined
            } else {
                serverQueue = fs.readFileSync(`./queue/${newFile}`, { encoding: 'utf8', flag: 'r' })
            }
        }

        if (typeof serverQueue == 'string') {
            serverQueue = JSON.parse(serverQueue)
        }
        return serverQueue
    }
}

function validYTURL(str, returnArray=false) {
    RegExp.quote = function(str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
   };
    let pattern = new RegExp(RegExp.quote('/^(?:(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/oembed\?url=)?(?:https?(?:%3A|:)\/\/)?(?:www\.)?(?:m\.)?(?:youtube(?:-nocookie)?\.com|youtu\.be)\/(?:attribution_link\?a=[[a-zA-Z\d-]*&u=(?:%2F|\/))?(watch|embed\/|playlist|(?:v|e)\/)?(?:\?|%3F|&)?(?:(?:(?:feature|app)\=\w*&)?(?:v|list)(?:\=|\%3D))?((?:-|_|(?!list|feature|app)[a-zA-Z\d])*)(?:(?:(?:\?|&|#|%26|;)(?:si|feature|playnext_from|version|fs|format|videos|autohide|hl|rel|amp)(?:=|%3D)?[\w\-\.]*)*)?(?:(?:&|\?|#)(?:list=([\w\-]*)))?(?:(?:&|\?|#)t=((?:\d*[hms]?)*))?(?:(?:(?:&|\?|#)(?:index|shuffle)=\d*)*)?/'))
    if (returnArray) {
        return pattern.exec(str)
    } else {
        return pattern.test(str)
    }
  }

/**
* @param {(String)} linkOrQuery - A youtube link or a search query
* @returns {(String[], boolean)} If link contains a playlist and video(s) ID
**/
async function YTInput(linkOrQuery) {
    if (validYTURL(linkOrQuery, false)) {
        //Link
        let videoWithPL = 0
        let capGroups = validYTURL(linkOrQuery, true)
        
        if (capGroups[0].length === 0) {
            capGroups[0] = 'watch'
        }

        if (capGroups[0] !== 'playlist') {
            if (capGroups[2].length > 0) {
                videoWithPL = 1
            }
            return [capGroups[1]], videoWithPL
        } else if (capGroups[0] === 'playlist') return searchPL(capGroups[1]), videoWithPL
    } else {
        //Search Query
        const limit = 100
        let searchResult = await ytsr(linkOrQuery, {
            limit:limit
        })
        
        let video = null
        for (i = 0; i < searchResult.items; i++) {
            if (searchResult.items[i].type === 'video') {
                video = searchResult.items[i]
                break
            }
        }

        if (video !== null) {
            return video.id, false
        }
    }
}

/**
 * @param {String} action - play, add, seek, skip or stop
 * @param {(Number|String[])} arg - Second to seek to or array of song IDs
 * @param {Object[]} guildAndChannel - Object containing the guild and voice channel IDs
 * @param {String} guildAndChannel.channelID - Voice channel ID
 * @param {Object[]} guildAndChannel.guild - Guild object
 */
async function ApolloPlayer(guildAndChannel, action, arg, connection, jump='0s') {
    let guild = guildAndChannel.guild
    let vcID = guildAndChannel.channelID

    console.log(action)

    switch (action) {
        case 'play':
            let queue = await getQueue(guild)
            let channel = queue.channels.find((obj) => obj.channel == vcID)
            let player = channel.audioPlayer
            connection = getVoiceConnection(guild.id)

            if (player == null) {
                player = createAudioPlayer()
            }

            let getSong = await playdl.stream(arg[0].toString())
            let resource = createAudioResource(getSong.stream, {
                inputType: getSong.type
            })

            try {
                await entersState(connection, VoiceConnectionStatus.Ready, 5000)
            } catch (error) {
                console.log("Voice Connection not ready within 5s.", error)
                return
            }

            let subscription = connection.receiver.subscriptions
            if (subscription.size > 0) {
                subscription = subscription[0]
            } else if (subscription.size == 0 ||  subscription == 'undefined') {
                subscription = connection.subscribe(player)
            }

            player.play(resource)

            return player
    }
}
function searchPL(id) {

}

module.exports = { getQueue, YTInput, queueTemplate, ApolloPlayer }