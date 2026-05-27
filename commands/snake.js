const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const config = require('../config/snakeConfig');

const games = new Map();

function render(game) {
  const size = config.size;

  let out = "";

  for (let y = 0; y < size; y++) {
    let row = "";

    for (let x = 0; x < size; x++) {

      if (x === game.x && y === game.y) {
        row += config.emojis.body;
      }

      else if (x === game.apple.x && y === game.apple.y) {
        row += config.emojis.apple;
      }

      else {
        row += config.emojis.empty;
      }
    }

    out += row + "\n";
  }

  return out;
}

function move(game, dir) {

  if (dir === "up") game.y--;
  if (dir === "down") game.y++;
  if (dir === "left") game.x--;
  if (dir === "right") game.x++;

  if (game.x < 0) game.x = 0;
  if (game.y < 0) game.y = 0;
  if (game.x >= config.size) game.x = config.size - 1;
  if (game.y >= config.size) game.y = config.size - 1;
}

function buttons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("snake_up")
        .setLabel("⬆️")
        .setStyle(ButtonStyle.Primary)
    ),

    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("snake_left")
        .setLabel("⬅️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("snake_down")
        .setLabel("⬇️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("snake_right")
        .setLabel("➡️")
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('snake')
    .setDescription('Play snake'),

  async execute(interaction) {

    const game = {
      x: 2,
      y: 2,
      apple: {
        x: 4,
        y: 4
      },
      score: 0,
      userId: interaction.user.id
    };

    const msg = await interaction.reply({
      content:
`# Snake
Score: 0

${render(game)}`,
      components: buttons(),
      fetchReply: true
    });

    games.set(msg.id, game);
  },

  games,
  move,
  render,
  buttons
};
