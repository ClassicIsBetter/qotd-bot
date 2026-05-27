const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Roll a dice')
    .addIntegerOption(option =>
      option
        .setName('max')
        .setDescription('Maximum number')
        .setRequired(true)
    ),

  async execute(interaction) {

    const max = interaction.options.getInteger('max');

    if (max < 1) {
      return interaction.reply({
        content: "Max number must be at least 1.",
        ephemeral: true
      });
    }

    const roll = Math.floor(Math.random() * max) + 1;

    const embed = new EmbedBuilder()
      .setTitle('Dice Roll')
      .addFields(
        {
          name: 'Max Number',
          value: max.toString(),
          inline: true
        },
        {
          name: 'You Rolled',
          value: roll.toString(),
          inline: true
        }
      )
      .setColor(0xffffff);

    return interaction.reply({ embeds: [embed] });
  }
};
