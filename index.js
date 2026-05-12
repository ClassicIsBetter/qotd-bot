const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

// 🔑 CONFIG
const TOKEN = "MTUwMzY5ODQ2MDIwMzk0NjA3Ng.GI2uIW.MERwa52Z-SAzPsuxmJe8a7D_TOGzCLhmoCp-4U";
const CLIENT_ID = "1503698460203946076";
const GUILD_ID = "1466331720730153052";

const INPUT_CHANNEL_ID = "1498970415979040859";
const OUTPUT_CHANNEL_ID = "1473922768834789515";

let qotdNumber = 19;

console.log("Bot starting...");

// --------------------
// CLIENT
// --------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ],
});

// --------------------
// COMMAND
// --------------------
const commands = [
  new SlashCommandBuilder()
    .setName('sendqotd')
    .setDescription('Send QOTD now')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

// register command
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

// --------------------
// READY
// --------------------
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // ⏰ DAILY SCHEDULE (8:00 PM)
  scheduleQOTD(20, 0);
});

// --------------------
// GET OLDEST MESSAGE
// --------------------
async function getOldestMessage(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });
  return messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp).first();
}

// --------------------
// QOTD FUNCTION
// --------------------
async function sendQOTD() {
  const inputChannel = await client.channels.fetch(INPUT_CHANNEL_ID);
  const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);

  const oldest = await getOldestMessage(inputChannel);
  if (!oldest) return console.log("No messages found");

  const lines = oldest.content
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const secondLastLine = lines.at(-2);
  const lastLine = lines.at(-1);

  function extractEmoji(line) {
    if (!line) return null;
    return line.split("|")[0].trim();
  }

  const reaction1 = extractEmoji(secondLastLine);
  const reaction2 = extractEmoji(lastLine);

  const fullMessage = lines.join("\n");

  const embed = new EmbedBuilder()
    .setTitle(`QOTD #${qotdNumber}`)
    .setDescription(fullMessage)
    .setColor(0xffcc00);

  const sent = await outputChannel.send({ embeds: [embed] });

  // reactions
  if (reaction1) await sent.react(reaction1);
  if (reaction2) await sent.react(reaction2);

  // thread
  await sent.startThread({
    name: `QOTD #${qotdNumber} discussion`,
    autoArchiveDuration: 1440
  });

  // delete used message
  await oldest.delete().catch(() => {});

  console.log(`Sent QOTD #${qotdNumber}`);

  qotdNumber++;
}

// --------------------
// SCHEDULE FUNCTION
// --------------------
function scheduleQOTD(hour, minute) {
  setInterval(() => {
    const now = new Date();

    if (now.getHours() === hour && now.getMinutes() === minute) {
      sendQOTD();
    }
  }, 60 * 1000);
}

// --------------------
// COMMAND HANDLER
// --------------------
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'sendqotd') {
    await interaction.reply("Sending QOTD...");
    await sendQOTD();
  }
});

// --------------------
// LOGIN
// --------------------
client.login(TOKEN);