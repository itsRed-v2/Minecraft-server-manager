import { ChatInputCommandInteraction, SharedSlashCommand } from "discord.js";
import type { MinecraftServer } from "./minecraftServer.js";

export type Command = {
    data: SharedSlashCommand;
    execute: (interaction: ChatInputCommandInteraction, servers: MinecraftServer[]) => Promise<void>;
};