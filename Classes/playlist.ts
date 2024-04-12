import { result } from "@distube/ytpl";
import { track } from "./track";
import { readFileSync } from 'fs';


export class playlist {
    id: string;
    title: string;
    thumbnailURL: string;
    private tracks: track[];

    constructor(playlist: result, userID: number) {
        this.id = playlist.id;
        this.title = playlist.title;
        this.tracks = new Array<track>();

        if (playlist.items.length > 0) {
            this.thumbnailURL = playlist.items[0].thumbnail;

            const items = playlist.items;
            for (let i: number = 0; i < items.length; i++) {
                const item = items[i]
                const id = item.id;

                const newTrack = new track(id, userID);
                newTrack.thumbnailURL = item.thumbnail;
                newTrack.title = item.title; 
                newTrack.durationSec = parseInt(item.duration ?? '0')

                this.tracks.push(newTrack);
            }
        } else {
            const assetFile = readFileSync('./Config/assets.json');
            const jsonData = JSON.parse(assetFile.toString());

            this.thumbnailURL = jsonData['no-thumbnail'];
        }
    }

    public getTracks(): track[] {
        return this.tracks;
    }
}
