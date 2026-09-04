const test = require("node:test");
const assert = require("node:assert");

// Test Risk Engine Logic
function calculateRisk(events, episodes, questionDifficulty = "MEDIUM") {
  let rawRisk = 0;

  for (const ep of episodes) {
    let weight = ep.risk_contribution || 15;
    if (questionDifficulty === "HARD") {
      weight = Math.max(5, weight - 8); // Difficulty mitigation
    }
    rawRisk += weight;
  }

  const tabSwitches = events.filter((e) => e.event_type === "TAB_SWITCH").length;
  if (tabSwitches > 0 && episodes.length === 0) {
    rawRisk += Math.min(25, tabSwitches * 8);
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawRisk)));

  let band = "LOW";
  if (finalScore >= 80) band = "CRITICAL";
  else if (finalScore >= 60) band = "HIGH";
  else if (finalScore >= 30) band = "MODERATE";

  return { risk_score: finalScore, risk_band: band };
}

test("Risk Engine evaluates normal candidate as LOW risk", () => {
  const events = [];
  const episodes = [];
  const result = calculateRisk(events, episodes);

  assert.strictEqual(result.risk_score, 0);
  assert.strictEqual(result.risk_band, "LOW");
});

test("Risk Engine aggregates episodes and identifies HIGH risk", () => {
  const events = [
    { event_type: "WINDOW_BLUR" },
    { event_type: "TAB_SWITCH" },
    { event_type: "ANSWER_CHANGED" },
  ];
  const episodes = [
    {
      episode_type: "Focus Departure Followed by Immediate Answer Modification",
      risk_contribution: 35,
    },
    {
      episode_type: "MediaPipe Face Occlusion Burst",
      risk_contribution: 30,
    },
  ];

  const result = calculateRisk(events, episodes, "MEDIUM");
  assert.strictEqual(result.risk_score, 65);
  assert.strictEqual(result.risk_band, "HIGH");
});

test("Risk Engine discounts hesitation on HARD questions", () => {
  const episodes = [{ risk_contribution: 30 }];
  const normalResult = calculateRisk([], episodes, "MEDIUM");
  const hardResult = calculateRisk([], episodes, "HARD");

  assert.strictEqual(normalResult.risk_score, 30);
  assert.strictEqual(hardResult.risk_score, 22); // Discounted by 8 points
});
