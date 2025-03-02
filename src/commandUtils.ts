import { ChatInputCommandInteraction, MessageFlags, SharedSlashCommand } from "discord.js";
import type { MinecraftServer } from "./minecraftServer.js";
import config from '../config.json' with { type: 'json' };

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
    const server = servers.find(s => serverName?.toLowerCase() === s.name.toLowerCase());

    if (server == undefined) {
        interaction.reply({
            embeds: [{
                description: `Aucun serveur ne se nomme "${serverName}"`,
                color: 0xed333b
            }],
            flags: MessageFlags.Ephemeral
        })
        return;
    }

    callback(server);
}

function isAdministrator(id: string): boolean {
    return (<string[]> config.administrators).includes(id);
}

enum Color {
    GREEN = 0x2ec27e,
    RED = 0xed333b,
    ERROR = 0xa51d2d
}

const embeds = {
    fail(message: string) {
        return {
            embeds: [{
                description: message,
                color: Color.RED
            }]
        }
    },

    success(message: string) {
        return {
            embeds: [{
                description: message,
                color: Color.GREEN
            }]
        }
    },
    
    error(message: string) {
        return {
            embeds: [{
                description: ":warning: " + message,
                color: Color.ERROR
            }]
        }
    }
}

export {
    type Command,
    requireServerArgument,
    isAdministrator,
    embeds,
    Color,
}