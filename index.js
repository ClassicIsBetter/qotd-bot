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
`/suggestqotd
Suggest a QOTD

/qotdqueue
View your queued QOTDs + statuses

/sendqotd
Force send a QOTD (owner only)

/help
Shows this command list

/ping
Check if the bot is alive`,

    description: "list all commands"
  }
};

// =====================
// STATE
// =====================
let qotdNumber = 21;

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
    .setDescription('Force send QOTD')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('qotdqueue')
    .setDescription('View your queued QOTDs')
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
// HELPERS
// =====================
function extractEmoji(line) {
  if (!line) return null;
  return line.split("|")[0]?.trim();
}

// =====================
// SEND QOTD
// =====================
async function sendQOTD() {
  try {

    const inputChannel =
      await client.channels.fetch(INPUT_CHANNEL_ID);

    const outputChannel =
      await client.channels.fetch(OUTPUT_CHANNEL_ID);

    const messages =
      await inputChannel.messages.fetch({ limit: 100 });

    const sorted = [...messages.values()]
      .sort((a, b) =>
        a.createdTimestamp - b.createdTimestamp
      );

    let content;
    let messageToDelete = null;

    if (sorted.length > 0) {
      const oldest = sorted[0];
      content = oldest.content;
      messageToDelete = oldest;
    } else {
      content =
        presetQOTDs[
          Math.floor(Math.random() * presetQOTDs.length)
        ];
    }

    const lines = content
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const embed = new EmbedBuilder()
      .setTitle(`QOTD #${qotdNumber}`)
      .setDescription(content)
      .setColor(0xffcc00);

    const sent = await outputChannel.send({
      content: `<@&${QOTD_ROLE_ID}>`,
      embeds: [embed]
    });

    // LOG
    console.log(`📢 Sent QOTD #${qotdNumber}`);

    // =====================
    // MULTI-EMOJI SUPPORT
    // =====================
    const emojiLines = lines.slice(1);

    const emojis = emojiLines
      .map(extractEmoji)
      .filter(Boolean);

    for (const emoji of emojis) {
      await sent.react(emoji).catch(() => {});
    }

    await sent.startThread({
      name: `QOTD #${qotdNumber} discussion`,
      autoArchiveDuration: 1440
    }).catch(() => {});

    if (messageToDelete) {
      await messageToDelete.delete().catch(() => {});
    }

    qotdNumber++;

  } catch (err) {
    console.error("QOTD error:", err);
  }
}

// =====================
// SCHEDULE
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
  // SIMPLE COMMANDS
  // =====================
  if (simpleCommands[interaction.commandName]) {

    const cmd = simpleCommands[interaction.commandName];

    if (cmd.embed) {
      const embed = new EmbedBuilder()
        .setTitle(cmd.title || "Command")
        .setDescription(cmd.message)
        .setColor(cmd.color || 0xffffff);

      return interaction.reply({ embeds: [embed] });
    }

    return interaction.reply(cmd.message);
  }

  // =====================
  // SUGGEST QOTD (MODAL)
  // =====================
  if (interaction.commandName === 'suggestqotd') {

    const modal = new ModalBuilder()
      .setCustomId('qotdModal')
      .setTitle('Suggest a QOTD');

    const question = new TextInputBuilder()
      .setCustomId('question')
      .setLabel('Question')
      .setStyle(TextInputStyle.Paragraph);

    const options = new TextInputBuilder()
      .setCustomId('options')
      .setLabel('Options (emoji | text per line)')
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(
      new ActionRowBuilder().addComponents(question),
      new ActionRowBuilder().addComponents(options)
    );

    return interaction.showModal(modal);
  }

  // =====================
  // MODAL SUBMIT
  // =====================
  if (interaction.isModalSubmit()) {

    if (interaction.customId === 'qotdModal') {

      const question =
        interaction.fields.getTextInputValue('question');

      const optionsRaw =
        interaction.fields.getTextInputValue('options');

      const reviewChannel =
        await client.channels.fetch(REVIEW_CHANNEL_ID);

      const qotdContent =
`"${question}" suggested by <@${interaction.user.id}>
${optionsRaw}`;

      const embed = new EmbedBuilder()
        .setTitle("New QOTD Suggestion")
        .setDescription(qotdContent)
        .setColor(0xffff00)
        .setFooter({ text: "Status: Pending" });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("accept_qotd")
          .setLabel("Accept")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("decline_qotd")
          .setLabel("Decline")
          .setStyle(ButtonStyle.Danger)
      );

      const msg = await reviewChannel.send({
        embeds: [embed],
        components: [buttons]
      });

      await msg.startThread({
        name: `QOTD review`,
        autoArchiveDuration: 1440
      }).catch(() => {});

      return interaction.reply({
        content: "Submitted for review.",
        ephemeral: true
      });
    }
  }

  // =====================
  // BUTTONS
  // =====================
  if (interaction.isButton()) {

    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: "No permission.",
        ephemeral: true
      });
    }

    const embed = interaction.message.embeds[0];
    if (!embed) return;

    const content = embed.description;
    const newEmbed = EmbedBuilder.from(embed);

    if (interaction.customId === "accept_qotd") {

      const inputChannel =
        await client.channels.fetch(INPUT_CHANNEL_ID);

      const sent = await inputChannel.send(content);

      await sent.startThread({
        name: "QOTD review",
        autoArchiveDuration: 1440
      }).catch(() => {});

      newEmbed.setFooter({ text: "Status: Accepted ✅" });

      return interaction.update({
        embeds: [newEmbed],
        components: []
      });
    }

    if (interaction.customId === "decline_qotd") {

      newEmbed.setFooter({ text: "Status: Declined ❌" });

      return interaction.update({
        embeds: [newEmbed],
        components: []
      });
    }
  }

  // =====================
  // SEND QOTD (OWNER)
  // =====================
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
  // QOTD QUEUE (simple fallback)
  // =====================
  if (interaction.commandName === 'qotdqueue') {
    return interaction.reply({
      content: "Queue system unchanged (still working on your review system flow).",
      ephemeral: true
    });
  }
});

client.login(TOKEN);
