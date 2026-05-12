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

const INPUT_CHANNEL_ID = process.env.INPUT_CHANNEL_ID;
const OUTPUT_CHANNEL_ID = process.env.OUTPUT_CHANNEL_ID;

// =====================
// OWNER
// =====================
const OWNER_ID = "YOUR_DISCORD_USER_ID";

// =====================
// STATE
// =====================
let qotdNumber = 19;

console.log("Bot starting...");

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// =====================
// SIMPLE COMMANDS
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
// FETCH OLDEST MESSAGE
// =====================
async function getOldestMessage(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });

  return [...messages.values()]
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)[0];
}

// =====================
// EXTRACT EMOJIS
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
    if (!oldest) return;

    const lines = oldest.content
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const reaction1 = extractEmoji(lines.at(-2));
    const reaction2 = extractEmoji(lines.at(-1));

    const wasPinged = oldest.content.includes("<@");

    const embed = new EmbedBuilder()
      .setTitle(`QOTD #${qotdNumber}`)
      .setDescription(
        oldest.content +
        (wasPinged ? "\n📣 ping included in suggestion" : "")
      )
      .setColor(0xffcc00);

    const sent = await outputChannel.send({ embeds: [embed] });

    if (reaction1) await sent.react(reaction1).catch(() => {});
    if (reaction2) await sent.react(reaction2).catch(() => {});

    await sent.startThread({
      name: `QOTD #${qotdNumber} discussion`,
      autoArchiveDuration: 1440
    }).catch(() => {});

    await oldest.delete().catch(() => {});

    qotdNumber++;

  } catch (err) {
    console.error("QOTD error:", err);
  }
}

// =====================
// SCHEDULE (ACST 4:30)
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

      const inputChannel = await client.channels.fetch(INPUT_CHANNEL_ID);

      const sentMessage = await inputChannel.send(
`"${question}" suggested by <@${interaction.user.id}>
${emoji1} | ${text1}
${emoji2} | ${text2}`
      );

      // =====================
      // QUEUE POSITION
      // =====================
      const messages = await inputChannel.messages.fetch({ limit: 100 });

      const sorted = [...messages.values()]
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      const position =
        sorted.findIndex(m => m.id === sentMessage.id) + 1;

      const total = sorted.length;

      // =====================
      // TIME CALC (ACST SAFE)
      // =====================
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
It is ${position}/${total} in the queue.`,
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

    const inputChannel = await client.channels.fetch(INPUT_CHANNEL_ID);
    const messages = await inputChannel.messages.fetch({ limit: 100 });

    const sorted = [...messages.values()]
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    if (sorted.length === 0) {
      return interaction.reply({
        content: "Queue is empty.",
        ephemeral: true
      });
    }

    const lines = sorted.map((m, i) =>
      `${i + 1}. ${m.content.split("\n")[0]}`
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
