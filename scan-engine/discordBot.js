const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

let client = null;
let adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID;
let approvalChannelId = process.env.DISCORD_APPROVAL_CHANNEL_ID;
let viralAlertsChannelId = process.env.DISCORD_VIRAL_ALERTS_CHANNEL_ID;
let postLogChannelId = process.env.DISCORD_POST_LOG_CHANNEL_ID || '1502499064716066826';

/**
 * Initializes the Discord Bot if a token is provided
 */
async function initDiscordBot(token, onApprove, getSummary) {
    if (!token) return null;

    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers
        ]
    });

    client.on('clientReady', async () => {
        console.log(`[DiscordBot] Logged in as ${client.user.tag}`);
        
        // Register Slash Commands (Phase 18)
        const commands = [
            {
                name: 'status',
                description: 'Get high-level overview of the LinkMe Scan Engine.'
            },
            {
                name: 'scans',
                description: 'List all active monitoring nodes and their current health.'
            },
            {
                name: 'audit',
                description: 'Detailed report for the network or a specific account.',
                options: [
                    {
                        name: 'timeframe',
                        type: 3, // STRING
                        description: 'Select audit window (Today, 7D, 30D, ALL)',
                        required: false,
                        choices: [
                            { name: 'Today', value: 'today' },
                            { name: '7 Days', value: '7d' },
                            { name: '30 Days', value: '30d' },
                            { name: 'All Time', value: 'all' }
                        ]
                    },
                    {
                        name: 'date',
                        type: 3, // STRING
                        description: 'Audit a specific date (YYYY-MM-DD)',
                        required: false
                    },
                    {
                        name: 'node_id',
                        type: 3, // STRING
                        description: 'Optional: Audit a specific node ID',
                        required: false
                    }
                ]
            },
            {
                name: 'test_viral',
                description: 'TEST: Send a mock viral alert'
            },
            {
                name: 'test_attendance',
                description: 'TEST: Send a mock attendance log'
            },
            {
                name: 'test_approval',
                description: 'TEST: Send a mock escalation request to the approval channel'
            }
        ];

        try {
            // Global registration (takes up to 1 hour)
            await client.application.commands.set(commands);
            
            // Guild-specific registration (instant)
            const guilds = await client.guilds.fetch();
            for (const [id, guild] of guilds) {
                const fullGuild = await guild.fetch();
                await fullGuild.commands.set(commands);
                console.log(`[DiscordBot] Commands force-pushed to guild: ${fullGuild.name}`);
            }
            
            console.log('[DiscordBot] Slash commands propagation forced.');
        } catch (e) {
            console.error('[DiscordBot] Slash command registration failed:', e.message);
        }
    });

    client.on('interactionCreate', async (interaction) => {
        if (interaction.isCommand()) {
            console.log(`[DiscordBot] Command Received: /${interaction.commandName}`);
            
            // Handle /status (Stats Only)
            if (interaction.commandName === 'status') {
                try {
                    await interaction.deferReply();
                    if (!getSummary) return interaction.editReply('❌ System not connected.');
                    const summary = await getSummary(null, '24h', null);
                    const embed = new EmbedBuilder()
                        .setTitle('📊 Account Overview')
                        .setColor(0x00D1FF)
                        .setDescription(summary.brief)
                        .setTimestamp();
                    await interaction.editReply({ embeds: [embed] });
                } catch (err) {
                    console.error(`[DiscordBot] Status failed:`, err);
                }
                return;
            }

            // Handle /scans (Full Inventory List)
            if (interaction.commandName === 'scans') {
                try {
                    await interaction.deferReply();
                    if (!getSummary) return interaction.editReply('❌ System not connected.');
                    const summary = await getSummary(null, '24h', null);
                    const embed = new EmbedBuilder()
                        .setTitle('📡 All Accounts')
                        .setColor(0xBBBBBB)
                        .setDescription(summary.inventory)
                        .setTimestamp();
                    await interaction.editReply({ embeds: [embed] });
                } catch (err) {
                    console.error(`[DiscordBot] Scans failed:`, err);
                }
                return;
            }

            // Handle /audit (Forensic Report)
            if (interaction.commandName === 'audit') {
                try {
                    await interaction.deferReply();
                    if (!getSummary) return interaction.editReply('❌ System not connected.');

                    const nodeId = interaction.options.getString('node_id') || null;
                    const timeframe = interaction.options.getString('timeframe') || '24h';
                    const dateParam = interaction.options.getString('date') || null;
                    
                    const summary = await getSummary(nodeId, timeframe, dateParam);
                    
                    if (nodeId && summary.error) {
                        return interaction.editReply({ content: `❌ **Error**: ${summary.error}` });
                    }

                    const label = dateParam || timeframe.toUpperCase();
                    const embed = new EmbedBuilder()
                        .setTitle(nodeId ? `🔍 Account Audit: ${nodeId}` : `🛡️ Daily Report (${label})`)
                        .setColor(nodeId ? 0x00FF99 : 0x00D1FF)
                        .setDescription(nodeId ? summary.nodeDetail : summary.detailed)
                        .setTimestamp();
                    
                    if (nodeId && summary.thumbnail) embed.setThumbnail(summary.thumbnail);

                    await interaction.editReply({ embeds: [embed] });
                } catch (err) {
                    console.error(`[DiscordBot] Audit failed:`, err);
                }
                return;
            }

            // Handle /test_viral
            if (interaction.commandName === 'test_viral') {
                try {
                    await interaction.deferReply({ ephemeral: true });
                    if (!getSummary) return interaction.editReply('❌ System not connected.');
                    
                    // We need to find a node with growth to show real data
                    const summary = await getSummary(null, '24h', null);
                    // This is a bit of a hack to get a real node with data
                    // We'll just pick the first one that has growth or just the first one if none
                    const realNodes = Array.from(require('./server').activeScans.values());
                    if (realNodes.length === 0) return interaction.editReply('ℹ️ No accounts active to test with.');
                    
                    const topNode = realNodes[0]; 
                    await sendViralAlert(topNode.accountId, topNode.platform, { delta: 50000, multiplier: 2.5, zScore: 3.1 });
                    await interaction.editReply(`✅ **Real-Data Viral Alert Sent** for node \`${topNode.accountId}\`.`);
                } catch (err) {
                    console.error('[DiscordBot] Test failed:', err);
                }
                return;
            }

            // Handle /test_attendance
            if (interaction.commandName === 'test_attendance') {
                try {
                    await interaction.deferReply({ ephemeral: true });
                    if (!getSummary) return interaction.editReply('❌ System not connected.');
                    
                    const summary = await getSummary(null, '24h', null);
                    if (!summary.attendanceLog || summary.attendanceLog.length === 0) {
                        return interaction.editReply('ℹ️ **No posts synced** in the last 24 hours.');
                    }
                    
                    await sendAttendanceLog(summary.attendanceLog);
                    await interaction.editReply('✅ **Real Attendance Log Sent** to the post-log channel.');
                } catch (err) {
                    console.error('[DiscordBot] Attendance test failed:', err);
                }
                return;
            }

            // Handle /test_approval
            if (interaction.commandName === 'test_approval') {
                try {
                    await interaction.deferReply({ ephemeral: true });
                    await sendApprovalRequest('TEST_ACCOUNT', 60, 15);
                    await interaction.editReply('✅ **Mock Escalation Request Sent** to the approval channel.');
                } catch (err) {
                    console.error('[DiscordBot] Approval test failed:', err);
                }
                return;
            }
        }

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

/**
 * Sends a viral notification to the public alerts channel
 */
async function sendViralAlert(accountId, platform, growthData) {
    if (!client || !viralAlertsChannelId) return;

    try {
        const channel = await client.channels.fetch(viralAlertsChannelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle('🔥 VIRAL SIGNAL DETECTED')
            .setDescription(`Significant momentum spike detected for node **${accountId}** on ${platform.toUpperCase()}.`)
            .setColor(0xFF4500)
            .addFields(
                { name: 'Velocity Spike', value: `+${growthData.delta.toLocaleString()} views`, inline: true },
                { name: 'Growth Multiplier', value: `${growthData.multiplier.toFixed(1)}x`, inline: true },
                { name: 'Z-Score Momentum', value: growthData.zScore.toFixed(2), inline: true }
            )
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/1680/1680951.png')
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    } catch (err) {
        console.error('[DiscordBot] Failed to send viral alert:', err.message);
    }
}

/**
 * Sends a daily summary digest to the viral alerts channel
 */
async function sendDailyDigest(summaryData) {
    if (!client || !viralAlertsChannelId) return;

    try {
        const channel = await client.channels.fetch(viralAlertsChannelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle('🌙 Daily Viral Summary (24H)')
            .setDescription(`Overview of network performance for the last 24 hours.`)
            .setColor(0x00D1FF)
            .addFields(
                { name: 'Total Views', value: summaryData.brief.split('\n')[2].replace('> Total Reach: ', ''), inline: true },
                { name: 'Status', value: summaryData.brief.split('\n')[3].replace('> Health: ', ''), inline: true }
            )
            .setTimestamp();

        // Add top performers list
        const detailed = summaryData.detailed.split('\n\n')[0]; 
        embed.addFields({ name: '🏆 Top Performers', value: detailed.substring(0, 1024) });

        await channel.send({ content: '📊 **Daily Network Report**', embeds: [embed] });
        console.log('[DiscordBot] ✅ Daily Summary sent.');
    } catch (err) {
        console.error('[DiscordBot] Failed to send summary:', err.message);
    }
}

/**
 * Sends a daily attendance log of all content synced in the last 24h
 */
async function sendAttendanceLog(posts) {
    if (!client || !postLogChannelId || !posts.length) return;

    try {
        const channel = await client.channels.fetch(postLogChannelId);
        if (!channel) return;

        const chunks = [];
        let currentChunk = '';
        
        posts.forEach(p => {
            const line = `${p.icon} \`${p.account.substring(0,12)}\`: [${p.title.substring(0,30)}...](${p.link})\n`;
            if ((currentChunk + line).length > 1900) {
                chunks.push(currentChunk);
                currentChunk = line;
            } else {
                currentChunk += line;
            }
        });
        if (currentChunk) chunks.push(currentChunk);

        for (const [index, chunk] of chunks.entries()) {
            const embed = new EmbedBuilder()
                .setTitle(index === 0 ? '📋 Daily Attendance: Content Log' : '📋 Attendance Log (Continued)')
                .setDescription(chunk)
                .setColor(0xBBBBBB)
                .setTimestamp();
            await channel.send({ embeds: [embed] });
        }
        console.log('[DiscordBot] ✅ Attendance Log sent.');
    } catch (err) {
        console.error('[DiscordBot] Failed to send attendance:', err.message);
    }
}

module.exports = { initDiscordBot, sendApprovalRequest, sendViralAlert, sendDailyDigest, sendAttendanceLog };
