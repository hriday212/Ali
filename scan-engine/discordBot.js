const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, StringSelectMenuBuilder } = require('discord.js');

let client = null;
let adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID;
let approvalChannelId = process.env.DISCORD_APPROVAL_CHANNEL_ID;
let viralAlertsChannelId = process.env.DISCORD_VIRAL_ALERTS_CHANNEL_ID;

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

    client.on('ready', async () => {
        console.log(`[DiscordBot] Logged in as ${client.user.tag}`);
        
        const commands = [
            { name: 'status', description: 'Get high-level overview of the LinkMe Scan Engine.' },
            { name: 'scans', description: 'List all active monitoring nodes and their current health.' },
            { name: 'audit', description: 'Detailed report for the network or a specific account.', options: [
                { name: 'timeframe', type: 3, description: 'Select audit window (Today, 7D, 30D, ALL)', required: false, choices: [
                    { name: 'Today', value: 'today' }, { name: '7 Days', value: '7d' }, { name: '30 Days', value: '30d' }, { name: 'All Time', value: 'all' }
                ]},
                { name: 'date', type: 3, description: 'Audit a specific date (YYYY-MM-DD)', required: false },
                { name: 'node_id', type: 3, description: 'Optional: Audit a specific node ID', required: false }
            ]},
            { name: 'test_viral', description: 'TEST: Send a mock viral alert' },
            { name: 'test_attendance', description: 'TEST: Send a mock attendance log' },
            { name: 'test_approval', description: 'TEST: Send a mock escalation request' },
            { name: 'test_summary', description: 'TEST: Send a mock daily network summary' },
            { name: 'force_sync', description: 'ADMIN: Force an immediate global sync for all accounts' }
        ];

        try {
            await client.application.commands.set(commands);
            const guilds = await client.guilds.fetch();
            for (const [id, guild] of guilds) {
                const fullGuild = await guild.fetch();
                await fullGuild.commands.set(commands);
            }
            console.log('[DiscordBot] Slash commands propagation forced.');
        } catch (e) {
            console.error('[DiscordBot] Slash command registration failed:', e.message);
        }
    });

    client.on('interactionCreate', async (interaction) => {
        if (interaction.isCommand()) {
            if (interaction.commandName === 'status') {
                await interaction.deferReply();
                const summary = await getSummary(null, '24h', null);
                const embed = new EmbedBuilder().setTitle('📊 Account Overview').setColor(0x00D1FF).setDescription(summary.brief).setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

            if (interaction.commandName === 'scans') {
                await interaction.deferReply();
                const summary = await getSummary(null, '24h', null);
                const lines = summary.inventory.split('\n');
                const pageSize = 15;
                const pages = [];
                for (let i = 0; i < lines.length; i += pageSize) pages.push(lines.slice(i, i + pageSize).join('\n'));

                let currentPage = 0;
                const getEmbed = (idx) => new EmbedBuilder().setTitle(`📡 All Accounts (Page ${idx + 1}/${pages.length})`).setColor(0xBBBBBB).setDescription(pages[idx]).setFooter({ text: `Clypso Sentinel • ${lines.length} total nodes` }).setTimestamp();
                const getRow = (idx) => new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('prev').setLabel('⬅️ Previous').setStyle(ButtonStyle.Secondary).setDisabled(idx === 0),
                    new ButtonBuilder().setCustomId('next').setLabel('Next ➡️').setStyle(ButtonStyle.Secondary).setDisabled(idx === pages.length - 1)
                );

                const msg = await interaction.editReply({ embeds: [getEmbed(currentPage)], components: pages.length > 1 ? [getRow(currentPage)] : [] });
                if (pages.length > 1) {
                    const collector = msg.createMessageComponentCollector({ time: 60000 });
                    collector.on('collect', async i => {
                        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Start your own search!', ephemeral: true });
                        if (i.customId === 'prev') currentPage--; else currentPage++;
                        await i.update({ embeds: [getEmbed(currentPage)], components: [getRow(currentPage)] });
                    });
                }
                return;
            }

            if (interaction.commandName === 'audit') {
                await interaction.deferReply();
                const summary = await getSummary(interaction.options.getString('node_id'), interaction.options.getString('timeframe') || '24h', interaction.options.getString('date'));
                const embed = new EmbedBuilder().setTitle(interaction.options.getString('node_id') ? `🔍 Account Audit: ${interaction.options.getString('node_id')}` : '🛡️ Daily Report').setColor(0x00D1FF).setDescription(interaction.options.getString('node_id') ? summary.nodeDetail : summary.detailed).setTimestamp();
                if (summary.thumbnail) embed.setThumbnail(summary.thumbnail);
                return await interaction.editReply({ embeds: [embed] });
            }

            if (['test_viral', 'test_attendance', 'test_summary', 'test_approval', 'force_sync'].includes(interaction.commandName)) {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                if (adminRoleId && !interaction.member.roles.cache.has(adminRoleId)) return interaction.editReply('❌ Admin role required.');
                
                if (interaction.commandName === 'test_viral') {
                    const summary = await getSummary(null, '24h', null);
                    if (!summary.topPerformer) return interaction.editReply('ℹ️ No growth data available to simulate viral alert.');
                    
                    // Use real data from the top performer
                    const top = summary.topPerformer;
                    await sendViralAlert(top.accountId, top.platform, { delta: top.gain, multiplier: top.multiplier || 2.4, zScore: top.zScore || 3.1 }, { 
                        name: top.name, 
                        link: top.link,
                        topPosts: top.topPosts // Real hyperlinked videos with likes/comments
                    });
                    return await interaction.editReply(`✅ **Real-Data Viral Alert Sent** for top performer: **${top.name}**.`);
                }
                if (interaction.commandName === 'test_attendance') {
                    const summary = await getSummary(null, '24h', null);
                    await sendAttendanceLog(summary.attendanceLog);
                    return await interaction.editReply('✅ Attendance Log Sent.');
                }
                if (interaction.commandName === 'test_summary') {
                    const summary = await getSummary(null, '24h', null);
                    await sendDailyDigest(summary);
                    return await interaction.editReply('✅ Daily Summary Sent.');
                }
                if (interaction.commandName === 'test_approval') {
                    await sendApprovalRequest('TEST_ACCOUNT', 1440, 60);
                    return await interaction.editReply('✅ Approval Request Sent.');
                }
                if (interaction.commandName === 'force_sync') {
                    await require('./server').autoStartDefaults();
                    return await interaction.editReply('🚀 Global Sync Forced.');
                }
            }
        }

        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
        const parts = interaction.customId.split(':');
        const action = parts[0];
        const accountId = parts[1];

        if (['approve_escalation', 'deny_escalation', 'set_interval'].includes(action)) {
            if (adminRoleId && !interaction.member.roles.cache.has(adminRoleId)) return interaction.reply({ content: '❌ Unauthorized.', flags: MessageFlags.Ephemeral });

            if (action === 'deny_escalation') {
                const embed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(0xFF4444).setTitle('❌ Escalation Denied').addFields({ name: 'Denied By', value: `<@${interaction.user.id}>` });
                return await interaction.update({ content: '❌ **Request Rejected**', embeds: [embed], components: [] });
            }

            let targetInterval = action === 'set_interval' ? parseInt(interaction.values[0]) : parseInt(parts[2]);
            try {
                await onApprove(accountId, targetInterval);
                const embed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(0x00FF00).setTitle('✅ Escalation Approved').addFields({ name: 'New Interval', value: `\`${targetInterval}m\``, inline: true }, { name: 'Approved By', value: `<@${interaction.user.id}>`, inline: true });
                await interaction.update({ content: '✅ **Shift Applied**', embeds: [embed], components: [] });
            } catch (err) { interaction.reply({ content: '❌ Error applying shift.', flags: MessageFlags.Ephemeral }); }
        }
    });

    await client.login(token);
    return client;
}

