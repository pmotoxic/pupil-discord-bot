require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences, // Add this for user updates
  ],
});

const GUILD_ID = '1318375220414906418'; // replace with your actual guild ID
const UPDATE_INTERVAL = 45 * 1000; // 45 seconds

// Map your Discord role names to JSON keys
const ROLE_MAP = {
  '・architect': 'Architect',
  '・franchise': 'Franchise',
  '・skyview (paid role)': 'Skyview',
  '・i own /pupil': 'Owner',
};

function updateUsersFileWithStatus() {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;

    const result = {};
    let totalMembers = 0;

    Object.entries(ROLE_MAP).forEach(([discordRoleName, jsonKey]) => {
      const role = guild.roles.cache.find(r => r.name === discordRoleName);
      if (!role) return;

      const users = role.members.map(member => {
        const user = member.user;
        const presence = guild.presences.cache.get(user.id);
        
        return {
          username: member.displayName || user.displayName,
          handle: user.username,
          avatar: user.displayAvatarURL({ format: 'png', size: 128 }),
          bio: user.bio || '',
          status: presence?.status || 'offline'
        };
      });

      if (users.length > 0) {
        result[jsonKey] = users;
        totalMembers += users.length;
      }
    });

    // Add server stats
    result.serverStats = {
      totalMembers: guild.memberCount,
      onlineMembers: guild.presences.cache.filter(p => p.status !== 'offline').size,
      roledMembers: totalMembers,
      serverName: guild.name,
      lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(path.join(__dirname, 'public', 'users.json'), JSON.stringify(result, null, 2));
    console.log(`✅ Users file updated - ${guild.memberCount} total members, ${totalMembers} with roles`);
  } catch (error) {
    console.error('❌ Error updating users file with status:', error);
  }
}

client.once('ready', () => {
  console.log(`🤖 Bot logged in as ${client.user.tag}`);
  updateUsersFileWithStatus(); // Initial load with status
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
  console.log(`🔄 Status updated for ${newPresence.user.username}: ${newPresence.status}`);
  updateUsersFileWithStatus(); // Update when someone's status changes
});

client.on('userUpdate', (oldUser, newUser) => {
  if (oldUser.bio !== newUser.bio) {
    console.log(`🔄 Bio updated for ${newUser.username}: ${newUser.bio}`);
    updateUsersFileWithStatus();
  }
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
  if (oldMember.displayName !== newMember.displayName || 
      !oldMember.roles.cache.equals(newMember.roles.cache)) {
    console.log(`🔄 Member updated: ${newMember.displayName}`);
    updateUsersFileWithStatus();
  }
});

client.login(process.env.BOT_TOKEN);
