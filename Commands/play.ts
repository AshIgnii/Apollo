import { SlashCommandBuilder, EmbedBuilder, Snowflake } from 'discord.js';
import { InfoData, SoundCloudStream, YouTubeStream, stream, video_basic_info } from 'play-dl';
import { song } from '../Classes/song';
import { queue } from '../Classes/queue';
import { AudioPlayer, AudioPlayerState, AudioPlayerStatus, AudioResource, NoSubscriberBehavior, PlayerSubscription, VoiceConnection, createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel } from '@discordjs/voice';

const command = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays music in your voice channel')
		.setNameLocalizations({
			'pt-BR': 'tocar',
		})
		.setDescriptionLocalizations({
			'pt-BR': 'Toca uma musica em seu canal de voz',
		})
		.addStringOption(option =>
			option
				.setName('song')
				.setDescription('Youtube URL or search query')
				.setNameLocalizations({
					'pt-BR': 'musica',
				})
				.setDescriptionLocalizations({
					'pt-BR': 'Link do Youtube ou termo de busca',
				})
				.setRequired(true),
		),
	async execute(interaction: any, serverQueue: queue) {
		const vc: Snowflake | null = interaction.member.voice.channelId;
		if (vc === null) {
			const locales: any = {
				'pt-BR': 'Você precisa estar conectado em um canal de voz!',
			};

			await interaction.editReply({
				content: locales[interaction.locale] ?? 'You need to be in a voice channel!',
			});
			return;
		}

		const input: string = interaction.options.getString('song');
		const pattern: RegExp = /^(?:(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/oembed\?url=)?(?:https?(?:%3A|:)\/\/)?(?:www\.)?(?:m\.)?(?:youtube(?:-nocookie)?\.com|youtu\.be)\/(?:attribution_link\?a=[[a-zA-Z\d-]*&u=(?:%2F|\/))?(watch|embed\/|playlist|(?:v|e)\/)?(?:\?|%3F|&)?(?:(?:(?:feature|app)=\w*&)?(?:v|list)(?:=|%3D))?((?:-|_|(?!list|feature|app)[a-zA-Z\d])*)(?:(?:(?:\?|&|#|%26|;)(?:si|feature|playnext_from|version|fs|format|videos|autohide|hl|rel|amp)(?:=|%3D)?[\w\-\.]*)*)?(?:(?:&|\?|#)(?:list=([\w\-]*)))?(?:(?:&|\?|#)t=((?:\d*[hms]?)*))?(?:(?:(?:&|\?|#)(?:index|shuffle)=\d*)*)?/gm;
		const inputExec: string[] | null = pattern.exec(input);

		let type: string | undefined;
		let id: string | undefined;
		// let playlistID: string | undefined;
		// let seekTime: string | undefined;

		if (inputExec !== null && inputExec.length > 0) {
			type = inputExec[1];
			id = inputExec[2];
			// playlistID = inputExec[3];
			// seekTime = inputExec[4];
		} else {
			const locales: any = {
				'pt-BR': 'Link inválido.',
			};

			await interaction.editReply({
				content: locales[interaction.locale] ?? 'Invalid URL.',
			});
			return;
		}

		if (serverQueue === undefined) {
			throw new Error('Queue is undefined');
		}

		if (type === 'watch' || type === 'embed' || type === 'v' || type === 'e') {
			const newSong: song = new song(id, interaction.member.id);

			const info: InfoData = await video_basic_info(newSong.id);

			if (info !== undefined) {
				newSong.title = info.video_details.title;
				newSong.durationSec = info.video_details.durationInSec;
			} else {
				newSong.title = 'No title';
				newSong.durationSec = 0;
			}

			serverQueue.addSong(newSong);

			const locales: any = {
				'en-US': new EmbedBuilder()
					.setAuthor({
						name: 'Added to the queue!',
						iconURL: interaction.client.user.avatarURL().toString(),
					})
					.setColor('Red')
					.setDescription(newSong.title ?? 'No title')
					.setTimestamp(interaction.createdTimestamp),
				'pt-BR': new EmbedBuilder()
					.setAuthor({
						name: 'Adicionado a fila!',
						iconURL: interaction.client.user.avatarURL().toString(),
					})
					.setColor('Red')
					.setDescription(newSong.title ?? 'No title')
					.setTimestamp(interaction.createdTimestamp),
			};

			await interaction.editReply({
				embeds: [locales[interaction.locale]],
			});
		}


		if (!serverQueue.getState('playing')) {
			serverQueue.changeState('playing');

			if (serverQueue.timeout !== null || serverQueue.timeout !== undefined) {
				clearTimeout(serverQueue.timeout);
			}

			let connection: VoiceConnection | undefined = getVoiceConnection(interaction.guildId);
			if (connection === undefined) {
				connection = joinVoiceChannel({
					channelId: vc,
					guildId: interaction.guildId,
					adapterCreator: interaction.guild.voiceAdapterCreator,
				});
			}

			let player: AudioPlayer | null | undefined = createAudioPlayer({
				behaviors: {
					noSubscriber: NoSubscriberBehavior.Pause,
				},
			});
			serverQueue.setPlayer(player);

			const subscription: PlayerSubscription | undefined = connection.subscribe(player);

			const audioStream: YouTubeStream | SoundCloudStream = await stream(id);
			const resource: AudioResource = createAudioResource(audioStream.stream, {
				inputType: audioStream.type,
			});

			player.play(resource);

			player.on('stateChange', async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
				if (oldState.status == AudioPlayerStatus.Playing && newState.status == AudioPlayerStatus.Idle) {
					if (!serverQueue.getState('paused')) {
						serverQueue.shiftQueue();
						const nextSong = serverQueue.getSong();

						if (nextSong !== undefined) {
							const newaudioStream = await stream(nextSong.id);
							const newResource: AudioResource = createAudioResource(newaudioStream.stream, {
								inputType: newaudioStream.type,
							});

							player = serverQueue.getPlayer();
							if (player !== null && player !== undefined) {
								player.play(newResource);
							}
						} else {
							serverQueue.changeState('playing');

							if (subscription !== undefined) {
								subscription.unsubscribe();

								player = serverQueue.getPlayer();
								if (player !== null && player !== undefined) {
									player.stop();
									player = null;
								}
							}

							serverQueue.timeout = setTimeout(() => {
								if (!serverQueue.getState('playing')) {
									connection = getVoiceConnection(interaction.guildId);
									if (connection !== undefined) {
										connection.disconnect();
										connection.destroy();
									}
								}
							}, 10000);
						}
					}
				}
			});
		}
	},
};

export default command;