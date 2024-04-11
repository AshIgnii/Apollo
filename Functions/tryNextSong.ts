import { SoundCloudStream, YouTubeStream, stream } from "play-dl";
import { queue } from "../Classes/queue";
import { song } from "../Classes/song";

export async function tryNextSong(serverQueue: queue, interaction: any): Promise<YouTubeStream | SoundCloudStream | undefined> {
    serverQueue.shiftQueue()
    let nextSongs: song[] = serverQueue.getAllSongs()
    let newaudioStream: YouTubeStream | SoundCloudStream
    
    // TODO: talvez um video com erro funcione se tentar mais de uma vez
    for (let i: number = 0; i < nextSongs.length; i++) {
        const nextSong = nextSongs[i]
        try {
            newaudioStream = await stream(nextSong.id);
        } catch (e) {
            const locales: any = {
                'pt-BR': 'Um erro ocorreu ao tocar uma das musicas na fila.',
            }
            await interaction.channel.send({
                content: locales[interaction.locale] ?? 'An error has occured while trying to play one of the songs from the queue',
            });
            console.warn(e);
            serverQueue.shiftQueue();
            continue;
        }

        return newaudioStream;
    }

    return undefined;
}