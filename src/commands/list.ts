import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Collection } from "discord.js";
import type { MinecraftServer } from "../minecraftServer.js";
import { isAdministrator, type Command } from "../commandUtils.js";

const data = new SlashCommandBuilder()
    .setName("list")
    .setDescription("Liste les serveurs minecraft disponibles");

async function execute(interaction: ChatInputCommandInteraction, servers: MinecraftServer[]) {
    const embed = new EmbedBuilder()
        .setTitle("<:minecraft:1343618907390476318> Serveurs minecraft")
        .setColor("#26a269");

    let visibleServers;
    if (isAdministrator(interaction.user.id)) {
        visibleServers = servers;
    } else {
        visibleServers = servers.filter(server => server.isPublic);
    }

    if (visibleServers.length == 0) {
        embed.setDescription('Aucun serveur disponible... Désolé.');
    } else {
        for (const server of visibleServers) {
            let statusString = server.getStateMessage();

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