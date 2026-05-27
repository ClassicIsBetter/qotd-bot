const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// load commands
client.commands = new Map();

for (const file of fs.readdirSync("./commands")) {
  const cmd = require(`./commands/${file}`);
  client.commands.set(cmd.data.name, cmd);
}

// interaction handler
const handler = require("./handlers/interactionHandler");

client.on("interactionCreate", async (interaction) => {

  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (cmd) return cmd.execute(interaction);
  }

  await handler(interaction);
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
