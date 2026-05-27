const config = require("../config.json");

function render(game) {
  let out = "";

  for (let y = 0; y < 8; y++) {
    let row = "";

    for (let x = 0; x < 8; x++) {

      if (game.snake[0].x === x && game.snake[0].y === y) {
        row += config.snake.emoji.head[game.direction];
        continue;
      }

      if (game.apple.x === x && game.apple.y === y) {
        row += config.snake.emoji.apple;
        continue;
      }

      if (game.snake.some(s => s.x === x && s.y === y)) {
        row += config.snake.emoji.body;
        continue;
      }

      row += config.snake.emoji.empty;
    }

    out += row + "\n";
  }

  return out;
}

module.exports = { render };
