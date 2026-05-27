const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const config = require('../config/snakeConfig');

const games = new Map();

// ---------------------
// SPAWN APPLE
// ---------------------
function spawnApple(snake) {
  while (true) {
    const pos = {
      x: Math.floor(Math.random() * config.size),
      y: Math.floor(Math.random() * config.size)
    };

    if (!snake.some(s => s.x === pos.x && s.y === pos.y)) {
      return pos;
    }
  }
}

// ---------------------
// RENDER
// ---------------------
function render(game) {
  let out = "";

  for (let y = 0; y < config.size; y++) {
    let row = "";

    for (let x = 0; x < config.size; x++) {

      const snakeIndex = game.snake.findIndex(
        s => s.x === x && s.y === y
      );

      if (snakeIndex === 0) {

        const head = game.direction;
        row += config.emojis.head[head];
      }

      else if (snakeIndex > 0) {
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

// ---------------------
// MOVE LOGIC
// ---------------------
function move(game, dir) {

  game.direction = dir;

  const head = { ...game.snake[0] };

  if (dir === "up") head.y--;
  if (dir === "down") head.y++;
  if (dir === "left") head.x--;
  if (dir === "right") head.x++;

  // wall collision (stop game)
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= config.size ||
    head.y >= config.size
  ) {
    game.over = true;
    return;
  }

  // check self collision
  if (game.snake.some(s => s.x === head.x && s.y === head.y)) {
    game.over = true;
    return;
  }

  // add new head
  game.snake.unshift(head);

  // apple eaten
  if (head.x === game.apple.x && head.y === game.apple.y) {
    game.apple = spawnApple(game.snake);
    game.score += 1; // ONLY increase here
  } else {
    game.snake.pop(); // remove tail if no food
  }
}

// ---------------------
// BUTTONS
// ---------------------
function buttons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("snake_blank")
        .setLabel("⬛")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),

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

// ---------------------
// COMMAND
// ---------------------
module.exports = {
  data: new SlashCommandBuilder()
    .setName('snake')
    .setDescription('Play snake'),

  async execute(interaction) {

    const game = {
      snake: [{ x: 2, y: 2 }],
      apple: spawnApple([{ x: 2, y: 2 }]),
      direction: "right",
      score: 0,
      userId: interaction.user.id,
      over: false
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
