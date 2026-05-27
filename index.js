const fs = require('fs');
const path = require('path');

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require('discord.js');

const TOKEN = process.env.TOKEN;

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// =====================
// COMMAND HANDLER
// =====================
client.commands = new Collection();

// load commands
const commandsPath = path.join(__dirname, 'commands');

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(f => f.endsWith('.js'));

for (const file of commandFiles) {

  const filePath = path.join(commandsPath, file);

  const command = require(filePath);

  if (!command.data || !command.execute) continue;

  client.commands.set(command.data.name, command);

  console.log(`Loaded command: ${command.data.name}`);
}

// =====================
// READY
// =====================
client.once('ready', async () => {

  console.log(`Logged in as ${client.user.tag}`);

  // =====================
  // REGISTER SLASH COMMANDS
  // =====================
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {

    await rest.put(
      Routes.applicationCommands(client.user.id),
      {
        body: client.commands.map(cmd =>
          cmd.data.toJSON()
        )
      }
    );

    console.log('Slash commands registered.');

  } catch (err) {
    console.error(err);
  }

  // =====================
  // PRESENCE
  // =====================
  client.user.setPresence({
    activities: [
      {
        name: "epic",
        type: 4
      }
    ],
    status: "online"
  });

  // =====================
  // START SNAKE AUTO MOVE
  // =====================
  const snake = client.commands.get("snake");

  if (snake?.startAutoMove) {
    snake.startAutoMove(client);
  }

});

// =====================
// INTERACTIONS
// =====================
client.on('interactionCreate', async (interaction) => {

  // =====================
  // SLASH COMMANDS
  // =====================
  if (interaction.isChatInputCommand()) {

    const command = client.commands.get(
      interaction.commandName
    );

    if (!command) return;

    try {

      await command.execute(interaction, client);

    } catch (err) {

      console.error(err);

      if (interaction.replied || interaction.deferred) {

        await interaction.followUp({
          content: "❌ Error executing command",
          ephemeral: true
        });

      } else {

        await interaction.reply({
          content: "❌ Error executing command",
          ephemeral: true
        });

      }
    }
  }

  // =====================
  // BUTTONS (SNAKE)
  // =====================
  if (interaction.isButton()) {

    if (!interaction.customId.startsWith("snake_")) return;

    const snakeCommand = client.commands.get("snake");

    if (!snakeCommand) return;

    const game =
      snakeCommand.games?.get(interaction.message.id);

    if (!game) {

      return interaction.reply({
        content: "Game expired.",
        ephemeral: true
      });

    }

    if (interaction.user.id !== game.userId) {

      return interaction.reply({
        content: "This is not your game.",
        ephemeral: true
      });

    }

    const dir = interaction.customId.replace(
      "snake_",
      ""
    );

    snakeCommand.move(game, dir);

    if (game.over) {

      snakeCommand.games.delete(interaction.message.id);

      return interaction.update({
        content:
`💀 Game Over!
Score: ${game.score}`,
        components: []
      });

    }

    await interaction.update({
      content:
`# Snake
Score: ${game.score}

${snakeCommand.render(game)}`,
      components:
        snakeCommand.buttons?.() || []
    });

  }

});

// =====================
// LOGIN
// =====================
client.login(TOKEN);
