const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const config = require("../config.json");
const { isOwner } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Snake config system")
    .addBooleanOption(o =>
      o.setName("automove").setDescription("toggle auto move")
    )
    .addIntegerOption(o =>
      o.setName("speed").setDescription("move speed ms")
    ),

  async execute(interaction) {
    if (!isOwner(interaction))
      return interaction.reply({ content: "No permission", ephemeral: true });

    const auto = interaction.options.getBoolean("automove");
    const speed = interaction.options.getInteger("speed");

    if (auto !== null) config.snake.autoMove = auto;
    if (speed) config.snake.speedMs = speed;

    fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));

    return interaction.reply({
      content: `Updated config:\nAutoMove: ${config.snake.autoMove}\nSpeed: ${config.snake.speedMs}ms`,
      ephemeral: true
    });
  }
};
