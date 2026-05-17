const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

// =====================
// ENV
// =====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const INPUT_CHANNEL_ID = process.env.INPUT_CHANNEL_ID;
const OUTPUT_CHANNEL_ID = process.env.OUTPUT_CHANNEL_ID;
const REVIEW_CHANNEL_ID = process.env.REVIEW_CHANNEL_ID;

// =====================
// OWNER
// =====================
const OWNER_ID = "1285513478315966506";

// =====================
// ROLE PING
// =====================
const QOTD_ROLE_ID = "1479019281126785096";

// =====================
// PRESET QOTDS
// =====================
const presetQOTDs = [

`"pizza or burger"
🍕 | Pizza
🍔 | Burger`,

`"what is the best minecraft block?"
🟩 | Grass Block
💎 | Diamond Block`,

`"cats or dogs?"
🐈 | Cats
🐕 | Dogs`
];

// =====================
// SIMPLE COMMANDS
// =====================
const simpleCommands = {

  ping: {
    message: "Pong!",
    description: "check if the bot is alive"
  },

  help: {
    embed: true,
    title: "List Of Commands",
    color: 0xA9A9A9,

    message:
`
/suggestqotd
Suggest a QOTD

/qotdqueue
View your queued QOTDs + statuses

/sendqotd
Force send oldest QOTD

/forceqotd
Force send a specific queued QOTD

/snake
Play snake

/help
Shows this command list

/ping
Check if the bot is alive
`,

    description: "list all commands"
  }
};

// =====================
// STATE
// =====================
let qotdNumber = 24;

// =====================
// SNAKE GAMES
// =====================
const snakeGames = new Map();
const minesweeperGames = new Map();

const snakeSettings = {
  maxApples: 3
};

console.log("Bot starting...");

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// =====================
// COMMANDS
// =====================
const commands = [

  ...Object.keys(simpleCommands).map(cmd =>
    new SlashCommandBuilder()
      .setName(cmd)
      .setDescription(simpleCommands[cmd].description)
      .toJSON()
  ),

  new SlashCommandBuilder()
    .setName('suggestqotd')
    .setDescription('Suggest a QOTD')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('sendqotd')
    .setDescription('Force send oldest QOTD')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('forceqotd')
    .setDescription('Force send a specific queued QOTD')
    .addIntegerOption(option =>
      option
        .setName('number')
        .setDescription('Queue number to send')
        .setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
  .setName('qotdqueue')
  .setDescription('View your queued QOTDs')
  .toJSON(),
  
new SlashCommandBuilder()
  .setName('snake')
  .setDescription('Play snake')
  .toJSON(),

new SlashCommandBuilder()
  .setName('minesweeper')
  .setDescription('Play Minesweeper')
  .toJSON(),

new SlashCommandBuilder()
  .setName('ms')
  .setDescription('Reveal a tile (example: a5)')
  .addStringOption(opt =>
    opt
      .setName('cell')
      .setDescription('Example: a5')
      .setRequired(true)
  )
  .toJSON()

]; // 👈 MUST BE HERE
// =====================
// REGISTER COMMANDS
// =====================
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registering commands...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Commands ready.");

  } catch (err) {
    console.error(err);
  }
})();

// =====================
// EXTRACT EMOJIS
// =====================
function extractEmojis(lines) {

  return lines
    .filter(line => line.includes("|"))
    .map(line =>
      line.split("|")[0].trim()
    );
}

// =====================
// SNAKE RENDER
// =====================
function renderSnake(game) {

  const size = 8;

  let grid = [];

  for (let y = 0; y < size; y++) {

    let row = [];

    for (let x = 0; x < size; x++) {

      // apple
      if (
        x === game.apple.x &&
        y === game.apple.y
      ) {

        row.push("🍎");
        continue;
      }

      // snake
      const snakePart =
        game.snake.find(
          s =>
            s.x === x &&
            s.y === y
        );

      if (snakePart) {

        // head
        if (
          snakePart.x === game.snake[0].x &&
          snakePart.y === game.snake[0].y
        ) {

          if (game.direction === "up")
            row.push("⬆️");

          else if (game.direction === "down")
            row.push("⬇️");

          else if (game.direction === "left")
            row.push("⬅️");

          else
            row.push("➡️");

        } else {

          // body
          row.push("🟩");
        }

        continue;
      }

      // empty
      row.push("⬛");
    }

    grid.push(row.join(""));
  }

  return grid.join("\n");
}

