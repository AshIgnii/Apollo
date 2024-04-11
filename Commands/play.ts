import { SlashCommandBuilder, EmbedBuilder, Snowflake, VoiceChannel } from 'discord.js';
import { InfoData, SoundCloudStream, YouTubeStream, stream, video_basic_info } from 'play-dl';
import { AudioPlayer, AudioPlayerState, AudioPlayerStatus, AudioResource, NoSubscriberBehavior, PlayerSubscription, VoiceConnection, createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import ytpl, { result, validateID } from '@distube/ytpl';
import { song } from '../Classes/song';
import { queue } from '../Classes/queue';
import { playlist } from '../Classes/playlist';
import { tryNextSong } from '../Functions/tryNextSong';
import { refreshPlayingMSG } from '../Functions/refreshPlayingMSG';

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

		let connection: VoiceConnection | undefined = getVoiceConnection(interaction.guildId);
		if (connection !== undefined) {
			const botVC: string | null = connection.joinConfig.channelId;
			const serverVC: VoiceChannel = await interaction.guild.channels.fetch(botVC);

			if (serverVC.members.size > 1 && botVC !== vc) {
				const locales: any = {
					'pt-BR': 'Eu já estou ativo em outro canal de voz!',
				};

				await interaction.editReply({
					content: locales[interaction.locale] ?? 'I\'m already active in another voice channel!',
				});
				return;
			} else if (serverVC.members.size <= 1 && botVC !== vc) {
				if (serverQueue.getState('playing')) {
					serverQueue.purgeQueue();
					serverQueue.setMessage(undefined);
					serverQueue.changeState('playing');
				}

				connection.disconnect();
				connection.destroy();
			}
		}

		const input: string = interaction.options.getString('song');
		const pattern: RegExp = /^(?:(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/oembed\?url=)?(?:https?(?:%3A|:)\/\/)?(?:www\.)?(?:m\.)?(?:youtube(?:-nocookie)?\.com|youtu\.be)\/(?:attribution_link\?a=[[a-zA-Z\d-]*&u=(?:%2F|\/))?(watch|embed\/|playlist|(?:v|e)\/)?(?:\?|%3F|&)?(?:(?:(?:feature|app)=\w*&)?(?:v|list)(?:=|%3D))?((?:-|_|(?!list|feature|app)[a-zA-Z\d])*)(?:(?:(?:\?|&|#|%26|;)(?:si|feature|playnext_from|version|fs|format|videos|autohide|hl|rel|amp)(?:=|%3D)?[\w\-\.]*)*)?(?:(?:&|\?|#)(?:list=([\w\-]*)))?(?:(?:&|\?|#)t=((?:\d*[hms]?)*))?(?:(?:(?:&|\?|#)(?:index|shuffle)=\d*)*)?/gm;
		const inputExec: string[] | null = pattern.exec(input);

		let type: string | undefined;
		let id: string | undefined;
		let playlistID: string | undefined;
		// let seekTime: string | undefined;

		if (inputExec !== null && inputExec.length > 0) {
			type = inputExec[1];
			id = inputExec[2];
			playlistID = inputExec[3];
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

		let videoSuccess = false
		if ((type === 'watch' || type === 'embed' || type === 'v' || type === 'e') && playlistID === undefined) {
			const newSong: song = new song(id, interaction.member.id);

			const info: InfoData = await video_basic_info(newSong.id);

			if (info !== undefined) {
				newSong.title = info.video_details.title;
				newSong.durationSec = info.video_details.durationInSec;
				newSong.thumbnailURL = info.video_details.thumbnails[0].url;
			} else {
				newSong.title = 'No title';
				newSong.durationSec = 0;
			}

			serverQueue.addSong(newSong);
			videoSuccess = true;

			const defaultEmbed = new EmbedBuilder()
				.setAuthor({
					name: 'Added to the queue!',
					iconURL: interaction.client.user.avatarURL().toString(),
				})
				.setColor('Green')
				.setDescription(newSong.title ?? 'No title')
				.setTimestamp(interaction.createdTimestamp);
			const locales: any = {
				'pt-BR': new EmbedBuilder()
					.setAuthor({
						name: 'Adicionado a fila!',
						iconURL: interaction.client.user.avatarURL().toString(),
					})
					.setColor('Green')
					.setDescription(newSong.title ?? 'No title')
					.setTimestamp(interaction.createdTimestamp),
			};

			await interaction.editReply({
				embeds: [locales[interaction.locale] ?? defaultEmbed],
			});
		}

		if (type === 'playlist' || playlistID !== undefined) {
			let pID: string = '0';
			if (type === 'playlist') {
				pID = id;
			} else if (playlistID !== undefined) {
				pID = playlistID
			}

			if (!validateID(pID)) {
				const locales: any = {
					'pt-BR': 'Playlist inválida',
				}

				if (videoSuccess) {
					await interaction.channel.send({
						content: locales[interaction.locale] ?? 'Invalid playlist ID',
					});
				} else {
					await interaction.editReply({
						content: locales[interaction.locale] ?? 'Invalid playlist ID',
					});
				}
				return;
			} else {
				const newPlaylist: playlist = new playlist(await ytpl(pID), interaction.member.id);
				const songs: song[] = newPlaylist.getSongs();

				if (songs.length > 0) {
					serverQueue.addSong(songs)
					let pTitle = newPlaylist.title
					let thumb = newPlaylist.thumbnailURL

					const defaultEmbed = new EmbedBuilder()
						.setAuthor({
							name: 'Playlist added to the queue!',
							iconURL: interaction.client.user.avatarURL().toString(),
						})
						.setColor('Yellow')
						.setDescription(pTitle ?? 'No title')
						.setThumbnail(thumb)
						.setTimestamp(interaction.createdTimestamp);
					const locales: any = {
						'pt-BR': new EmbedBuilder()
							.setAuthor({
								name: 'Playlist adicionado a fila!',
								iconURL: interaction.client.user.avatarURL().toString(),
							})
							.setColor('Yellow')
							.setDescription(pTitle ?? 'No title')
							.setThumbnail(thumb)
							.setTimestamp(interaction.createdTimestamp),
					};

					await interaction.editReply({
						embeds: [locales[interaction.locale] ?? defaultEmbed],
					});
				}
			}
		}

		if (!serverQueue.getState('playing')) {
			serverQueue.changeState('playing');

			if (serverQueue.timeout !== null || serverQueue.timeout !== undefined) {
				clearTimeout(serverQueue.timeout);
			}

			connection = getVoiceConnection(interaction.guildId);
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

			id = serverQueue.getSong().id;
			const audioStream: YouTubeStream | SoundCloudStream = await stream(id);
			const resource: AudioResource = createAudioResource(audioStream.stream, {
				inputType: audioStream.type,
			});

			player.play(resource);

			// playing msg
			const currentSong: song = serverQueue.getSong();
			refreshPlayingMSG(serverQueue, interaction);

			player.on('stateChange', async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
				if (oldState.status == AudioPlayerStatus.Playing && newState.status == AudioPlayerStatus.Idle) {
					if (!serverQueue.getState('paused')) {
						const newaudioStream: YouTubeStream | SoundCloudStream | undefined = await tryNextSong(serverQueue, interaction)

						if (newaudioStream !== undefined) {
							const newResource: AudioResource = createAudioResource(newaudioStream.stream, {
								inputType: newaudioStream.type,
							});

							player = serverQueue.getPlayer();
							if (player !== undefined && player !== null) {
								player.play(newResource);
							}

							const nextSong = serverQueue.getSong();
							refreshPlayingMSG(serverQueue, interaction);
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

									serverQueue.setMessage(undefined);
								}
							}, 60000);
						}
					}
				}
			});
		}
	},
};

export default command;