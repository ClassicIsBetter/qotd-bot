const fs = require("fs");
const path = require("path");

const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes
} = require("discord.js");

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// =====================
// COMMAND COLLECTION
// =====================
client.commands =
  new Collection();

// =====================
// LOAD COMMANDS
// =====================
const commandsPath =
  path.join(
    __dirname,
    "commands"
  );

const commandFiles =
  fs.readdirSync(commandsPath)
    .filter(file =>
      file.endsWith(".js")
    );

const commands = [];

for (const file of commandFiles) {

  const filePath =
    path.join(
      commandsPath,
      file
    );

  const command =
    require(filePath);

  client.commands.set(
    command.data.name,
    command
  );

  commands.push(
    command.data.toJSON()
  );

  console.log(
    `Loaded command: ${command.data.name}`
  );
}

// =====================
// REGISTER COMMANDS
// =====================
const rest =
  new REST({
    version: "10"
  }).setToken(
    process.env.TOKEN
  );

(async () => {

  try {

    console.log(
      "Refreshing slash commands..."
    );

    // wipe OLD GLOBAL commands
    await rest.put(
      Routes.applicationCommands(
        process.env.CLIENT_ID
      ),
      {
        body: []
      }
    );

    console.log(
      "Old global commands removed."
    );

    // register NEW guild commands
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: commands
      }
    );

    console.log(
      "Guild commands registered."
    );

  } catch (err) {

    console.error(err);
  }
})();

// =====================
// INTERACTIONS
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
client.once(
  "clientReady",
  () => {

    console.log(
      `Logged in as ${client.user.tag}`
    );

    client.user.setPresence({
      activities: [
        {
          name:
            "very cool test, wow",
          type: 4
        }
      ],
      status: "online"
    });
  }
);

// =====================
// LOGIN
// =====================
client.login(
  process.env.TOKEN
);
