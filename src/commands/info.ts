import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import config from '../../config.json' with { type: 'json' };
import type { MinecraftServer } from "../minecraftServer.js";
import { Color, requireServerArgument, type Command } from "../commandUtils.js";
import { format } from "node:util";

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
			.setColor(Color.GREEN)
			.addFields({
				name: 'Statut',
				value: server.getStateMessage(),
				inline: true
			});

		if (server.isUninitialized) {
				embed.addFields({
				name: 'Adresse',
				value: "Le serveur n'est pas initialisé",
				inline: true
			});
		} else {
			const addressMap = config.addresses as { [key: string]: string }
			const address = addressMap[server.port.toString()];
			embed.addFields({
				name: 'Adresse',
				value: address ? ('`' + address + '`') : ('xenocraft.fr:' + server.port),
				inline: true
			});
		}

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
				if (status.players.sample !== undefined && status.players.sample.length !== 0) {
					embed.addFields({
						name: format('Joueurs (%d/%d)', status.players.online, status.players.max),
						value: status.players.sample.map(player => player.name).join('\n'),
						inline: true
					});
				} else {
					embed.addFields({
						name: 'Joueurs',
						value: status.players.online + '/' + status.players.max,
						inline: true
					});
				}
			}
		}

		embed.addFields({
			name: "Contrôle",
			value: server.isPublic ? "public" : "restreint",
			inline: true
		})

		interaction.reply({ embeds: [embed] });
	});
}

export const command: Command = { data, execute };