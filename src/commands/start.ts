import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { MinecraftServer } from "../minecraftServer.js";
import { isAdministrator, requireServerArgument, type Command } from "../commandUtils.js";

const data = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Démarre un serveur minecraft')
    .addStringOption(option => 
        option.setName('server')
        .setDescription('Le serveur à démarrer')
        .setRequired(true)
    );

async function execute(interaction: ChatInputCommandInteraction, servers: MinecraftServer[]) {
    requireServerArgument(interaction, servers, async (server) => {

        if (!server.isPublic && !isAdministrator(interaction.user.id)) {
            interaction.reply({
                embeds: [{
                    description: "Vous n'avez pas la permission de démarrer ce serveur.",
                    color: 0xed333b
                }]
            });
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
                    description: `✅ Démarrage de **${server.name}**.`,
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

    });
}

export const command: Command = { data, execute };