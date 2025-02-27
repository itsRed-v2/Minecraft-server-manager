import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import serversConfig from '../../servers.json' with { type: 'json' };
import type { MinecraftServer } from "../minecraftServer.js";
import { requireServerArgument, type Command } from "../command.js";

const data = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Affiche des informations sur un serveur')
    .addStringOption(option => 
        option.setName('server')
        .setDescription('Le serveur à afficher')
        .setRequired(true)
    );

async function execute(interaction: ChatInputCommandInteraction, servers: MinecraftServer[]) {
    requireServerArgument(interaction, servers, async (server) => {
		
		const embed = new EmbedBuilder()
			.setTitle(server.name)
			.setColor("#2ec27e")
			.addFields({
				name: 'Statut',
				value: server.getStateMessage(),
				inline: true
			});

		const addressMap = serversConfig.addresses as { [key: string]: string }
		const address = addressMap[server.port.toString()];
		embed.addFields({
			name: 'Adresse',
			value: address ? ('`' + address + '`') : ('xenocraft.fr:' + server.port),
			inline: true
		});

		if (server.state === 'Running') {
			const status = await server.lookupStatus();
			if (status.version.name) {
				embed.addFields({
					name: 'Version',
					value: status.version.name,
					inline: true
				});
			}
		
			if (status.players.online !== undefined && status.players.max !== undefined) {
				embed.addFields({
					name: 'Joueurs',
					value: status.players.online + '/' + status.players.max
				});
			}
		}

		interaction.reply({ embeds: [embed] });
	});
}

export const command: Command = { data, execute };