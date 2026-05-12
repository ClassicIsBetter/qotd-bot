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
  ActionRowBuilder
} = require('discord.js');

// =====================
// ENV VARIABLES
// =====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const INPUT_CHANNEL_ID = process.env.INPUT_CHANNEL_ID;
const OUTPUT_CHANNEL_ID = process.env.OUTPUT_CHANNEL_ID;

// =====================
// OWNER
// =====================
const OWNER_ID = "1285513478315966506";

// =====================
// SIMPLE COMMANDS
// =====================
const simpleCommands = {
  ping: {
    message: "Pong!",
    description: "Replies with pong"
  },

  cat: {
    message: "🐈 meow",
    description: "very important cat command"
  },

  silly: {
    message: "silly sword fighting moment",
    description: "silly command"
  },

  rules: {
    message: `1. Be nice
2. No spam
3. no eating drywall`,
    description: "Shows the server rules"
  }
};

// =====================
// STATE
// =====================
let qotdNumber = 19;

console.log("Bot starting...");

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ],
});

// =====================
// COMMANDS
// =====================
const commands = [
  // simple commands
  ...Object.keys(simpleCommands).map(cmd =>
    new SlashCommandBuilder()
      .setName(cmd)
      .setDescription(simpleCommands[cmd].description)
      .toJSON()
  ),

  // send qotd
  new SlashCommandBuilder()
    .setName('sendqotd')
    .setDescription('Manually send QOTD')
    .toJSON(),

  // suggest qotd
  new SlashCommandBuilder()
    .setName('suggestqotd')
    .setDescription('Suggest a QOTD')
    .toJSON()
];

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
// FETCH OLDEST MESSAGE
// =====================
async function getOldestMessage(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });

  return messages
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .first();
}

// =====================
// SAFE EMOJI PARSER
// =====================
function extractEmoji(line) {
  if (!line) return null;

  return line.split("|")[0].trim();
}

// =====================
// SEND QOTD
// =====================
async function sendQOTD() {
  try {
    const inputChannel = await client.channels.fetch(INPUT_CHANNEL_ID);
    const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);

    const oldest = await getOldestMessage(inputChannel);

    if (!oldest) {
      console.log("No QOTDs found.");
      return;
    }

    const lines = oldest.content
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    // reactions from last 2 lines
    const reaction1 = extractEmoji(lines.at(-2));
    const reaction2 = extractEmoji(lines.at(-1));

    // FULL message INCLUDING emoji lines
    const fullMessage = lines.join("\n");

    const embed = new EmbedBuilder()
      .setTitle(`QOTD #${qotdNumber}`)
      .setDescription(fullMessage)
      .setColor(0xffcc00);

    const sent = await outputChannel.send({
      embeds: [embed]
    });

    // reactions
    if (reaction1) {
      await sent.react(reaction1).catch(() => {});
    }

    if (reaction2) {
      await sent.react(reaction2).catch(() => {});
    }

    // thread
    await sent.startThread({
      name: `QOTD #${qotdNumber} discussion`,
      autoArchiveDuration: 1440
    }).catch(err => {
      console.log("Thread failed:", err.message);
    });

    // delete used message
    await oldest.delete().catch(() => {});

    console.log(`Sent QOTD #${qotdNumber}`);

    qotdNumber++;

  } catch (err) {
    console.error("QOTD error:", err);
  }
}

// =====================
// SCHEDULE SYSTEM
// =====================
function scheduleQOTD(hour, minute) {
  setInterval(() => {
    const now = new Date();

    // Adelaide timezone
    const adelaideTime = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Australia/Adelaide"
      })
    );

    if (
      adelaideTime.getHours() === hour &&
      adelaideTime.getMinutes() === minute
    ) {
      sendQOTD();
    }

  }, 60 * 1000);
}

// =====================
// READY
// =====================
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // 4:30 PM ACST
  scheduleQOTD(16, 30);
});

// =====================
// COMMAND HANDLER
// =====================
client.on('interactionCreate', async (interaction) => {

  // =====================
  // MODAL SUBMIT
  // =====================
  if (interaction.isModalSubmit()) {

    if (interaction.customId === 'qotdModal') {

      const question =
        interaction.fields.getTextInputValue('question');

      const emoji1 =
        interaction.fields.getTextInputValue('emoji1');

      const text1 =
        interaction.fields.getTextInputValue('text1');

      const emoji2 =
        interaction.fields.getTextInputValue('emoji2');

      const text2 =
        interaction.fields.getTextInputValue('text2');

      const inputChannel =
        await client.channels.fetch(INPUT_CHANNEL_ID);

      await inputChannel.send(
`"${question}" suggested by <@${interaction.user.id}>
${emoji1} | ${text1}
${emoji2} | ${text2}`
      );

      await interaction.reply({
        content: "QOTD suggested!",
        ephemeral: true
      });
    }

    return;
  }

  // =====================
  // SLASH COMMANDS
  // =====================
  if (!interaction.isChatInputCommand()) return;

  // simple commands
  if (simpleCommands[interaction.commandName]) {
    return interaction.reply(
      simpleCommands[interaction.commandName].message
    );
  }

  // suggest qotd
  if (interaction.commandName === 'suggestqotd') {

    const modal = new ModalBuilder()
      .setCustomId('qotdModal')
      .setTitle('Suggest a QOTD');

    const questionInput = new TextInputBuilder()
      .setCustomId('question')
      .setLabel('QOTD Question')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const emoji1Input = new TextInputBuilder()
      .setCustomId('emoji1')
      .setLabel('Emoji 1')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const text1Input = new TextInputBuilder()
      .setCustomId('text1')
      .setLabel('Text for Emoji 1')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const emoji2Input = new TextInputBuilder()
      .setCustomId('emoji2')
      .setLabel('Emoji 2')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const text2Input = new TextInputBuilder()
      .setCustomId('text2')
      .setLabel('Text for Emoji 2')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(questionInput),
      new ActionRowBuilder().addComponents(emoji1Input),
      new ActionRowBuilder().addComponents(text1Input),
      new ActionRowBuilder().addComponents(emoji2Input),
      new ActionRowBuilder().addComponents(text2Input)
    );

    await interaction.showModal(modal);
  }

  // owner-only qotd command
  if (interaction.commandName === 'sendqotd') {

    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: "You can't use this command.",
        ephemeral: true
      });
    }

    await interaction.reply("Sending QOTD...");
    await sendQOTD();
  }
});

// =====================
// LOGIN
// =====================
client.login(TOKEN);
