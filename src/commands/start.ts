import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { MinecraftServer } from "../minecraftServer.js";
import type { Command } from "../command.js";

const data = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start a minecraft server')
    .addStringOption(option => 
        option.setName('server')
        .setDescription('The server to start')
        .setRequired(true)
    );

async function execute(interaction: ChatInputCommandInteraction, servers: MinecraftServer[]) {
    const serverName = interaction.options.getString('server');
    const server = servers.find(s => serverName == s.name);

    if (server == undefined) {
        interaction.reply({
            embeds: [{
                description: `Aucun serveur ne se nomme "${serverName}"`,
                color: 0xed333b
            }]
        })
        return;
    }

    if (server.state != 'Stopped') {
        interaction.reply({
            embeds: [{
                description: "On ne peut pas démarrer un serveur qui n'est pas à l'arrêt.",
                color: 0xed333b
            }]
        });
        return;
    }

    const success = await server.start();
    if (success) {
        interaction.reply({
            embeds: [{
                description: `✅ Démarrage de **${serverName}**.`,
                color: 0x2ec27e
            }]
        });
    } else {
        interaction.reply({
            embeds: [{
                description: ":warning: Une erreur est survenue lors du démarrage du serveur.",
                color: 0xa51d2d
            }]
        });
    }
}

export const command: Command = { data, execute };