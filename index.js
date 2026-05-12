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
// ENV
// =====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const OUTPUT_CHANNEL_ID = process.env.OUTPUT_CHANNEL_ID;

// =====================
// OWNER
// =====================
const OWNER_ID = "1285513478315966506";

// =====================
// STATE
// =====================
let qotdNumber = 19;
let qotdQueue = [];

console.log("Bot starting...");

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// =====================
// COMMANDS
// =====================
const simpleCommands = {
  ping: { message: "Pong!", description: "Replies with pong" },
  cat: { message: "🐈 meow", description: "cat command" },
  silly: { message: "silly sword fighting moment", description: "silly command" },
  rules: {
    message: `1. Be nice
2. No spam
3. no eating drywall`,
    description: "rules"
  }
};

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
    .setDescription('Force send QOTD (owner only)')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('qotdqueue')
    .setDescription('View QOTD queue')
    .toJSON()
];

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
// SEND QOTD
// =====================
async function sendQOTD() {
  try {
    const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);

    if (qotdQueue.length === 0) return;

    const qotd = qotdQueue.shift();

    const embed = new EmbedBuilder()
      .setTitle(`QOTD #${qotdNumber}`)
      .setDescription(
`${qotd.question} suggested by <@${qotd.userId}>
${qotd.emoji1} | ${qotd.text1}
${qotd.emoji2} | ${qotd.text2}`
      )
      .setColor(0xffcc00);

    const sent = await outputChannel.send({ embeds: [embed] });

    await sent.react(qotd.emoji1).catch(() => {});
    await sent.react(qotd.emoji2).catch(() => {});

    await sent.startThread({
      name: `QOTD #${qotdNumber} discussion`,
      autoArchiveDuration: 1440
    }).catch(() => {});

    qotdNumber++;

  } catch (err) {
    console.error("QOTD error:", err);
  }
}

// =====================
// SCHEDULE (4:30 PM ACST)
// =====================
function scheduleQOTD(hour, minute) {
  setInterval(() => {
    const now = new Date();

    const adelaide = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Australia/Adelaide"
      })
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
  console.log(`Logged in as ${client.user.tag}`);
  scheduleQOTD(16, 30);
});

// =====================
// INTERACTIONS
// =====================
client.on('interactionCreate', async (interaction) => {

  // =====================
  // MODAL SUBMIT
  // =====================
  if (interaction.isModalSubmit()) {

    if (interaction.customId === 'qotdModal') {

      const question = interaction.fields.getTextInputValue('question');
      const emoji1 = interaction.fields.getTextInputValue('emoji1');
      const text1 = interaction.fields.getTextInputValue('text1');
      const emoji2 = interaction.fields.getTextInputValue('emoji2');
      const text2 = interaction.fields.getTextInputValue('text2');

      qotdQueue.push({
        question,
        emoji1,
        text1,
        emoji2,
        text2,
        userId: interaction.user.id
      });

      const position = qotdQueue.length;

      const ADELAIDE_OFFSET = 9.5 * 60 * 60 * 1000;

      const now = new Date();
      const adelaideNow = new Date(now.getTime() + ADELAIDE_OFFSET);

      let sendDate = new Date(adelaideNow);
      sendDate.setHours(16, 30, 0, 0);

      if (adelaideNow > sendDate) {
        sendDate.setDate(sendDate.getDate() + 1);
      }

      sendDate.setDate(sendDate.getDate() + (position - 1));

      const unix = Math.floor(
        (sendDate.getTime() - ADELAIDE_OFFSET) / 1000
      );

      return interaction.reply({
        content:
`QOTD suggested!

Your QOTD will be sent <t:${unix}:R>
It is ${position}/${qotdQueue.length} in the queue.`,
        ephemeral: true
      });
    }

    return;
  }

  // =====================
  // SLASH COMMANDS
  // =====================
  if (!interaction.isChatInputCommand()) return;

  if (simpleCommands[interaction.commandName]) {
    return interaction.reply(simpleCommands[interaction.commandName].message);
  }

  // suggest modal
  if (interaction.commandName === 'suggestqotd') {

    const modal = new ModalBuilder()
      .setCustomId('qotdModal')
      .setTitle('Suggest a QOTD');

    const question = new TextInputBuilder()
      .setCustomId('question')
      .setLabel('Question')
      .setStyle(TextInputStyle.Paragraph);

    const emoji1 = new TextInputBuilder()
      .setCustomId('emoji1')
      .setLabel('Emoji 1')
      .setStyle(TextInputStyle.Short);

    const text1 = new TextInputBuilder()
      .setCustomId('text1')
      .setLabel('Text 1')
      .setStyle(TextInputStyle.Short);

    const emoji2 = new TextInputBuilder()
      .setCustomId('emoji2')
      .setLabel('Emoji 2')
      .setStyle(TextInputStyle.Short);

    const text2 = new TextInputBuilder()
      .setCustomId('text2')
      .setLabel('Text 2')
      .setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(question),
      new ActionRowBuilder().addComponents(emoji1),
      new ActionRowBuilder().addComponents(text1),
      new ActionRowBuilder().addComponents(emoji2),
      new ActionRowBuilder().addComponents(text2)
    );

    return interaction.showModal(modal);
  }

  // queue viewer
  if (interaction.commandName === 'qotdqueue') {

    if (qotdQueue.length === 0) {
      return interaction.reply({
        content: "Queue is empty.",
        ephemeral: true
      });
    }

    const lines = qotdQueue.map((q, i) =>
      `${i + 1}. ${q.question}`
    );

    return interaction.reply({
      content: lines.join("\n"),
      ephemeral: true
    });
  }

  // owner send
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
});

// =====================
// LOGIN
// =====================
client.login(TOKEN);
