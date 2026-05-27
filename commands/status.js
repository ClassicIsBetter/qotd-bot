const { SlashCommandBuilder } = require('discord.js');
const { OWNER_IDS } = require("../config.json");

if (interaction.user.id !== config.ownerId) {
  return interaction.reply({
    content: "No permission.",
    ephemeral: true
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Set bot status (admin only)')
    .addStringOption(option =>
      option
        .setName('text')
        .setDescription('Status text')
        .setRequired(true)
    ),

  async execute(interaction, client) {

    const userId = interaction.user.id;

    // admin check
    if (!OWNER_IDS.includes(userId)) {
      return interaction.reply({
        content: "❌ You don't have permission to use this.",
        ephemeral: true
      });
    }

    const text = interaction.options.getString('text');

    client.user.setPresence({
      activities: [
        {
          name: text,
          type: 4 // Custom status
        }
      ],
      status: 'online'
    });

    return interaction.reply({
      content: `✅ Status updated to: **${text}**`
    });
  }
};
