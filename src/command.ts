import { ChatInputCommandInteraction, SharedSlashCommand } from "discord.js";
import type { MinecraftServer } from "./minecraftServer.js";

type Command = {
    data: SharedSlashCommand;
    execute: (interaction: ChatInputCommandInteraction, servers: MinecraftServer[]) => Promise<void>;
};

/**
 * This function is used in commands that need a minecraft server argument
 * to abstract the logic of parameter validation.
 * @param interaction the slash command interaction object
 * @param servers the list of all minecraft servers available
 * @param callback function to call with the minecraft server object if one was found
 */
function requireServerArgument(
    interaction: ChatInputCommandInteraction,
    servers: MinecraftServer[],
    callback: (server: MinecraftServer) => void
) {
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

    callback(server);
}

export {
    type Command,
    requireServerArgument
}