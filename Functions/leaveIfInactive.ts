import { PlayerSubscription, VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import { queue } from "../Classes/queue";

export function leaveIfInactive(interaction: any, serverQueue: queue, subscription: PlayerSubscription | undefined, connection: VoiceConnection | undefined) {
    if (serverQueue.getState('playing')) {
        serverQueue.changeState('playing');
    }

    if (subscription !== undefined) {
        subscription.unsubscribe();

        let player = serverQueue.getPlayer();
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

            serverQueue.setMessage(undefined);
        }
    }, 60000))
}