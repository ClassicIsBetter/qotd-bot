const { games } = require("../snake/state");
const { move } = require("../snake/engine");
const { render } = require("../snake/render");
const config = require("../config.json");

module.exports = async (interaction) => {

  // BUTTONS
  if (interaction.isButton()) {

    const game = games.get(interaction.message.id);

    if (!game) return interaction.reply({ content: "Game expired", ephemeral: true });
    if (interaction.user.id !== game.userId)
      return interaction.reply({ content: "Not your game", ephemeral: true });

    if (interaction.customId === "snake_blank")
      return interaction.deferUpdate();

    const dir = interaction.customId.replace("snake_", "");
    game.direction = dir;

    move(game);

    if (game.over) {
      return interaction.update({
        content: `Game Over\nScore: ${game.snake.length - 1}\n\n${render(game)}`,
        components: []
      });
    }

    return interaction.update({
      content: `Score: ${game.snake.length - 1}\n\n${render(game)}`,
      components: require("../commands/snake").buttons?.() || []
    });
  }
};
