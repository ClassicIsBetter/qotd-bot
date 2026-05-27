const config = require("../config.json");
const { games } = require("./state");

function move(game) {
  const head = { ...game.snake[0] };

  if (game.direction === "up") head.y--;
  if (game.direction === "down") head.y++;
  if (game.direction === "left") head.x--;
  if (game.direction === "right") head.x++;

  // death (IMPORTANT FIX)
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x > 7 ||
    head.y > 7 ||
    game.snake.some(s => s.x === head.x && s.y === head.y)
  ) {
    game.over = true;
    return;
  }

  game.snake.unshift(head);

  // apple FIX (always respawns correctly)
  if (head.x === game.apple.x && head.y === game.apple.y) {
    spawnApple(game);
  } else {
    game.snake.pop();
  }
}

function spawnApple(game) {
  let ok = false;

  while (!ok) {
    const apple = {
      x: Math.floor(Math.random() * 8),
      y: Math.floor(Math.random() * 8)
    };

    if (!game.snake.some(s => s.x === apple.x && s.y === apple.y)) {
      game.apple = apple;
      ok = true;
    }
  }
}

function createGame(userId) {
  return {
    userId,
    snake: [{ x: 4, y: 4 }],
    apple: { x: 2, y: 2 },
    direction: "right",
    over: false,
    lastMove: Date.now()
  };
}

module.exports = {
  move,
  createGame,
  spawnApple
};
