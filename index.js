const fs = require("fs");
const path = require("path");

const {
  Client,
  Collection,
  GatewayIntentBits
} = require("discord.js");

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
// COMMAND COLLECTION
// =====================
client.commands = new Collection();

// =====================
// LOAD COMMANDS
// =====================
const commandsPath =
  path.join(__dirname, "commands");

const commandFiles =
  fs.readdirSync(commandsPath)
    .filter(file =>
      file.endsWith(".js")
    );

for (const file of commandFiles) {

  const filePath =
    path.join(commandsPath, file);

  const command =
    require(filePath);

  client.commands.set(
    command.data.name,
    command
  );

  console.log(
    `Loaded command: ${command.data.name}`
  );
}

// =====================
// EVENTS
// =====================
client.on(
  "interactionCreate",
  async interaction => {

    if (
      !interaction.isChatInputCommand()
    ) return;

    const command =
      client.commands.get(
        interaction.commandName
      );

    if (!command) return;

    try {

      await command.execute(
        interaction,
        client
      );

    } catch (err) {

      console.error(err);

      if (
        interaction.replied ||
        interaction.deferred
      ) {

        await interaction.followUp({
          content:
            "❌ Command crashed.",
          ephemeral: true
        });

      } else {

        await interaction.reply({
          content:
            "❌ Command crashed.",
          ephemeral: true
        });
      }
    }
  }
);

// =====================
// READY
// =====================
client.once("ready", () => {

  console.log(
    `Logged in as ${client.user.tag}`
  );

  client.user.setPresence({
    activities: [
      {
        name: "very cool test, wow",
        type: 4
      }
    ],
    status: "online"
  });
});

// =====================
// LOGIN
// =====================
client.login(process.env.TOKEN);
