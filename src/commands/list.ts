import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Collection } from "discord.js";
import type { MinecraftServer, ServerState } from "../minecraftServer.js";
import type { Command } from "../command.js";

const stateTranslation = new Collection<ServerState, string>([
    ['Running', '<:Online:1343628871022678167> En ligne'],
    ['Stopped', '<:Offline:1343629125994287247> Hors ligne'],
    ['Starting', '<:Online:1343628871022678167> Démarrage...'],
    ['Stopping', '<:Offline:1343629125994287247> Arrêt en cours...'],
    ['Rebooting', '<:Online:1343628871022678167> Redémarrage en cours...']
]);

const data = new SlashCommandBuilder()
    .setName("list")
    .setDescription("Liste les serveurs minecraft disponibles");

async function execute(interaction: ChatInputCommandInteraction, servers: MinecraftServer[]) {
    const embed = new EmbedBuilder()
        .setTitle("<:minecraft:1343618907390476318> Serveurs minecraft")
        .setColor("#26a269");

    if (servers.length == 0) {
        embed.setDescription('Aucun serveur disponible... Désolé.');
    } else {
        for (const server of servers) {
            let statusString = stateTranslation.get(server.state) as string;
            if (server.state == 'Running') {
                const status = await server.lookupStatus();
                statusString += `, ${status.players.online}/${status.players.max} joueurs`;
            }
            embed.addFields({
                name: server.name,
                value: statusString
            });
        }
    }

    interaction.reply({ embeds: [embed] });
}  

export const command: Command = { data, execute };