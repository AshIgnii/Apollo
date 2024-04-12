import { SoundCloudStream, YouTubeStream, stream } from "play-dl";
import { queue } from "../Classes/queue";
import { track } from "../Classes/track";

export async function getNextAvailableStream(serverQueue: queue, interaction: any): Promise<YouTubeStream | SoundCloudStream | undefined> {
    let nextTracks: track[] = serverQueue.getAllTracks()
    let newaudioStream: YouTubeStream | SoundCloudStream | undefined;

    for (let i: number = 0; i < nextTracks.length; i++) {
        const nextSong = nextTracks[i]

        let tries: number = 0;
        while (tries < 3 ) {
            let eCatch: boolean = false;
            try {
                newaudioStream = await stream(nextSong.id);
            } catch (e: unknown) {
                eCatch = true;

                if (e instanceof Error) {
                    console.warn(e.message);
                } else {
                    console.warn(e);
                }
            }

            if (eCatch == false && newaudioStream !== undefined) {
                for(let j: number = 0; j < i; j++) {
                    serverQueue.shiftQueue();
                }
                return newaudioStream;
            }

            tries++;
        }

        const locales: any = {
            'pt-BR': 'Ocorreu um erro ao reproduzir uma das músicas na fila.',
        }
        await interaction.channel.send({
            content: locales[interaction.locale] ?? 'An error has occured while trying to play one of the songs from the queue',
        });
    }

    return undefined;
}