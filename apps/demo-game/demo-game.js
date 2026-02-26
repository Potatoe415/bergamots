import { qs, on } from "../../shared/js/dom.js";

const scoreEl = qs("#demo-score-value");
const messageEl = qs("#demo-message");
const playButton = qs("#demo-play-button");
const resetButton = qs("#demo-reset-button");

let score = 0;

function updateScore(nextScore) {
  score = nextScore;
  if (scoreEl) {
    scoreEl.textContent = String(score);
  }

  if (messageEl) {
    if (score === 0) {
      messageEl.textContent =
        "Tip: Try this from npm run dev and after a npm run build to confirm everything is wired.";
    } else if (score < 10) {
      messageEl.textContent = "Nice, keep going!";
    } else {
      messageEl.textContent = "You got to double digits 🎉";
    }
  }
}

if (playButton) {
  on(playButton, "click", () => {
    updateScore(score + 1);
  });
}

if (resetButton) {
  on(resetButton, "click", () => {
    updateScore(0);
  });
}

