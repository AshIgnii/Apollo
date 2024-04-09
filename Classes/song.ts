export class song {
	owner: number;
	id: string;

	title?: string;
	durationSec?: number;
	thumbnailURL?: string;

	constructor(youtubeID: string, userID: number) {
		this.id = youtubeID;
		this.owner = userID;
	}
}
