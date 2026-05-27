const { SlashCommandBuilder } = require("discord.js");
const config = require("../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Set bot status")
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Status text")
        .setRequired(true)
    ),

  async execute(interaction) {

    // ✅ permission check goes HERE
    if (interaction.user.id !== config.ownerId) {
      return interaction.reply({
        content: "No permission.",
        ephemeral: true
      });
    }

    const text = interaction.options.getString("text");

    interaction.client.user.setPresence({
      activities: [
        {
          name: text,
          type: 4
        }
      ],
      status: "online"
    });

    return interaction.reply({
      content: `Status changed to: ${text}`,
      ephemeral: true
    });
  }
};
