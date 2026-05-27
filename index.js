const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Collection
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
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

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
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [
      {
        name: "clean modular bot",
        type: 4
      }
    ],
    status: "online"
  });
});

// =====================
// INTERACTIONS
// =====================
client.on('interactionCreate', async (interaction) => {

  // =====================
  // SLASH COMMANDS
  // =====================
  if (interaction.isChatInputCommand()) {

    const command = client.commands.get(interaction.commandName);

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
  // BUTTONS (SNAKE SYSTEM)
  // =====================
  if (interaction.isButton()) {

    if (!interaction.customId.startsWith("snake_")) return;

    const snakeCommand = client.commands.get("snake");
    if (!snakeCommand) return;

    const game = snakeCommand.games?.get(interaction.message.id);

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

    const dir = interaction.customId.replace("snake_", "");

    snakeCommand.move(game, dir);

    if (game.x === game.apple.x && game.y === game.apple.y) {
      game.score++;
    }

    await interaction.update({
      content:
`# Snake
Score: ${game.score}

${snakeCommand.render(game)}`,
      components: snakeCommand.buttons?.() || []
    });
  }
});

// =====================
// LOGIN
// =====================
client.login(TOKEN);