async function sendApprovalRequest(accountId, current, target) {
    if (!client || !approvalChannelId) return;
    const channel = await client.channels.fetch(approvalChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder().setTitle('🚀 Viral Escalation Request').setDescription(`High viral momentum detected for **${accountId}**. Suggesting shift to high-frequency monitoring.`).setColor(0xFFAA00).addFields({ name: 'Current Speed', value: `Every ${Math.round(current/60)}h`, inline: true }, { name: 'Suggested Speed', value: `Every ${target}m`, inline: true }).setTimestamp();
    const btnRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`approve_escalation:${accountId}:${target}`).setLabel('Approve Suggested').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`deny_escalation:${accountId}`).setLabel('Deny Request').setStyle(ButtonStyle.Danger)
    );
    const selectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(`set_interval:${accountId}`).setPlaceholder('Or select a custom interval...').addOptions([
            { label: 'Every 30 mins', value: '30' }, { label: 'Every 2 hours', value: '120' }, { label: 'Every 6 hours', value: '360' }, { label: 'Every 12 hours', value: '720' }, { label: 'Daily (Reset)', value: '1440' }
        ])
    );
    await channel.send({ embeds: [embed], components: [btnRow, selectRow] });
}

async function sendViralAlert(accountId, platform, growthData, accountMeta = {}) {
    if (!client || !viralAlertsChannelId) return;
    const channel = await client.channels.fetch(viralAlertsChannelId);
    if (!channel) return;
    const embed = new EmbedBuilder().setTitle('🔥 VIRAL SIGNAL DETECTED').setDescription(`Significant momentum spike detected for node [${accountMeta.name || accountId}](${accountMeta.link || '#'}) on ${platform.toUpperCase()}.`).setColor(0xFF4500).addFields(
        { name: 'Velocity Spike', value: `+${fmtCount(growthData.delta)} views`, inline: true }, 
        { name: 'Growth Multiplier', value: `${growthData.multiplier.toFixed(1)}x`, inline: true }, 
        { name: 'Z-Score Momentum', value: growthData.zScore.toFixed(2), inline: true }
    ).setThumbnail('https://cdn-icons-png.flaticon.com/512/1680/1680951.png').setTimestamp();
    if (accountMeta.topPosts?.length > 0) {
        let text = '';
        accountMeta.topPosts.forEach((p, idx) => {
            const stats = `📈 ${fmtCount(p.views)} | ❤️ ${fmtCount(p.likes)} | 💬 ${fmtCount(p.comments)}`;
            text += `${idx + 1}. [${p.title?.substring(0,35) || 'Untitled'}](${p.link})\n└ ${stats}\n`;
        });
        embed.addFields({ name: '🚀 Trending Content', value: text });
    }
    await channel.send({ embeds: [embed] });
}

