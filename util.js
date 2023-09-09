const fs = require('fs')

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
        return JSON.parse(serverQueue)
    }
}

module.exports = { getQueue }