// =====================
// MINESWEEPER CORE
// =====================

function createMinesweeper(size) {

  const board = [];

  // create tiles
  for (let y = 0; y < size; y++) {

    board[y] = [];

    for (let x = 0; x < size; x++) {

      board[y][x] = {
        bomb: false,
        revealed: false,
        number: 0
      };
    }
  }

  // place bombs
  let bombsPlaced = 0;

  while (bombsPlaced < 6) {

    const x =
      Math.floor(
        Math.random() * size
      );

    const y =
      Math.floor(
        Math.random() * size
      );

    if (!board[y][x].bomb) {

      board[y][x].bomb = true;

      bombsPlaced++;
    }
  }

  // calculate numbers
  for (let y = 0; y < size; y++) {

    for (let x = 0; x < size; x++) {

      if (board[y][x].bomb)
        continue;

      let count = 0;

      for (let dy = -1; dy <= 1; dy++) {

        for (let dx = -1; dx <= 1; dx++) {

          if (dx === 0 && dy === 0)
            continue;

          const nx = x + dx;
          const ny = y + dy;

          if (
            nx >= 0 &&
            ny >= 0 &&
            nx < size &&
            ny < size &&
            board[ny][nx].bomb
          ) {
            count++;
          }
        }
      }

      board[y][x].number = count;
    }
  }

  return {
    size,
    board
  };
}
// flood fill
function floodFill(game, x, y) {

  // outside board
  if (
    x < 0 ||
    y < 0 ||
    x >= game.size ||
    y >= game.size
  ) return;

  const tile = game.board[y][x];

  // stop if already revealed
  if (tile.revealed) return;

  // stop bombs
  if (tile.bomb) return;

  // reveal FIRST
  tile.revealed = true;

  // stop spreading at numbers
  if (tile.number > 0) return;

  // spread
  for (let dy = -1; dy <= 1; dy++) {

    for (let dx = -1; dx <= 1; dx++) {

      // skip self
      if (dx === 0 && dy === 0)
        continue;

      floodFill(
        game,
        x + dx,
        y + dy
      );
    }
  }
}

// render
function renderMinesweeper(game) {

  const letters = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫"];

  let text =
`⬛1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣
`;

  for (let y = 0; y < game.size; y++) {

    text += `${letters[y]} `;

    for (let x = 0; x < game.size; x++) {

      const tile =
        game.board[y][x];

      // unrevealed
      if (!tile.revealed) {

        text += "🟦";
        continue;
      }

      // bomb
      if (tile.bomb) {

        text += "💣";
        continue;
      }

      // empty
      if (tile.number === 0) {

        text += "⬛";
        continue;
      }

      // numbers
      const numbers = {
        1: "1️⃣",
        2: "2️⃣",
        3: "3️⃣",
        4: "4️⃣",
        5: "5️⃣",
        6: "6️⃣",
        7: "7️⃣",
        8: "8️⃣"
      };

      text +=
        numbers[tile.number];
    }

    text += "\n";
  }

  return text;
}
// =====================
// MOVE SNAKE
// =====================
function moveSnake(game) {

  const head = {
    ...game.snake[0]
  };

  if (game.direction === "up")
    head.y--;

  if (game.direction === "down")
    head.y++;

  if (game.direction === "left")
    head.x--;

  if (game.direction === "right")
    head.x++;

  // wall collision
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= 8 ||
    head.y >= 8
  ) {

    game.over = true;
    return;
  }

  // self collision
  if (
    game.snake.some(
      s =>
        s.x === head.x &&
        s.y === head.y
    )
  ) {

    game.over = true;
    return;
  }

  game.snake.unshift(head);

  // apple
  if (
    head.x === game.apple.x &&
    head.y === game.apple.y
  ) {

    let valid = false;

    while (!valid) {

      const newApple = {
        x: Math.floor(
          Math.random() * 8
        ),
        y: Math.floor(
          Math.random() * 8
        )
      };

      if (
        !game.snake.some(
          s =>
            s.x === newApple.x &&
            s.y === newApple.y
        )
      ) {

        if (currentApples < snakeSettings.maxApples) {
  spawnApple();
}
      }
    }

  } else {

    game.snake.pop();
  }
}

