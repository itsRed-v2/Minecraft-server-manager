import fs from 'node:fs';
import path from 'node:path';
import secrets from '../secrets.json' with { type: 'json' };
import config from '../config.json' with { type: 'json' };
import { 
    Client, Events, GatewayIntentBits, Collection,
    type Interaction
} from 'discord.js';

import type { Command } from './commandUtils.js';
import { MinecraftServer } from './minecraftServer.js';

const servers: MinecraftServer[] = [];
for (const serverData of config.servers) {
    servers.push(new MinecraftServer(serverData.name, serverData.folder, serverData.isPublic));
}

// Creating discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready ! Logged in as ${readyClient.user.tag}`);
});

// Setting up graceful shutdown
function onTerminate(signal: NodeJS.Signals) {
    console.log(`Received signal ${signal}, gracefully stopping...`);
    client.destroy();
    Promise.all(servers.map(server => server.stop())).then(() => {
        console.log('Everything shut down, exiting.');
        process.exit();
    });
}
process.on('SIGTERM', onTerminate);
process.on('SIGINT', onTerminate);

// Loading commands
const commands = new Collection<string, Command>();

const commandFolderPath = path.join(import.meta.dirname, 'commands');
const commandFileNames = fs.readdirSync(commandFolderPath, { encoding: 'utf-8' });
console.log("Command files:", commandFileNames);

for (const fileName of commandFileNames) {
    const filePath = path.join(commandFolderPath, fileName);
    const command = <Command> (await import(filePath)).command;

    if ('data' in command && 'execute' in command) {
        commands.set(command.data.name, command);
    } else {
        console.log('Warning: the command file', fileName, 'is missing required "data" or "execute" property');
    }
}

// Command handling
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);
        if (!command) {
            console.error('Error: unknown command:', interaction.commandName);
            return;
        }

        try {
            await command.execute(interaction, servers);
        } catch (err) {
            console.error('Error executing command !');
            console.error(err);
            interaction.reply("Une erreur est survenue lors de l'execution de cette commande.")
        }
    }
});

// Finally logging in
client.login(secrets.token);