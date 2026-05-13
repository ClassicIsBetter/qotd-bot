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
Force send a specific queue number

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
let qotdNumber = 19;

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

  // =====================
  // REACTIONS
  // =====================
  for (const reaction of reactions) {

    await sent.react(reaction)
      .catch(() => {});
  }

  // =====================
  // THREAD
  // =====================
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

    // =====================
    // REAL SUBMISSION
    // =====================
    if (sorted.length > 0) {

      const oldest =
        sorted[0];

      await postQOTD(
        oldest.content
      );

      await oldest.delete()
        .catch(() => {});

    } else {

      // =====================
      // PRESET
      // =====================
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

        // =====================
        // REVIEW THREAD
        // =====================
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

    // =====================
    // SIMPLE COMMANDS
    // =====================
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

    // =====================
    // SUGGESTQOTD
    // =====================
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
    // QOTDQUEUE
    // =====================
    if (
      interaction.commandName ===
      'qotdqueue'
    ) {

      const reviewChannel =
        await client.channels.fetch(
          REVIEW_CHANNEL_ID
        );

      const inputChannel =
        await client.channels.fetch(
          INPUT_CHANNEL_ID
        );

      const reviewMessages =
        await reviewChannel.messages.fetch({
          limit: 100
        });

      const queueMessages =
        await inputChannel.messages.fetch({
          limit: 100
        });

      const sortedQueue =
        [...queueMessages.values()]
          .sort((a, b) =>
            a.createdTimestamp -
            b.createdTimestamp
          );

      const yourMessages =
        [...reviewMessages.values()]
          .filter(m =>
            m.embeds.length > 0 &&
            m.embeds[0]
              .description
              ?.includes(
                `<@${interaction.user.id}>`
              )
          );

      if (
        yourMessages.length === 0
      ) {

        return interaction.reply({
          content:
            "You have no QOTDs.",
          ephemeral: true
        });
      }

      const ADELAIDE_OFFSET =
        9.5 *
        60 *
        60 *
        1000;

      const now = new Date();

      const adelaideNow =
        new Date(
          now.getTime() +
          ADELAIDE_OFFSET
        );

      let base =
        new Date(adelaideNow);

      base.setHours(
        16,
        30,
        0,
        0
      );

      if (adelaideNow > base) {

        base.setDate(
          base.getDate() + 1
        );
      }

      const lines =
        yourMessages.map(q => {

          const embed =
            q.embeds[0];

          const footer =
            embed.footer?.text ||
            "Status: Pending";

          const title =
            embed.description
              .split("\n")[0];

          // =====================
          // ACCEPTED
          // =====================
          if (
            footer.includes(
              "Accepted"
            )
          ) {

            const queueIndex =
              sortedQueue.findIndex(m =>
                m.content ===
                embed.description
              );

            if (
              queueIndex !== -1
            ) {

              const date =
                new Date(base);

              date.setDate(
                date.getDate() +
                queueIndex
              );

              const unix =
                Math.floor(
                  (
                    date.getTime() -
                    ADELAIDE_OFFSET
                  ) / 1000
                );

              return `${title}
${footer}
Will send <t:${unix}:R>
Queue Position: #${queueIndex + 1}`;
            }
          }

          return `${title}
${footer}`;
        });

      return interaction.reply({
        content:
          lines.join("\n\n"),
        ephemeral: true
      });
    }

    // =====================
    // FORCEQOTD
    // =====================
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

      // =====================
      // INVALID NUMBER
      // =====================
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

      // =====================
      // DELETE FROM QUEUE
      // =====================
      await targetMessage.delete()
        .catch(() => {});

      return interaction.reply({
        content:
          `Forced QOTD #${number} to send.`,
        ephemeral: true
      });
    }

    // =====================
    // SENDQOTD
    // =====================
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

// =====================
// LOGIN
// =====================
client.login(TOKEN);
