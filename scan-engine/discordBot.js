const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

let client = null;
let adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID;
let approvalChannelId = process.env.DISCORD_APPROVAL_CHANNEL_ID;

/**
 * Initializes the Discord Bot if a token is provided
 */
async function initDiscordBot(token, onApprove) {
    if (!token) return null;

    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers
        ]
    });

    client.on('ready', () => {
        console.log(`[DiscordBot] Logged in as ${client.user.tag}`);
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        const [action, accountId, targetInterval] = interaction.customId.split(':');

        if (action === 'approve_escalation') {
            // Role Check
            const hasRole = interaction.member.roles.cache.has(adminRoleId);
            const isOwner = interaction.guild.ownerId === interaction.user.id;

            if (!hasRole && !isOwner) {
                return interaction.reply({ 
                    content: '❌ **Access Denied**: You do not have the required role to approve frequency shifts.', 
                    ephemeral: true 
                });
            }

            try {
                await onApprove(accountId, parseInt(targetInterval));
                
                // Update the original message
                const embed = EmbedBuilder.from(interaction.message.embeds[0])
                    .setColor(0x00FF00)
                    .setTitle('✅ Escalation Approved')
                    .addFields({ name: 'Approved By', value: `<@${interaction.user.id}>` });

                await interaction.update({ 
                    content: '✅ **Shift Applied Successfully**', 
                    embeds: [embed], 
                    components: [] 
                });
            } catch (err) {
                console.error('[DiscordBot] Approval error:', err);
                interaction.reply({ content: '❌ Failed to apply shift. Server error.', ephemeral: true });
            }
        }
    });

    try {
        await client.login(token);
        return client;
    } catch (err) {
        console.error('[DiscordBot] Login failed:', err.message);
        return null;
    }
}

/**
 * Sends an approval request to Discord
 */
async function sendApprovalRequest(accountId, current, target) {
    if (!client || !approvalChannelId) return;

    try {
        const channel = await client.channels.fetch(approvalChannelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle('🚀 Viral Escalation Request')
            .setDescription(`High viral momentum detected for **${accountId}**.`)
            .setColor(0xFFAA00)
            .addFields(
                { name: 'Current Interval', value: `${current}m`, inline: true },
                { name: 'Target Interval', value: `${target}m`, inline: true },
                { name: 'Action', value: 'Approval required to increase scan frequency.' }
            )
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`approve_escalation:${accountId}:${target}`)
                    .setLabel('Approve Shift')
                    .setStyle(ButtonStyle.Success)
            );

        await channel.send({ embeds: [embed], components: [row] });
    } catch (err) {
        console.error('[DiscordBot] Failed to send request:', err.message);
    }
}

module.exports = { initDiscordBot, sendApprovalRequest };