// =====================
// SNAKE BUTTONS
// =====================
function snakeButtons() {

  return [

    new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId("snake_blank")
          .setLabel("⬛")
          .setStyle(
            ButtonStyle.Secondary
          )
          .setDisabled(true),

new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setCustomId("up")
      .setLabel("⬆️")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("snake_settings")
      .setLabel("⚙️ Settings")
      .setStyle(ButtonStyle.Secondary)
  ),

new ActionRowBuilder()
  .addComponents(
        new ButtonBuilder()
          .setCustomId("snake_left")
          .setLabel("⬅️")
          .setStyle(
            ButtonStyle.Primary
          ),

        new ButtonBuilder()
          .setCustomId("snake_down")
          .setLabel("⬇️")
          .setStyle(
            ButtonStyle.Primary
          ),

        new ButtonBuilder()
          .setCustomId("snake_right")
          .setLabel("➡️")
          .setStyle(
            ButtonStyle.Primary
          )
      )
    )
  ];
}
// =====================
// POST QOTD
// =====================
async function postQOTD(content) {

  const outputChannel =
    await client.channels.fetch(
      OUTPUT_CHANNEL_ID
    );

  const lines = content
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const reactions =
    extractEmojis(lines);

  const embed = new EmbedBuilder()
    .setTitle(`QOTD #${qotdNumber}`)
    .setDescription(content)
    .setColor(0xffcc00);

  const sent = await outputChannel.send({
    content: `<@&${QOTD_ROLE_ID}>`,
    embeds: [embed]
  });

  // reactions
  for (const reaction of reactions) {

    await sent.react(reaction)
      .catch(() => {});
  }

  // thread
  await sent.startThread({
    name: `QOTD #${qotdNumber} discussion`,
    autoArchiveDuration: 1440
  }).catch(() => {});

  qotdNumber++;
}

// =====================
// SEND QOTD
// =====================
async function sendQOTD() {

  try {

    const inputChannel =
      await client.channels.fetch(
        INPUT_CHANNEL_ID
      );

    const messages =
      await inputChannel.messages.fetch({
        limit: 100
      });

    const sorted =
      [...messages.values()]
        .sort((a, b) =>
          a.createdTimestamp -
          b.createdTimestamp
        );

    if (sorted.length > 0) {

      const oldest =
        sorted[0];

      await postQOTD(
        oldest.content
      );

      await oldest.delete()
        .catch(() => {});

    } else {

      const randomPreset =
        presetQOTDs[
          Math.floor(
            Math.random() *
            presetQOTDs.length
          )
        ];

      await postQOTD(
        randomPreset
      );
    }

  } catch (err) {

    console.error(
      "QOTD error:",
      err
    );
  }
}

// =====================
// SCHEDULE
// =====================
function scheduleQOTD(hour, minute) {

  setInterval(() => {

    const now = new Date();

    const adelaide = new Date(
      now.toLocaleString(
        "en-US",
        {
          timeZone:
            "Australia/Adelaide"
        }
      )
    );

    if (
      adelaide.getHours() === hour &&
      adelaide.getMinutes() === minute
    ) {

      sendQOTD();
    }

  }, 60000);
}

// =====================
// READY
// =====================
client.once('ready', () => {

  console.log(
    `Logged in as ${client.user.tag}`
  );

  scheduleQOTD(16, 30);
});

