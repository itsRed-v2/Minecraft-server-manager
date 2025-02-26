import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { MinecraftServer } from "../minecraftServer.js";
import type { Command } from "../command.js";

const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop a minecraft server')
    .addStringOption(option => 
        option.setName('server')
        .setDescription('The server to stop')
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

    if (server.state != 'Running') {
        interaction.reply({
            embeds: [{
                description: "On ne peut pas arrêter un serveur qui n'est pas allumé.",
                color: 0xed333b
            }]
        });
        return;
    }

    interaction.reply({
        embeds: [{
            description: `:octagonal_sign: Arrêt de **${serverName}** en cours...`,
            color: 0x2ec27e
        }]
    });

    const success = await server.stop();
    if (success) {
        interaction.editReply({
            embeds: [{
                description: `:octagonal_sign: **${serverName}** est arrêté.`,
                color: 0x2ec27e
            }]
        });
    } else {
        interaction.editReply({
            embeds: [{
                description: ":warning: Une erreur est survenue lors de l'arrêt du serveur.",
                color: 0xa51d2d
            }]
        });
    }
}

export const command: Command = { data, execute };