const fmtCount = (num) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

async function sendDailyDigest(summaryData) {
    if (!client || !reportsChannelId) return;
    const channel = await client.channels.fetch(reportsChannelId);
    if (!channel) return;
    const { totalNodes, totalViews, periodViewsGain, healthy, failing, ytCount, ttCount, igCount, topPerformer, passedList, failedList } = summaryData;
    const healthPct = Math.round((healthy / totalNodes) * 100);
    const embed = new EmbedBuilder().setTitle('📊 Daily Network Report').setColor(healthPct >= 80 ? 0x00FF99 : 0xFFAA00).setDescription(`24-hour snapshot for **${totalNodes} accounts**.`)
        .addFields(
            { name: '📈 Reach', value: `\`${fmtCount(totalViews)}\` total\n\`+${fmtCount(periodViewsGain)}\` today`, inline: true }, 
            { name: '💚 Health', value: `\`${healthy}\` pass / \`${failing}\` fail\n**${healthPct}%** uptime`, inline: true }, 
            { name: '🌐 Platforms', value: `🔴 YT: \`${ytCount}\` ⚫ TT: \`${ttCount}\` 🟣 IG: \`${igCount}\``, inline: true }
        );
    const truncateList = (list) => {
        if (!list || list.length === 0) return '';
        let result = '';
        for (let i = 0; i < list.length; i++) {
            const nextLine = list[i] + '\n';
            if ((result + nextLine).length > 950) { // Safety margin
                return result + `*+ ${list.length - i} more... (Use /scans)*`;
            }
            result += nextLine;
        }
        return result;
    };

    if (topPerformer) embed.addFields({ name: '🏆 Top Performer', value: `[${topPerformer.name}](${topPerformer.link}) — **+${fmtCount(topPerformer.gain)} views**` });
    if (passedList?.length > 0) embed.addFields({ name: `✅ Passing (${healthy})`, value: truncateList(passedList) });
    if (failedList?.length > 0) embed.addFields({ name: `⚠️ Failing (${failing})`, value: truncateList(failedList) });
    embed.setFooter({ text: 'Clypso Sentinel • Automated Report' }).setTimestamp();
    await channel.send({ embeds: [embed] });
}

async function sendAttendanceLog(posts) {
    if (!client || !viralAlertsChannelId) return;
    const channel = await client.channels.fetch(viralAlertsChannelId);
    if (!channel) return;
    if (!posts?.length) return await channel.send({ embeds: [new EmbedBuilder().setTitle('📋 Daily Attendance').setDescription('⚠️ No new content detected.').setColor(0xFFAA00)] });
    const lines = posts.map(p => `${p.icon} **${p.account.substring(0,20)}**: [${p.title?.substring(0,40) || 'Video'}](${p.link})`);
    const pages = []; for (let i = 0; i < lines.length; i += 15) pages.push(lines.slice(i, i + 15).join('\n'));
    let cur = 0;
    const getEmbed = (idx) => new EmbedBuilder().setTitle(`📋 Attendance Log (Page ${idx+1}/${pages.length})`).setColor(0x00D1FF).setDescription(pages[idx]).setTimestamp();
    const getRow = (idx) => new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('lp').setLabel('Prev').setStyle(ButtonStyle.Secondary).setDisabled(idx === 0), new ButtonBuilder().setCustomId('ln').setLabel('Next').setStyle(ButtonStyle.Secondary).setDisabled(idx === pages.length - 1));
    const msg = await channel.send({ embeds: [getEmbed(cur)], components: pages.length > 1 ? [getRow(cur)] : [] });
    if (pages.length > 1) {
        const collector = msg.createMessageComponentCollector({ time: 3600000 });
        collector.on('collect', async i => {
            if (i.customId === 'lp') cur--; else cur++;
            await i.update({ embeds: [getEmbed(cur)], components: [getRow(cur)] });
        });
    }
}

module.exports = { initDiscordBot, sendApprovalRequest, sendViralAlert, sendDailyDigest, sendAttendanceLog };
