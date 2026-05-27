const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Shows info about a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to view (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {

    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Info`)
      .setThumbnail(user.displayAvatarURL())
      .setColor(0x5865F2)
      .addFields(
        {
          name: 'Username',
          value: user.tag,
          inline: true
        },
        {
          name: 'User ID',
          value: user.id,
          inline: true
        },
        {
          name: 'Account Created',
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
          inline: false
        }
      );

    if (member) {
      embed.addFields({
        name: 'Joined Server',
        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
        inline: false
      });
    }

    return interaction.reply({ embeds: [embed] });
  }
};
