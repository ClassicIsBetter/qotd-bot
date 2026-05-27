const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Shows info about the server'),

  async execute(interaction) {

    const guild = interaction.guild;

    const embed = new EmbedBuilder()
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setColor(0x5865F2)
      .addFields(
        {
          name: 'Owner',
          value: `<@${guild.ownerId}>`,
          inline: true
        },
        {
          name: 'Members',
          value: `${guild.memberCount}`,
          inline: true
        },
        {
          name: 'Created',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
          inline: true
        },
        {
          name: 'Server ID',
          value: guild.id,
          inline: false
        },
        {
          name: 'Boost Level',
          value: `Level ${guild.premiumTier}`,
          inline: true
        },
        {
          name: 'Boosts',
          value: `${guild.premiumSubscriptionCount}`,
          inline: true
        }
      );

    return interaction.reply({ embeds: [embed] });
  }
};
