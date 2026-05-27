const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const games = new Map();

function render(game) {
  const size = 6;
  let out = "";

  for (let y = 0; y < size; y++) {
    let row = "";

    for (let x = 0; x < size; x++) {

      if (x === game.x && y === game.y) {
        row += "🟩";
      } else if (x === game.apple.x && y === game.apple.y) {
        row += "🍎";
      } else {
        row += "⬛";
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

  // bounds
  if (game.x < 0) game.x = 0;
  if (game.y < 0) game.y = 0;
  if (game.x > 5) game.x = 5;
  if (game.y > 5) game.y = 5;

  // apple
  if (game.x === game.apple.x && game.y === game.apple.y) {
    game.apple = {
      x: Math.floor(Math.random() * 6),
      y: Math.floor(Math.random() * 6)
    };

    game.score++;
  }
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

  async execute(interaction, client) {

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
      content: `# Snake\nScore: 0\n\n${render(game)}`,
      components: buttons(),
      fetchReply: true
    });

    games.set(msg.id, game);
  },

  // export for interaction handler
  games,
  move,
  render
};
