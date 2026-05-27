const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const responses = [

  "Yes.",
  "No.",
  "Probably.",
  "Maybe.",
  "Definitely.",
  "Absolutely not.",
  "Ask again later.",
  "Most likely.",
  "Very doubtful.",
  "Without a doubt.",
  "Signs point to yes.",
  "I don't think so.",
  "🐈"

];

module.exports = {

  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the 8ball a question')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('Your question')
        .setRequired(true)
    ),

  async execute(interaction) {

    const question =
      interaction.options.getString(
        'question'
      );

    const response =
      responses[
        Math.floor(
          Math.random() *
          responses.length
        )
      ];

    const embed =
      new EmbedBuilder()
        .setTitle('8Ball')
        .addFields(
          {
            name: 'Question',
            value: question
          },
          {
            name: 'Answer',
            value: response
          }
        )
        .setColor(0x000000);

    await interaction.reply({
      embeds: [embed]
    });
  }
};
