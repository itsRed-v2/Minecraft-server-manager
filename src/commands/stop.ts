import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { MinecraftServer } from "../minecraftServer.js";
import { isAdministrator, embeds, requireServerArgument, type Command } from "../commandUtils.js";

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
            interaction.reply(embeds.fail("Vous n'avez pas la permission d'arrêter ce serveur."));
            return;
        }

        if (server.state != 'Running') {
            interaction.reply(embeds.fail("On ne peut pas arrêter un serveur qui n'est pas allumé."));
            return;
        }
    
        interaction.reply(embeds.success(`:octagonal_sign: Arrêt de **${server.name}** en cours...`));
    
        const success = await server.stop();
        if (success) {
            interaction.editReply(embeds.success(`:octagonal_sign: **${server.name}** est arrêté.`));
        } else {
            interaction.editReply(embeds.error("Une erreur est survenue lors de l'arrêt du serveur."));
        }

    });
}

export const command: Command = { data, execute };