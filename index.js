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

const eightBallResponses = [

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
  "I don't think so."
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
**-----QOTD-----**
/suggestqotd
Suggest a QOTD

/qotdqueue
View your queued QOTDs + statuses(currently down)

/sendqotd
Force send oldest QOTD(owner only)

/forceqotd
Force send a specific queued QOTD(owner only)

**-----Games/Fun-----**
/snake
Play snake

/askai
ask ChatGPT 3.5 Turbo anything(has proper chat memory, resets after 20 messages)

**-----Other-----**
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
let qotdNumber = 29;
const axios = require("axios");
const fs = require("fs");

// =====================
// SNAKE GAMES
// =====================
const snakeGames = new Map();
const aiConversations = new Map();
const mineGames = new Map();

console.log("Bot starting...");

const MINE_EMOJIS = {

  grass: "<:Mine_grass:1507344590057902187>",
  dirt: "<:Mine_dirt:1507344656781021285>",
  stone: "<:Mine_stone:1507345387579772989>",
  air: "<:Mine_air:1507344935836455093>",
  player: "🐈"
};

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

//status
client.once('ready', () => {
    client.user.setPresence({
        activities: [
            {
                name: 'very cool test, wow',
                type: 4
            }
        ],
        status: 'online'
    });
});

console.log("tried to set status");



function createMineWorld() {

  const world = [];

  for (let y = 0; y < 6; y++) {

    let row = [];

    for (let x = 0; x < 6; x++) {

      // top grass
      if (y === 4)
        row.push("grass");

      // dirt
      else if (y > 4 && y < 8)
        row.push("dirt");

      // stone
      else if (y >= 8)
        row.push("stone");

      // sky
      else
        row.push("air");
    }

    world.push(row);
  }

  return world;
}

function renderMine(game) {

  let output = "";

  for (let y = 0; y < 6; y++) {

    let row = "";

    for (let x = 0; x < 6; x++) {

      // player
      if (
        x === game.x &&
        y === game.y
      ) {

        row += MINE_EMOJIS.player;
      }

      else {

        const block =
          game.world[y][x];

        row +=
          MINE_EMOJIS[block];
      }
    }

    output += row + "\n";
  }

  return output;
}

function rgbToEmoji(r, g, b) {

  // black
  if (r < 35 && g < 35 && b < 35)
    return "⬛";

  // white
  if (r > 220 && g > 220 && b > 220)
    return "⬜";

  // gray
  if (
    Math.abs(r - g) < 15 &&
    Math.abs(g - b) < 15
  ) {

    if (r > 170)
      return "⬜";

    if (r > 80)
      return "⬜";

    return "⬛";
  }

  // RED
  if (
    r > g + 40 &&
    r > b + 40
  ) {

    // orange
    if (
      g > 100 &&
      b < 80
    ) {
      return "🟧";
    }

    // pink
    if (
      b > 120
    ) {
      return "🟪";
    }

    return "🟥";
  }

  // GREEN
  if (
    g > r + 30 &&
    g > b + 30
  ) {

    return "🟩";
  }

  // BLUE
  if (
    b > r + 30 &&
    b > g + 30
  ) {

    // cyan
    if (g > 120)
      return "🟦";

    return "🟦";
  }

  // yellow
  if (
    r > 170 &&
    g > 170 &&
    b < 120
  ) {

    return "🟨";
  }

  // purple
  if (
    r > 120 &&
    b > 120 &&
    g < 100
  ) {

    return "🟪";
  }

  // ACTUAL brown
  if (
    r > 90 &&
    r < 170 &&
    g > 40 &&
    g < 110 &&
    b < 70
  ) {

    return "🟫";
  }

  // fallback:
  // choose MOST dominant colour
  if (r >= g && r >= b)
    return "🟥";

  if (g >= r && g >= b)
    return "🟩";

  return "🟦";
}


// =====================
// DATABASE
// =====================

let database = {};

if (fs.existsSync("./database.json")) {
  database = JSON.parse(
    fs.readFileSync("./database.json", "utf8")
  );
}

function saveDatabase() {
  fs.writeFileSync(
    "./database.json",
    JSON.stringify(database, null, 2)
  );
}

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
  .setName('work')
  .setDescription('Work for coins')
  .toJSON(),

  new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Shows info about the server')
  .toJSON(),

  new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Shows user info')
  .toJSON(),


  new SlashCommandBuilder()
  .setName('minecraft')
  .setDescription('Start a minecraft world')
  .toJSON(),

new SlashCommandBuilder()
  .setName('minemove')
  .setDescription('Move in minecraft')
  .addStringOption(option =>
    option
      .setName('direction')
      .setDescription('Direction')
      .setRequired(true)
      .addChoices(
        { name: 'Up', value: 'up' },
        { name: 'Down', value: 'down' },
        { name: 'Left', value: 'left' },
        { name: 'Right', value: 'right' }
      )
  )
  .toJSON(),

  new SlashCommandBuilder()
  .setName('img8x8')
  .setDescription('Convert an image into an 8x8 emoji grid')
  .addStringOption(option =>
    option
      .setName('url')
      .setDescription('Image URL')
      .setRequired(true)
  )
  .toJSON(),


  new SlashCommandBuilder()
  .setName('betterbot')
  .setDescription('Compare The Silly Bot and MangoBot')
  .toJSON(),

  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Set bot status')
    .addStringOption(option =>
     option
      .setName('text')
      .setDescription('Status text')
      .setRequired(true)
  )
  .toJSON(),
  
  new SlashCommandBuilder()
  .setName('askai')
  .setDescription('Ask the AI something')
  .addStringOption(option =>
    option
      .setName('question')
      .setDescription('What to ask')
      .setRequired(true)
  )
  .toJSON(),

  new SlashCommandBuilder()
  .setName('8ball')
  .setDescription('Ask the 8ball something')
  .addStringOption(option =>
    option
      .setName('question')
      .setDescription('Your question')
      .setRequired(true)
  )
  .toJSON(),

    new SlashCommandBuilder()
  .setName('dice')
  .setDescription('Roll a dice')
  .addIntegerOption(option =>
    option
      .setName('max')
      .setDescription('Maximum number')
      .setRequired(true)
  )
  .toJSON(),
      
];

