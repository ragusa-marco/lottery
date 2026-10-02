const ticket = document.querySelector("#ticket");
const inputs = [...document.querySelectorAll(".digit-input")];
const revealBalls = [...document.querySelectorAll(".reveal-ball")];
const circleCountInput = document.querySelector("#circle-count");
const circleCountLabel = document.querySelector("#circle-count-label");
const submitButton = document.querySelector("#submit-button");
const resetButton = document.querySelector("#reset-button");
const statusText = document.querySelector("#status");
const detailText = document.querySelector("#detail");
const scoreLabel = document.querySelector("#score-label");
const meterFill = document.querySelector("#meter-fill");

let digitCount = Number(circleCountInput.value);
let secretDigits = makeSecret();
let revealTimers = [];
let isRevealing = false;

function makeSecret() {
  return Array.from({ length: digitCount }, () => String(Math.floor(Math.random() * 10)));
}

function cleanDigit(value) {
  const digit = value.replace(/\D/g, "").slice(-1);
  return /^[0-9]$/.test(digit) ? digit : "";
}

function getGuess() {
  return inputs.slice(0, digitCount).map((input) => input.value);
}

function setLocked(locked) {
  inputs.forEach((input) => {
    const isActive = inputs.indexOf(input) < digitCount;
    input.disabled = locked || !isActive;
    input.classList.toggle("locked", locked);
  });
  circleCountInput.disabled = locked;
  submitButton.disabled = locked;
}

function clearTimers() {
  revealTimers.forEach((timer) => clearTimeout(timer));
  revealTimers = [];
}

function resetGame() {
  clearTimers();
  secretDigits = makeSecret();
  isRevealing = false;
  ticket.reset();
  applyCircleCount();
  setLocked(false);
  inputs.forEach((input) => {
    input.value = "";
  });
  revealBalls.forEach((ball, index) => {
    ball.textContent = "?";
    ball.className = "reveal-ball";
    ball.classList.toggle("inactive", index >= digitCount);
  });
  scoreLabel.textContent = "--%";
  meterFill.style.width = "0%";
  statusText.textContent = `Enter one digit from 0 to 9 in each of the ${digitCount} active circles.`;
  detailText.textContent = "The reveal starts after you submit a full ticket.";
  inputs[0].focus();
}

function scoreGuess(guess) {
  const maxDistance = digitCount * 9;
  const totalDistance = guess.reduce((sum, digit, index) => {
    return sum + Math.abs(Number(digit) - Number(secretDigits[index]));
  }, 0);
  const exactMatches = guess.filter((digit, index) => digit === secretDigits[index]).length;
  const closeness = Math.max(0, Math.round((1 - totalDistance / maxDistance) * 100));

  return { closeness, exactMatches, totalDistance };
}

function applyCircleCount() {
  digitCount = Number(circleCountInput.value);
  circleCountLabel.textContent = digitCount;

  inputs.forEach((input, index) => {
    const isActive = index < digitCount;
    input.classList.toggle("inactive", !isActive);
    input.disabled = !isActive;
    if (!isActive) {
      input.value = "";
    }
  });

  revealBalls.forEach((ball, index) => {
    ball.classList.toggle("inactive", index >= digitCount);
  });

  document.querySelector("#number-grid").style.gridTemplateColumns = `repeat(${digitCount}, minmax(0, 74px))`;
  document.querySelector("#reveal-row").style.gridTemplateColumns = `repeat(${digitCount}, minmax(0, 58px))`;
}

function revealSequence(guess, result) {
  const hiddenDigits = secretDigits.slice(0, digitCount);
  isRevealing = true;
  setLocked(true);
  statusText.textContent = "Revealing the hidden number...";
  detailText.textContent = "Watch the ticket flip over one circle at a time.";

  hiddenDigits.forEach((digit, index) => {
    const timer = setTimeout(() => {
      const ball = revealBalls[index];
      const isMatch = guess[index] === digit;
      ball.textContent = digit;
      ball.classList.add("shown");
      ball.classList.toggle("miss", !isMatch);

      if (index === hiddenDigits.length - 1) {
        isRevealing = false;
        scoreLabel.textContent = `${result.closeness}%`;
        meterFill.style.width = `${result.closeness}%`;
        statusText.textContent = "Result locked.";
        detailText.textContent = `You matched ${result.exactMatches} of ${digitCount} positions and were ${result.closeness}% close to ${hiddenDigits.join("")}.`;
      }
    }, 520 * (index + 1));

    revealTimers.push(timer);
  });
}

inputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value = cleanDigit(input.value);
    if (input.value && inputs[index + 1] && index + 1 < digitCount) {
      inputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && inputs[index - 1]) {
      inputs[index - 1].focus();
    }
  });
});

function changeCircleCount() {
  clearTimers();
  isRevealing = false;
  applyCircleCount();
  secretDigits = makeSecret();
  revealBalls.forEach((ball, index) => {
    ball.textContent = "?";
    ball.className = "reveal-ball";
    ball.classList.toggle("inactive", index >= digitCount);
  });
  scoreLabel.textContent = "--%";
  meterFill.style.width = "0%";
  statusText.textContent = `Ticket set to ${digitCount} circle${digitCount === 1 ? "" : "s"}.`;
  detailText.textContent = "The hidden number will use the same number of circles.";
  inputs[0].focus();
}

circleCountInput.addEventListener("input", changeCircleCount);
circleCountInput.addEventListener("change", changeCircleCount);

ticket.addEventListener("submit", (event) => {
  event.preventDefault();

  if (isRevealing) {
    return;
  }

  const guess = getGuess();
  if (secretDigits.length !== digitCount) {
    secretDigits = makeSecret();
  }
  const emptyIndex = guess.findIndex((digit) => !digit);

  if (emptyIndex !== -1) {
    statusText.textContent = "Fill every active circle with a digit from 0 to 9.";
    inputs[emptyIndex].focus();
    return;
  }

  revealSequence(guess, scoreGuess(guess));
});

resetButton.addEventListener("click", resetGame);
resetGame();
