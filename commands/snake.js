const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const config = require('../config/snakeConfig');

const games = new Map();

// spawn apple
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

// render
function render(game) {
  let out = "";

  for (let y = 0; y < config.size; y++) {
    let row = "";

    for (let x = 0; x < config.size; x++) {

      const index = game.snake.findIndex(s => s.x === x && s.y === y);

      if (index === 0) {
        row += config.emojis.head[game.direction];
      }

      else if (index > 0) {
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

// GAME OVER CLEANUP
function endGame(gameId, interaction) {
  const game = games.get(gameId);
  if (!game) return;

  game.over = true;

  games.delete(gameId);

  interaction.editReply({
    content: `💀 Game Over!\nScore: ${game.score}`,
    components: []
  }).catch(() => {});
}

// move logic
function move(game, dir) {

  if (game.over) return;

  game.direction = dir;

  const head = { ...game.snake[0] };

  if (dir === "up") head.y--;
  if (dir === "down") head.y++;
  if (dir === "left") head.x--;
  if (dir === "right") head.x++;

  // death
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= config.size ||
    head.y >= config.size ||
    game.snake.some(s => s.x === head.x && s.y === head.y)
  ) {
    game.over = true;
    return;
  }

  game.snake.unshift(head);

  if (head.x === game.apple.x && head.y === game.apple.y) {
    game.apple = spawnApple(game.snake);
    game.score++;
  } else {
    game.snake.pop();
  }
}

// buttons
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

// AUTO MOVE LOOP
function startAutoMove(client) {

  setInterval(async () => {

    if (!config.autoMove.enabled) return;

    for (const [msgId, game] of games.entries()) {

      if (game.over) continue;

      try {
        const channel = await client.channels.fetch(game.channelId);
        const msg = await channel.messages.fetch(msgId);

        move(game, game.direction);

        if (game.over) {
          games.delete(msgId);
          await msg.edit({
            content: `💀 Game Over!\nScore: ${game.score}`,
            components: []
          });
          continue;
        }

        await msg.edit({
          content:
`# Snake
Score: ${game.score}

${render(game)}`,
          components: buttons()
        });

      } catch (e) {}
    }

  }, config.autoMove.speed);
}

// COMMAND
module.exports = {
  data: new SlashCommandBuilder()
    .setName('snake')
    .setDescription('Play snake'),

  async execute(interaction, client) {

    const game = {
      snake: [{ x: 2, y: 2 }],
      apple: spawnApple([{ x: 2, y: 2 }]),
      direction: "right",
      score: 0,
      userId: interaction.user.id,
      channelId: interaction.channel.id,
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
  buttons,
  startAutoMove
};
