export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

export const DEFAULT_GRID_SIZE = 20;

function samePoint(a, b) {
  return a.x === b.x && a.y === b.y;
}

export function isOppositeDirection(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

export function createInitialSnake(gridSize = DEFAULT_GRID_SIZE) {
  const mid = Math.floor(gridSize / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid }
  ];
}

export function spawnFood(snake, gridSize, rng = Math.random) {
  const occupied = new Set(snake.map((part) => `${part.x},${part.y}`));
  const empty = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        empty.push({ x, y });
      }
    }
  }

  if (empty.length === 0) {
    return null;
  }

  const index = Math.floor(rng() * empty.length);
  return empty[index];
}

export function createInitialState(options = {}) {
  const gridSize = options.gridSize ?? DEFAULT_GRID_SIZE;
  const snake = createInitialSnake(gridSize);
  const direction = DIRECTIONS.RIGHT;
  const food = spawnFood(snake, gridSize, options.rng);

  return {
    gridSize,
    snake,
    direction,
    score: 0,
    food,
    gameOver: false,
    paused: false
  };
}

export function setDirection(state, direction) {
  if (state.gameOver || state.paused) {
    return state;
  }
  if (isOppositeDirection(state.direction, direction)) {
    return state;
  }
  return {
    ...state,
    direction
  };
}

export function step(state, rng = Math.random) {
  if (state.gameOver || state.paused) {
    return state;
  }

  const head = state.snake[0];
  const nextHead = {
    x: head.x + state.direction.x,
    y: head.y + state.direction.y
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize;

  if (hitWall) {
    return {
      ...state,
      gameOver: true
    };
  }

  const ateFood = state.food && samePoint(nextHead, state.food);
  const bodyToCheck = ateFood ? state.snake : state.snake.slice(0, -1);
  const hitSelf = bodyToCheck.some((part) => samePoint(part, nextHead));

  if (hitSelf) {
    return {
      ...state,
      gameOver: true
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!ateFood) {
    nextSnake.pop();
  }

  const nextFood = ateFood ? spawnFood(nextSnake, state.gridSize, rng) : state.food;
  const won = ateFood && nextFood === null;

  return {
    ...state,
    snake: nextSnake,
    food: nextFood,
    score: ateFood ? state.score + 1 : state.score,
    gameOver: won
  };
}

export function restart(state, options = {}) {
  return createInitialState({
    gridSize: options.gridSize ?? state.gridSize,
    rng: options.rng
  });
}

export function togglePause(state) {
  if (state.gameOver) {
    return state;
  }
  return {
    ...state,
    paused: !state.paused
  };
}
