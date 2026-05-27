const config = require("../config.json");

function isOwner(interaction) {
  return interaction.user.id === config.ownerId;
}

module.exports = { isOwner };
