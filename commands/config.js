const {
  SlashCommandBuilder
} = require('discord.js');

const config = require('../config/snakeConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Change bot/game settings')
    .addStringOption(opt =>
      opt.setName('key')
        .setDescription('Setting key (autoMoveEnabled / speed)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('value')
        .setDescription('Value')
        .setRequired(true)
    ),

  async execute(interaction) {

    const key = interaction.options.getString('key');
    const value = interaction.options.getString('value');

    if (key === "autoMoveEnabled") {
      config.autoMove.enabled = value === "true";
    }

    if (key === "speed") {
      const ms = parseInt(value);
      if (!isNaN(ms)) config.autoMove.speed = ms;
    }

    return interaction.reply({
      content: `⚙️ Updated ${key} → ${value}`,
      ephemeral: true
    });
  }
};
