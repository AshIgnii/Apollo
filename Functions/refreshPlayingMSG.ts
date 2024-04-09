import { EmbedBuilder } from 'discord.js';
import { song } from '../Classes/song';
import { queue } from '../Classes/queue';
import { readFileSync } from 'fs';

export async function refreshPlayingMSG(currentSong: song | undefined, sQueue: queue, interaction: any): Promise<void> {
	let playingMSG = sQueue.getMessage();

	let songTitle: string | undefined;
	let thumbnail: string | null = null;
	if (currentSong !== undefined) {
		songTitle = currentSong.title;
		if (currentSong.thumbnailURL !== undefined) {
			thumbnail = currentSong.thumbnailURL;
		}
	}
	if (thumbnail === null) {
		const assetFile = readFileSync('./Config/assets.json');
		const jsonData = JSON.parse(assetFile.toString());

		thumbnail = jsonData['no-thumbnail'];
	}

	if (playingMSG === undefined) {
		const defaultEmbed = new EmbedBuilder()
			.setAuthor({
				name: 'Playing 💿',
				iconURL: interaction.client.user.avatarURL().toString(),
			})
			.setColor('Blue')
			.setThumbnail(thumbnail)
			.setDescription(songTitle ?? 'No title')
			.setTimestamp(interaction.createdTimestamp);
		const locales: any = {
			'pt-BR': new EmbedBuilder()
				.setAuthor({
					name: 'Tocando 💿',
					iconURL: interaction.client.user.avatarURL().toString(),
				})
				.setThumbnail(thumbnail)
				.setColor('Blue')
				.setDescription(songTitle ?? 'No title')
				.setTimestamp(interaction.createdTimestamp),
		};

		playingMSG = await interaction.channel.send({
			embeds: [locales[interaction.locale] ?? defaultEmbed],
		});

		if (playingMSG !== undefined) {
			sQueue.setMessage(playingMSG);
		} else {
			console.warn('\"channel.send\" didn\'t return a message?!?');
		}
	} else {
		const defaultEmbed = new EmbedBuilder()
			.setAuthor({
				name: 'Playing 💿',
				iconURL: interaction.client.user.avatarURL().toString(),
			})
			.setThumbnail(thumbnail)
			.setColor('Blue')
			.setDescription(songTitle ?? 'No title')
			.setTimestamp(interaction.createdTimestamp);
		const locales: any = {
			'pt-BR': new EmbedBuilder()
				.setAuthor({
					name: 'Tocando 💿',
					iconURL: interaction.client.user.avatarURL().toString(),
				})
				.setThumbnail(thumbnail)
				.setColor('Blue')
				.setDescription(songTitle ?? 'No title')
				.setTimestamp(interaction.createdTimestamp),
		};

		playingMSG = await playingMSG.edit({
			embeds: [locales[interaction.locale] ?? defaultEmbed],
		});
		sQueue.setMessage(playingMSG);
	}
}
