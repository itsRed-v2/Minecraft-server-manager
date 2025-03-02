import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { MinecraftServer } from "../minecraftServer.js";
import { isAdministrator, requireServerArgument, type Command } from "../commandUtils.js";

const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Arrête un serveur minecraft')
    .addStringOption(option => 
        option.setName('server')
        .setDescription('Le serveur à arrêter')
        .setRequired(true)
    );

async function execute(interaction: ChatInputCommandInteraction, servers: MinecraftServer[]) {
    requireServerArgument(interaction, servers, async (server) => {

        if (!server.isPublic && !isAdministrator(interaction.user.id)) {
            interaction.reply({
                embeds: [{
                    description: "Vous n'avez pas la permission d'arrêter ce serveur.",
                    color: 0xed333b
                }]
            });
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
                description: `:octagonal_sign: Arrêt de **${server.name}** en cours...`,
                color: 0x2ec27e
            }]
        });
    
        const success = await server.stop();
        if (success) {
            interaction.editReply({
                embeds: [{
                    description: `:octagonal_sign: **${server.name}** est arrêté.`,
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

    });
}

export const command: Command = { data, execute };