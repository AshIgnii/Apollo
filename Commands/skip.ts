import { SlashCommandBuilder, Snowflake } from 'discord.js';
import { SoundCloudStream, YouTubeStream, stream } from 'play-dl';
import { queue } from '../Classes/queue';
import { AudioPlayer, AudioPlayerState, AudioPlayerStatus, AudioResource, NoSubscriberBehavior, PlayerSubscription, VoiceConnection, createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import { track } from '../Classes/track';
import { refreshPlayingMSG } from '../Functions/refreshPlayingMSG';
import { getNextAvailableStream } from '../Functions/getNextAvailableStream';
import { leaveIfInactive } from '../Functions/leaveIfInactive';

const command = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips the currently playing track')
		.setNameLocalizations({
			'pt-BR': 'pular',
		})
		.setDescriptionLocalizations({
			'pt-BR': 'Pula a musica que está tocando',
		})
		.addNumberOption(option =>
			option
				.setName('number')
				.setDescription('Number of tracks to skip')
				.setNameLocalizations({
					'pt-BR': 'numero',
				})
				.setDescriptionLocalizations({
					'pt-BR': 'Numero de musicas que serão puladas',
				})
				.setRequired(false),
		),
	async execute(interaction: any, serverQueue: queue) {
		const vc: Snowflake | null = interaction.member.voice.channelId;
		if (vc === undefined || vc === null) {
			const locales: any = {
				'pt-BR': 'Você não está em nenhum canal de voz!',
			};

			await interaction.editReply({
				content: locales[interaction.locale] ?? 'You\'re not in a voice channel!',
			});
			return;
		}

		let connection: VoiceConnection | undefined = getVoiceConnection(interaction.guildId);
		if (connection === undefined || connection === null) {
			const locales: any = {
				'pt-BR': 'Eu não estou tocando nada no momento.',
			};

			await interaction.editReply({
				content: locales[interaction.locale] ?? 'I\'m not playing anything',
			});
			return;
		}

		let input: number | null = interaction.options.getNumber('number');
		if (input === null) {
			input = 1;
		} else if (input <= 0) {
			const locales: any = {
				'pt-BR': 'Numero inválido.',
			};

			await interaction.editReply({
				content: locales[interaction.locale] ?? 'Invalid number.',
			});
			return;
		}

		if (serverQueue === undefined) {
			throw new Error('Queue is undefined');
		}

		for (let i: number = 0; i < input; i++) {
			serverQueue.shiftQueue();
		}

		if (!serverQueue.getState('playing')) {
			serverQueue.changeState('playing');
		}

		let queueTimeout = serverQueue.getLeaveTimeout();
		if (queueTimeout !== null || queueTimeout !== undefined) {
			clearTimeout(queueTimeout);
		}

		connection = getVoiceConnection(interaction.guildId);
		if (connection === undefined) {
			connection = joinVoiceChannel({
				channelId: vc,
				guildId: interaction.guildId,
				adapterCreator: interaction.guild.voiceAdapterCreator,
			});
		}


		let player: AudioPlayer | undefined = serverQueue.getPlayer();
		let subscription: PlayerSubscription | undefined;

		let newPlayer: boolean = false;
		if (player === undefined) {
			newPlayer = true;
			player = createAudioPlayer({
				behaviors: {
					noSubscriber: NoSubscriberBehavior.Pause,
				},
			});

			serverQueue.setPlayer(player);
			subscription = connection.subscribe(player);
		} else {
			if (serverQueue.getTrack() !== undefined) {
				if (!serverQueue.getState('paused')) {
					serverQueue.changeState('paused');
				}
			}

			player.stop();
		}

		// Reply
		let plural: string = '';
		if (input > 1) {
			plural = 's';
		}
		const locales: any = {
			'pt-BR': `⏩ Pulando ${input} musica${plural}...`,
		};

		await interaction.editReply({
			content: locales[interaction.locale] ?? `⏩ Skipping ${input} track${plural}...`,
		});

		let nextTrack: track = serverQueue.getTrack();
		if (nextTrack === undefined) {
			return;
		}

		const id = nextTrack.id;
		const audioStream: YouTubeStream | SoundCloudStream | undefined = await getNextAvailableStream(serverQueue, interaction);
		if (audioStream != undefined) {
			const resource: AudioResource = createAudioResource(audioStream.stream, {
				inputType: audioStream.type,
			});

			player.play(resource);

			if (serverQueue.getState('paused')) {
				serverQueue.changeState('paused');
			}

			refreshPlayingMSG(serverQueue, interaction);
		} else {
			leaveIfInactive(interaction, serverQueue, subscription, connection);
		}

		if (newPlayer) {
			player.on('stateChange', async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
				if (oldState.status == AudioPlayerStatus.Playing && newState.status == AudioPlayerStatus.Idle) {
					if (!serverQueue.getState('paused')) {
						serverQueue.shiftQueue();
						nextTrack = serverQueue.getTrack();

						if (nextTrack !== undefined) {
							const newaudioStream = await stream(nextTrack.id);
							const newResource: AudioResource = createAudioResource(newaudioStream.stream, {
								inputType: newaudioStream.type,
							});

							if (player !== null && player !== undefined) {
								player.play(newResource);
							}
						} else {
							serverQueue.changeState('playing');

							if (subscription !== undefined) {
								subscription.unsubscribe();
								if (player !== null && player !== undefined) {
									player.stop();
									player = undefined;
								}
							}

							serverQueue.setLeaveTimeout(setTimeout(() => {
								if (!serverQueue.getState('playing')) {
									connection = getVoiceConnection(interaction.guildId);
									if (connection !== undefined) {
										connection.disconnect();
										connection.destroy();
									}
								}
							}, 10000));
						}
					}
				}
			});
		}
	},
};

export default command;