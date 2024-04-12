import { EmbedBuilder, Message } from 'discord.js';
import { queue } from '../Classes/queue';
import { readFileSync } from 'fs';
import { track } from '../Classes/track';

export async function refreshPlayingMSG(sQueue: queue, interaction: any): Promise<void> {
	let playingMSG: Message | undefined = sQueue.getMessage();
	let currentTrack: track = sQueue.getTrack();

	let trackTitle: string | undefined;
	let thumbnail: string | null = null;
	if (currentTrack !== undefined) {
		trackTitle = currentTrack.title;
		if (currentTrack.thumbnailURL !== undefined) {
			thumbnail = currentTrack.thumbnailURL;
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
			.setDescription(trackTitle ?? 'No title')
			.setTimestamp(interaction.createdTimestamp);
		const locales: any = {
			'pt-BR': new EmbedBuilder()
				.setAuthor({
					name: 'Tocando 💿',
					iconURL: interaction.client.user.avatarURL().toString(),
				})
				.setThumbnail(thumbnail)
				.setColor('Blue')
				.setDescription(trackTitle ?? 'No title')
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
			.setDescription(trackTitle ?? 'No title')
			.setTimestamp(interaction.createdTimestamp);
		const locales: any = {
			'pt-BR': new EmbedBuilder()
				.setAuthor({
					name: 'Tocando 💿',
					iconURL: interaction.client.user.avatarURL().toString(),
				})
				.setThumbnail(thumbnail)
				.setColor('Blue')
				.setDescription(trackTitle ?? 'No title')
				.setTimestamp(interaction.createdTimestamp),
		};

		playingMSG = await playingMSG.edit({
			embeds: [locales[interaction.locale] ?? defaultEmbed],
		});
		sQueue.setMessage(playingMSG);
	}
}
