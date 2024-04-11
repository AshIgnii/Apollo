import { result } from "@distube/ytpl";
import { song } from "./song";
import { readFileSync } from 'fs';


export class playlist {
    id: string;
    title: string;
    thumbnailURL: string;
    private songs: song[];

    constructor(playlist: result, userID: number) {
        this.id = playlist.id;
        this.title = playlist.title;
        this.songs = new Array<song>();

        if (playlist.items.length > 0) {
            this.thumbnailURL = playlist.items[0].thumbnail;

            const items = playlist.items;
            for (let i: number = 0; i < items.length; i++) {
                const item = items[i]
                const id = item.id;

                const newSong = new song(id, userID);
                newSong.thumbnailURL = item.thumbnail;
                newSong.title = item.title; 
                newSong.durationSec = parseInt(item.duration ?? '0')

                this.songs.push(newSong);
            }
        } else {
            const assetFile = readFileSync('./Config/assets.json');
            const jsonData = JSON.parse(assetFile.toString());

            this.thumbnailURL = jsonData['no-thumbnail'];
        }
    }

    public getSongs(): song[] {
        return this.songs;
    }
}
