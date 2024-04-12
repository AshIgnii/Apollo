import { AudioPlayer } from '@discordjs/voice';
import { track } from './track';
import { Message } from 'discord.js';

export class queue {
	serverID: string;
	channelID?: number;
	private timeout?: any;
	private playerMSG?: Message;
	private player?: AudioPlayer;
	private playing: boolean;
	private paused: boolean;
	private tracks: track[];

	constructor(server: string, voiceChannelID?: number) {
		this.serverID = server;
		this.playing = false;
		this.paused = false;
		this.tracks = new Array<track>();

		if (voiceChannelID !== undefined) {
			this.channelID = voiceChannelID;
		}
	}

	public addTrack(newTrack: track | track[]): void {
		if (Array.isArray(newTrack)) {
			for (let i: number = 0; i < newTrack.length; i++) {
				this.tracks.push(newTrack[i]);
			}
		} else {
			this.tracks.push(newTrack);
		}
	}

	public getTrack(index?: number): track {
		if (index !== undefined) {
			return this.tracks[index];
		} else {
			return this.tracks[0];
		}
	}

	public getAllTracks(): track[] {
		return this.tracks;
	}

	public shiftQueue(): void {
		this.tracks.shift();
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
		this.tracks = new Array<track>();
	}

	public setLeaveTimeout(t: any): void {
		this.timeout = t;
	}
	public getLeaveTimeout(): any {
		return this.timeout
	}
}
