import fs from 'node:fs';
import path from 'node:path';
import secrets from '../../secrets.json' with { type: 'json' };
const { token, cliendId, guildId } = secrets;
import type { Command } from '../command.js';
import { REST, Routes, SharedSlashCommand } from 'discord.js';

const commands: SharedSlashCommand[] = [];

// Loading commands
const commandFolderPath = path.join(import.meta.dirname, '../commands');
const commandFileNames = fs.readdirSync(commandFolderPath, { encoding: 'utf-8' });
console.log("Command files:", commandFileNames);

for (const fileName of commandFileNames) {
    const filePath = path.join(commandFolderPath, fileName);
    const command = <Command> (await import(filePath)).command;
    if ('data' in command && 'execute' in command) {
        commands.push(command.data);
    } else {
        console.log('Warning: the command file', fileName, 'is missing required "data" or "execute" property');
    }
}

const rest = new REST().setToken(token);

try {
    console.log(`Started refreshing ${commands.length} commands.`);

    const data = await rest.put(
        Routes.applicationGuildCommands(cliendId, guildId),
        { body: commands }
    ) as unknown[];

    console.log(`Successfully reloaded ${data.length} commands.`);
} catch (error) {
    console.error(error);
}