// =====================
// REGISTER COMMANDS
// =====================
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {

  try {

    console.log("Registering commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        CLIENT_ID,
        GUILD_ID
      ),
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

        game.apple = newApple;
        valid = true;
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

        new ButtonBuilder()
          .setCustomId("snake_up")
          .setLabel("⬆️")
          .setStyle(
            ButtonStyle.Primary
          )
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


    const axios = require("axios");
    const sharp = require("sharp");

    // =====================
    // MODAL SUBMIT
    // =====================
    if (interaction.isModalSubmit()) {

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

        // dice
if (
  interaction.commandName ===
  'dice'
) {

  const max =
    interaction.options.getInteger(
      'max'
    );

  // stop weird numbers
  if (max < 1) {

    return interaction.reply({
      content:
        "Max number must be at least 1.",
      ephemeral: true
    });
  }

  const roll =
    Math.floor(
      Math.random() * max
    ) + 1;

  return interaction.reply({
    embeds: [

      new EmbedBuilder()
        .setTitle("Roll Dice")
        .addFields(
          {
            name: "Max Number",
            value: max.toString(),
            inline: true
          },
          {
            name: "You Rolled",
            value: roll.toString(),
            inline: true
          }
        )
        .setColor(0xffffff)
    ]
  });
}


if (interaction.commandName === "img8x8") {

  await interaction.deferReply();

  const url = interaction.options.getString("url");

  try {

    const res = await axios.get(url, {
      responseType: "arraybuffer"
    });

    const image = await sharp(res.data)
      .resize(8, 8, { fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const data = image.data;
    const info = image.info;

    let output = "";

    for (let y = 0; y < 8; y++) {

      let row = "";

      for (let x = 0; x < 8; x++) {

        const i = (y * 8 + x) * info.channels;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        row += rgbToEmoji(r, g, b);
      }

      output += row + "\n";
    }

    return interaction.editReply(
      "```\n" + output + "\n```"
    );

  } catch (err) {

    console.error(err);

    return interaction.editReply(
      "❌ Unable to process image."
    );
  }
}

    // minecraft
if (
  interaction.commandName ===
  'minecraft'
) {

  const game = {

    x: 5,
    y: 2,

    world:
      createMineWorld()
  };

  mineGames.set(
    interaction.user.id,
    game
  );

  return interaction.reply({
    content:
`# Minecraft

${renderMine(game)}`
  });
}

// minemove
if (
  interaction.commandName ===
  'minemove'
) {

  const direction =
    interaction.options.getString(
      'direction'
    );

  const game =
    mineGames.get(
      interaction.user.id
    );

  if (!game) {

    return interaction.reply({
      content:
        "Start a world first with /minecraft",
      ephemeral: true
    });
  }

  let newX = game.x;
  let newY = game.y;

  if (direction === "up")
    newY--;

  if (direction === "down")
    newY++;

  if (direction === "left")
    newX--;

  if (direction === "right")
    newX++;

  // bounds
  if (
    newX >= 0 &&
    newX < 10 &&
    newY >= 0 &&
    newY < 10
  ) {

    game.x = newX;
    game.y = newY;
  }

  return interaction.reply({
    content:
`# Minecraft

${renderMine(game)}`
  });
}


    // work
if (
  interaction.commandName ===
  'work'
) {

  const userId =
    interaction.user.id;

  // create user if missing
  if (!database[userId]) {

    database[userId] = {
      coins: 0
    };
  }

  // random coins
  const earned =
    Math.floor(
      Math.random() * 51
    ) + 10;

  database[userId].coins += earned;

  saveDatabase();

  return interaction.reply({
    content:
`💰 You worked and earned ${earned} coins!

You now have ${database[userId].coins} coins.`
  });
}
        // 8ball
if (
  interaction.commandName ===
  '8ball'
) {

  const question =
    interaction.options.getString(
      'question'
    );

  const response =
    eightBallResponses[
      Math.floor(
        Math.random() *
        eightBallResponses.length
      )
    ];

  return interaction.reply({
    embeds: [

      new EmbedBuilder()
        .setTitle("8Ball Response")
        .addFields(
          {
            name: "Question",
            value: question
          },
          {
            name: "Answer",
            value: response
          }
        )
        .setColor(0x000000)
    ]
  });
}

    // userinfo
if (
  interaction.commandName ===
  'userinfo'
) {

  const member =
    interaction.member;

  const user =
    interaction.user;

  const joinedServer =
    `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`;

  const createdAccount =
    `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;

  const embed =
    new EmbedBuilder()
      .setTitle(
        `${user.username}'s Info`
      )
      .setThumbnail(
        user.displayAvatarURL()
      )
      .setColor(0x5865F2)
      .addFields(

        {
          name: "Username",
          value: user.tag,
          inline: true
        },

        {
          name: "User ID",
          value: user.id,
          inline: true
        },


        {
          name: "Account Created",
          value: createdAccount,
          inline: false
        },

        {
          name: "Joined Server",
          value: joinedServer,
          inline: false
        }
      );

  return interaction.reply({
    embeds: [embed]
  });
}
    // serverinfo
if (
  interaction.commandName ===
  'serverinfo'
) {

  const guild = interaction.guild;

  const embed = new EmbedBuilder()
    .setTitle(guild.name)
    .setThumbnail(
      guild.iconURL({ dynamic: true })
    )
    .setColor(0x5865F2)

    .addFields(

      {
        name: 'Owner',
        value: `<@${guild.ownerId}>`,
        inline: true
      },

      {
        name: 'Members',
        value: `${guild.memberCount}`,
        inline: true
      },

      {
        name: 'Created',
        value:
          `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
        inline: true
      },

      {
        name: 'Server ID',
        value: guild.id,
        inline: false
      },

      {
        name: 'Boost Level',
        value:
          `Level ${guild.premiumTier}`,
        inline: true
      },

      {
        name: 'Boosts',
        value:
          `${guild.premiumSubscriptionCount}`,
        inline: true
      }
    );

  await interaction.reply({
    embeds: [embed]
  });
}


    // betterbot
if (
  interaction.commandName ===
  'betterbot'
) {

  const embed =
    new EmbedBuilder()
      .setTitle(
        "Whats the better bot"
      )
      .setColor(0x00b0f4)

      .addFields(

        {
          name: "**MangoBot**",
          value:
`
• mango
• owner thinks that i am copying MangoBot
• cool
• is better set up and is actually public compared to The Silly Bot
`,
          inline: true
        },

        {
          name: "The Silly Bot",
          value:
`
• 1 game
• qotd system
• /askai command that actually works
• silly
• made by me
`,
          inline: true
        }
      )

      .setFooter({
        text:
          "unbiased comparison"
      });

  return interaction.reply({
    embeds: [embed]
  });
}
    
    // status
    if (
      interaction.commandName ===
      'status'
    ) {

      // owner check
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

      const text =
        interaction.options.getString(
          'text'
        );

      client.user.setPresence({
        activities: [
          {
            name: text,
            type: 4
          }
        ],
        status: 'online'
      });

      return interaction.reply({
        content:
          `Status changed to: ${text}`,
        ephemeral: true
      });
    }
   // askai
if (
  interaction.commandName ===
  'askai'
) {

  const question =
    interaction.options.getString(
      'question'
    );

  await interaction.deferReply();

  try {

    // get old convo
    let history =
      aiConversations.get(
        interaction.user.id
      ) || [];

    // add user message
    history.push({
      role: "user",
      content: question
    });

    // warn + reset after 20 messages
    let warning = "";

    if (history.length >= 20) {

      warning =
        "\n\n⚠️ Memory full, conversation was reset after this message.";

      // keep current message only
      history = [
        {
          role: "user",
          content: question
        }
      ];
    }

    const response =
      await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model:
            "openai/gpt-3.5-turbo",

          messages: history
        },
        {
          headers: {
            Authorization:
              `Bearer ${process.env.OPENROUTER_KEY}`,

            "Content-Type":
              "application/json"
          }
        }
      );

    const reply =
      response.data
        .choices[0]
        .message.content;

    // save ai response too
    history.push({
      role: "assistant",
      content: reply
    });

    // save convo
    aiConversations.set(
      interaction.user.id,
      history
    );

    await interaction.editReply(
      reply + warning
    );

  } catch (err) {

    console.error(err);

    await interaction.editReply(
      "AI exploded 😭"
    );
  }
}
    
    // sendqotd
    if (
      interaction.commandName ===
      'sendqotd'
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

      await interaction.reply(
        "Sending QOTD..."
      );

      await sendQOTD();
    }
  }
);
// ) <- the evil bracket, has caused 1 crime
// test comment
// =====================
// LOGIN
// =====================
client.login(TOKEN);
