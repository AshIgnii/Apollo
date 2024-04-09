import { AudioPlayer } from '@discordjs/voice';
import { song as songClass } from './song';
import { Message } from 'discord.js';

export class queue {
	serverID: string;
	channelID?: number;
	timeout?: any;
	private playerMSG?: Message;
	private player?: AudioPlayer;
	private playing: boolean;
	private paused: boolean;
	private songs: songClass[];

	constructor(server: string, voiceChannelID?: number) {
		this.serverID = server;
		this.playing = false;
		this.paused = false;
		this.songs = new Array<songClass>();

		if (voiceChannelID !== undefined) {
			this.channelID = voiceChannelID;
		}
	}

	public addSong(song: songClass | songClass[]): void {
		if (Array.isArray(song)) {
			for (let i: number = 0; i < song.length; i++) {
				this.songs.push(song[i]);
			}
		} else {
			this.songs.push(song);
		}
	}

	public getSong(index?: number): songClass {
		if (index !== undefined) {
			return this.songs[index];
		} else {
			return this.songs[0];
		}
	}

	public getAllSongs(): songClass[] {
		return this.songs;
	}

	public shiftQueue(): void {
		this.songs.shift();
	}

	public setPlayer(newPlayer: AudioPlayer): void {
		this.player = newPlayer;
	}

	public getPlayer(): AudioPlayer | undefined {
		return this.player;
	}

	public getState(state: string): boolean {
		if (state === 'playing') {
			return this.playing;
		} else if (state === 'paused') {
			return this.paused;
		} else {
			throw new Error('Unknown state');
		}
	}

	public changeState(state: string): void {
		if (state === 'playing') {
			this.playing = !this.playing;
		} else if (state === 'paused') {
			this.paused = !this.paused;
		} else {
			throw new Error('Unknown state');
		}
	}

	public getMessage(): Message | undefined {
		return this.playerMSG;
	}

	public setMessage(msg: Message | undefined): void {
		this.playerMSG = msg;
	}

	public purgeQueue(): void {
		this.songs = new Array<songClass>();
	}
}
