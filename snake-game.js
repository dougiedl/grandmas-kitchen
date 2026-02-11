import {
  DIRECTIONS,
  createInitialState,
  restart,
  setDirection,
  step,
  togglePause
} from "./snake-logic.js";

const TICK_MS = 120;

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");

let state = createInitialState();

function drawBoard() {
  const { gridSize, snake, food } = state;
  const occupied = new Set(snake.map((part) => `${part.x},${part.y}`));
  const head = snake[0];

  boardEl.style.setProperty("--grid-size", String(gridSize));
  boardEl.replaceChildren();

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (food && food.x === x && food.y === y) {
        cell.classList.add("food");
      } else if (head.x === x && head.y === y) {
        cell.classList.add("snake", "head");
      } else if (occupied.has(`${x},${y}`)) {
        cell.classList.add("snake");
      }

      boardEl.appendChild(cell);
    }
  }
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  if (state.gameOver) {
    statusEl.textContent = "Game over";
  } else if (state.paused) {
    statusEl.textContent = "Paused";
  } else {
    statusEl.textContent = "Running";
  }
  pauseBtn.textContent = state.paused ? "Resume" : "Pause";
}

function render() {
  drawBoard();
  updateHud();
}

function applyDirectionFromKey(key) {
  const normalized = key.toLowerCase();
  const map = {
    arrowup: DIRECTIONS.UP,
    w: DIRECTIONS.UP,
    arrowdown: DIRECTIONS.DOWN,
    s: DIRECTIONS.DOWN,
    arrowleft: DIRECTIONS.LEFT,
    a: DIRECTIONS.LEFT,
    arrowright: DIRECTIONS.RIGHT,
    d: DIRECTIONS.RIGHT
  };

  const direction = map[normalized];
  if (direction) {
    state = setDirection(state, direction);
    render();
  }
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    state = togglePause(state);
    render();
    return;
  }

  if (event.key.toLowerCase() === "r") {
    state = restart(state);
    render();
    return;
  }

  applyDirectionFromKey(event.key);
});

pauseBtn.addEventListener("click", () => {
  state = togglePause(state);
  render();
});

restartBtn.addEventListener("click", () => {
  state = restart(state);
  render();
});

setInterval(() => {
  state = step(state);
  render();
}, TICK_MS);

render();
