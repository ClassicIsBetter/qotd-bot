const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { games } = require("../snake/state");
const { createGame, move } = require("../snake/engine");
const { render } = require("../snake/render");

function buttons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("snake_blank").setLabel("⬛").setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId("snake_up").setLabel("⬆️").setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("snake_left").setLabel("⬅️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("snake_down").setLabel("⬇️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("snake_right").setLabel("➡️").setStyle(ButtonStyle.Primary)
    )
  ];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("snake")
    .setDescription("Play snake"),

  async execute(interaction) {
    const game = createGame(interaction.user.id);

    const msg = await interaction.reply({
      content: render(game),
      components: buttons(),
      fetchReply: true
    });

    games.set(msg.id, game);
  }
};