// =====================
// INTERACTIONS
// =====================
client.on(
  'interactionCreate',
  async (interaction) => {

    // =====================
    // MODAL SUBMIT
    // =====================
    if (interaction.isModalSubmit()) {

      if (interaction.isModalSubmit() && interaction.customId === "snake_settings_modal") {

  const input = interaction.fields.getTextInputValue("max_apples");
  const value = parseInt(input);

  // safety check
  if (isNaN(value) || value < 1 || value > 20) {
    return interaction.reply({
      content: "Please enter a number between 1 and 20.",
      ephemeral: true
    });
  }

  // make sure settings object exists
  if (!global.snakeSettings) {
    global.snakeSettings = {
      maxApples: 3
    };
  }

  // save setting
  snakeSettings.maxApples = value;

  return interaction.reply({
    content: `✅ Max apples set to **${value}**`,
    ephemeral: true
  });
}

      if (
        interaction.customId ===
        'qotdModal'
      ) {

        const question =
          interaction.fields.getTextInputValue(
            'question'
          );

        const answers =
          interaction.fields.getTextInputValue(
            'answers'
          );

        const reviewChannel =
          await client.channels.fetch(
            REVIEW_CHANNEL_ID
          );

        

        const qotdContent =
`"${question}" suggested by <@${interaction.user.id}>
${answers}`;

        const embed =
          new EmbedBuilder()
            .setTitle(
              "New QOTD Suggestion"
            )
            .setDescription(
              qotdContent
            )
            .setColor(0xffff00)
            .setFooter({
              text:
                "Status: Pending"
            });

        const buttons =
          new ActionRowBuilder()
            .addComponents(

              new ButtonBuilder()
                .setCustomId(
                  "accept_qotd"
                )
                .setLabel(
                  "Accept"
                )
                .setStyle(
                  ButtonStyle.Success
                ),

              new ButtonBuilder()
                .setCustomId(
                  "decline_qotd"
                )
                .setLabel(
                  "Decline"
                )
                .setStyle(
                  ButtonStyle.Danger
                )
            );

        const reviewMessage =
          await reviewChannel.send({
            embeds: [embed],
            components: [buttons]
          });

        await reviewMessage.startThread({
          name:
            `Review: ${question.slice(0, 50)}`,
          autoArchiveDuration: 1440
        }).catch(() => {});

        return interaction.reply({
          content:
            "Your QOTD was submitted for review.",
          ephemeral: true
        });
      }

      if (interaction.isModalSubmit()) {

  if (interaction.customId === "ms_modal") {

    const cell =
      interaction.fields
        .getTextInputValue("cell")
        .toLowerCase();

    const game =
      minesweeperGames.get(
        interaction.channel.id
      );

    if (!game) {
      return interaction.reply({
        content: "No active Minesweeper game found.",
        ephemeral: true
      });
    }

    const letters = "abcdef";

    const y = letters.indexOf(cell[0]);
    const x = parseInt(cell.slice(1)) - 1;

    if (
      y < 0 ||
      x < 0 ||
      y >= game.size ||
      x >= game.size
    ) {
      return interaction.reply({
        content: "Invalid cell.",
        ephemeral: true
      });
    }

    const tile = game.board[y][x];

    // 💥 bomb hit
    if (tile.bomb) {

      tile.revealed = true;

      // reveal all bombs
      for (let yy = 0; yy < game.size; yy++) {
        for (let xx = 0; xx < game.size; xx++) {
          if (game.board[yy][xx].bomb) {
            game.board[yy][xx].revealed = true;
          }
        }
      }

      minesweeperGames.delete(interaction.channel.id);
    }

    // 🌊 safe tile
    else {

      if (tile.number === 0) {
        floodFill(game, x, y);
      } else {
        tile.revealed = true;
      }
    }

    // 🧠 EDIT THE ORIGINAL MESSAGE (IMPORTANT PART)
    const message =
      await interaction.channel.messages.fetch(
        interaction.message.id
      ).catch(() => null);

    if (!message) {
      return interaction.reply({
        content: "Game message not found.",
        ephemeral: true
      });
    }

    return message.edit({
      content:
`# Minesweeper

Click "Reveal Cell" to play

${renderMinesweeper(game)}`
    });
  }
}
      return;
    }


    // =====================
// BUTTONS
// =====================
if (interaction.isButton()) {

  // =====================
  // SNAKE BUTTONS
  // =====================
  if (
    !interaction.customId.startsWith(
      "snake_"
    )
  ) {

    // continue to qotd buttons

  } else {

    // blank button
    if (
      interaction.customId ===
      "snake_blank"
    ) {

      return interaction.deferUpdate();
    }

    const game =
      snakeGames.get(
        interaction.message.id
      );

    if (!game) {

      return interaction.reply({
        content:
          "Game expired.",
        ephemeral: true
      });
    }

    if (
      interaction.user.id !==
      game.userId
    ) {

      return interaction.reply({
        content:
          "This isn't your game.",
        ephemeral: true
      });
    }

    const direction =
      interaction.customId.replace(
        "snake_",
        ""
      );

    game.direction =
      direction;

    moveSnake(game);

    // game over
    if (game.over) {

      return interaction.update({
        content:
`# Game Over

Score: ${game.snake.length - 1}

${renderSnake(game)}`,
        components: []
      });
    }

    return interaction.update({
      content:
`# Snake

Score: ${game.snake.length - 1}

${renderSnake(game)}`,
      components:
        snakeButtons()
    });
  }

  //snek settings
  if (interaction.isButton() && interaction.customId === "snake_settings") {

  const modal = new ModalBuilder()
    .setCustomId("snake_settings_modal")
    .setTitle("Snake Settings");

  const maxApples = new TextInputBuilder()
    .setCustomId("max_apples")
    .setLabel("Max Apples")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g. 3")
    .setRequired(true);

  const row = new ActionRowBuilder().addComponents(maxApples);

  modal.addComponents(row);

  return interaction.showModal(modal);
}

  //minesweepper
  if (interaction.isButton()) {

  if (interaction.customId === "ms_reveal") {

    const modal = new ModalBuilder()
      .setCustomId("ms_modal")
      .setTitle("Reveal Minesweeper Cell");

    const cellInput = new TextInputBuilder()
      .setCustomId("cell")
      .setLabel("Enter cell (example: a5)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(cellInput);

    modal.addComponents(row);

    return interaction.showModal(modal);
  }
}

  // =====================
  // QOTD BUTTONS
  // =====================
  if (
    interaction.user.id !==
    OWNER_ID
  ) {

    return interaction.reply({
      content:
        "No permission.",
      ephemeral: true
    });
  }

  const embed =
    interaction.message.embeds[0];

  if (!embed) return;

  const content =
    embed.description;

  const newEmbed =
    EmbedBuilder.from(embed);

  // =====================
  // ACCEPT
  // =====================
  if (
    interaction.customId ===
    "accept_qotd"
  ) {

    const inputChannel =
      await client.channels.fetch(
        INPUT_CHANNEL_ID
      );

    await inputChannel.send(
      content
    );

    newEmbed.setFooter({
      text:
        "Status: Accepted ✅"
    });

    await interaction.update({
      embeds: [newEmbed],
      components: []
    });

    return;
  }

  // =====================
  // DECLINE
  // =====================
  if (
    interaction.customId ===
    "decline_qotd"
  ) {

    newEmbed.setFooter({
      text:
        "Status: Declined ❌"
    });

    await interaction.update({
      embeds: [newEmbed],
      components: []
    });

    return;
  }
}
    // =====================
    // CHAT COMMANDS
    // =====================
    if (
      !interaction.isChatInputCommand()
    ) return;

    // simple commands
    if (
      simpleCommands[
        interaction.commandName
      ]
    ) {

      const cmd =
        simpleCommands[
          interaction.commandName
        ];

      if (cmd.embed) {

        const embed =
          new EmbedBuilder()
            .setTitle(
              cmd.title || "Command"
            )
            .setDescription(
              cmd.message
            )
            .setColor(
              cmd.color || 0xffffff
            );

        return interaction.reply({
          embeds: [embed]
        });
      }

      return interaction.reply(
        cmd.message
      );
    }

    

    // suggestqotd
    if (
      interaction.commandName ===
      'suggestqotd'
    ) {

      const modal =
        new ModalBuilder()
          .setCustomId(
            'qotdModal'
          )
          .setTitle(
            'Suggest a QOTD'
          );

      const question =
        new TextInputBuilder()
          .setCustomId(
            'question'
          )
          .setLabel(
            'Question'
          )
          .setStyle(
            TextInputStyle.Paragraph
          );

      const answers =
        new TextInputBuilder()
          .setCustomId(
            'answers'
          )
          .setLabel(
            'Answers (one per line: emoji | text)'
          )
          .setPlaceholder(
`🍕 | Pizza
🍔 | Burger
🌮 | Taco`
          )
          .setStyle(
            TextInputStyle.Paragraph
          );

      modal.addComponents(

        new ActionRowBuilder()
          .addComponents(
            question
          ),

        new ActionRowBuilder()
          .addComponents(
            answers
          )
      );

      return interaction.showModal(
        modal
      );
    }

    // =====================
// MINESWEEPER
// =====================
if (interaction.commandName === "ms") {

  const game =
    minesweeperGames.get(
      interaction.channel.id
    );

  if (!game) {

    return interaction.reply({
      content:
        "No active Minesweeper game found.",
      ephemeral: true
    });
  }

  const input =
    interaction.options
      .getString("cell")
      .toLowerCase();

  const letters = "abcdef";

  const y =
    letters.indexOf(input[0]);

  const x =
    parseInt(input.slice(1)) - 1;

  if (
    y < 0 ||
    x < 0 ||
    x >= game.size ||
    y >= game.size
  ) {

    return interaction.reply({
      content:
        "Invalid cell.",
      ephemeral: true
    });
  }

  const tile =
    game.board[y][x];

  // bomb
  if (tile.bomb) {

    tile.revealed = true;

    // reveal all bombs
    for (let yy = 0; yy < game.size; yy++) {

      for (let xx = 0; xx < game.size; xx++) {

        if (
          game.board[yy][xx].bomb
        ) {
          game.board[yy][xx]
            .revealed = true;
        }
      }
    }

    minesweeperGames.delete(
      interaction.channel.id
    );

    return interaction.reply({
      content:
`💥 BOOM!

${renderMinesweeper(game)}`
    });
  }

  // flood fill
  if (tile.number === 0) {

    floodFill(game, x, y);

  } else {

    tile.revealed = true;
  }

  return interaction.reply({
    content:
      renderMinesweeper(game)
  });
}
    // snake
    if (
      interaction.commandName ===
      'snake'
    ) {

      const game = {

        userId:
          interaction.user.id,

        snake: [
          {
            x: 4,
            y: 4
          }
        ],

        apple: {
          x: 2,
          y: 2
        },

        direction: "right",

        over: false
      };

      await interaction.reply({
        content:
`# Snake

Score: 0

${renderSnake(game)}`,
        components:
          snakeButtons()
      });

      const msg =
        await interaction.fetchReply();

      snakeGames.set(
        msg.id,
        game
      );
    }

    // qotdqueue
    if (
      interaction.commandName ===
      'qotdqueue'
    ) {

      return interaction.reply({
        content:
          "qotd queue system currently down",
        ephemeral: true
      });
    }

    // forceqotd
    if (
      interaction.commandName ===
      'forceqotd'
    ) {

      if (
        interaction.user.id !==
        OWNER_ID
      ) {

        return interaction.reply({
          content:
            "No permission.",
          ephemeral: true
        });
      }

      const number =
        interaction.options.getInteger(
          'number'
        );

      const inputChannel =
        await client.channels.fetch(
          INPUT_CHANNEL_ID
        );

      const messages =
        await inputChannel.messages.fetch({
          limit: 100
        });

      const sorted =
        [...messages.values()]
          .sort((a, b) =>
            a.createdTimestamp -
            b.createdTimestamp
          );

      if (
        number < 1 ||
        number > sorted.length
      ) {

        return interaction.reply({
          content:
            `Invalid queue number. There are ${sorted.length} QOTDs queued.`,
          ephemeral: true
        });
      }

      const targetMessage =
        sorted[number - 1];

      await postQOTD(
        targetMessage.content
      );

      await targetMessage.delete()
        .catch(() => {});

      return interaction.reply({
        content:
          `Forced QOTD #${number} to send.`,
        ephemeral: true
      });
    }

    // sendqotd
    // =====================
// QOTD COMMANDS ABOVE (UNCHANGED)
// =====================

// sendqotd
if (interaction.commandName === 'sendqotd') {

  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({
      content: "No permission.",
      ephemeral: true
    });
  }

  await interaction.reply("Sending QOTD...");
  await sendQOTD();
}


// =====================
// MINESWEEPER
// =====================

if (interaction.commandName === "minesweeper") {

  const game = createMinesweeper(6);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ms_reveal")
      .setLabel("Reveal Cell")
      .setStyle(ButtonStyle.Primary)
  );

  const msg = await interaction.reply({
    content:
`# Minesweeper

Click the button to reveal a cell

${renderMinesweeper(game)}`,
    components: [row],
    fetchReply: true
  });

      minesweeperGames.set(interaction.channel.id, game);
    }

  }); // 👈 closes: client.on("interactionCreate", async (interaction) => {

//}  the silly bracket, yes he has a name
//});

// =====================
// LOGIN
// =====================
client.login(TOKEN);
