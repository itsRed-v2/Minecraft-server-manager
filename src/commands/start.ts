import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { MinecraftServer } from "../minecraftServer.js";
import { embeds, isAdministrator, requireServerArgument, type Command } from "../commandUtils.js";

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
            interaction.reply(embeds.fail("Vous n'avez pas la permission de démarrer ce serveur."));
            return;
        }

        if (server.state != 'Stopped') {
            interaction.reply(embeds.fail("On ne peut pas démarrer un serveur qui n'est pas à l'arrêt."));
            return;
        }
    
        const success = await server.start();
        if (success) {
            interaction.reply(embeds.success(`✅ Démarrage de **${server.name}**.`));
        } else {
            interaction.reply(embeds.error("Une erreur est survenue lors du démarrage du serveur."));
        }

    });
}

export const command: Command = { data, execute };