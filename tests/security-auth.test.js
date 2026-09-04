const test = require("node:test");
const assert = require("node:assert");

test("Security: Question Answer Key never leaked to students", () => {
  const rawQuestion = {
    id: "q-1",
    question_text: "What is the consensus algorithm in Bitcoin?",
    question_type: "MULTIPLE_CHOICE",
    options: [
      { id: "a", text: "Proof of Work" },
      { id: "b", text: "Proof of Stake" },
    ],
    correct_answer: "Proof of Work",
    explanation: "Satoshi Nakamoto designed Nakamoto consensus utilizing Proof of Work.",
    points: 10,
    difficulty: "EASY",
  };

  function sanitizeQuestionForRole(q, role) {
    if (role === "STUDENT") {
      const { correct_answer, explanation, ...sanitized } = q;
      return sanitized;
    }
    return q;
  }

  const studentView = sanitizeQuestionForRole(rawQuestion, "STUDENT");
  assert.strictEqual(studentView.correct_answer, undefined);
  assert.strictEqual(studentView.explanation, undefined);
  assert.strictEqual(studentView.question_text, "What is the consensus algorithm in Bitcoin?");

  const examinerView = sanitizeQuestionForRole(rawQuestion, "EXAMINER");
  assert.strictEqual(examinerView.correct_answer, "Proof of Work");
  assert.strictEqual(examinerView.explanation, "Satoshi Nakamoto designed Nakamoto consensus utilizing Proof of Work.");
});

test("Server-Authoritative Timer: Rejects answers and marks expired when time exceeds exam duration", () => {
  const exam = {
    id: "e-1",
    duration_minutes: 30,
  };

  const activeAttempt = {
    id: "att-active",
    started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins elapsed
    status: "IN_PROGRESS",
  };

  const expiredAttempt = {
    id: "att-expired",
    started_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 mins elapsed (> 30 min duration + 1 min grace)
    status: "IN_PROGRESS",
  };

  function validateTimer(attempt, examDurationMinutes) {
    const elapsedMinutes = (Date.now() - new Date(attempt.started_at).getTime()) / (60 * 1000);
    if (elapsedMinutes > examDurationMinutes + 1) {
      return { allowed: false, status: "EXPIRED" };
    }
    return { allowed: true, status: attempt.status };
  }

  const activeCheck = validateTimer(activeAttempt, exam.duration_minutes);
  assert.strictEqual(activeCheck.allowed, true);
  assert.strictEqual(activeCheck.status, "IN_PROGRESS");

  const expiredCheck = validateTimer(expiredAttempt, exam.duration_minutes);
  assert.strictEqual(expiredCheck.allowed, false);
  assert.strictEqual(expiredCheck.status, "EXPIRED");
});

test("Risk Terminology: Evidence Confidence scales with multi-signal corroboration", () => {
  function evaluateConfidence(sources, episodesCount) {
    const distinct = new Set(sources).size;
    if (distinct >= 3 && episodesCount >= 1) return "HIGH";
    if (distinct >= 2 || episodesCount >= 1) return "MODERATE";
    return "LOW";
  }

  assert.strictEqual(evaluateConfidence(["BROWSER"], 0), "LOW");
  assert.strictEqual(evaluateConfidence(["BROWSER", "COMPUTER_VISION"], 0), "MODERATE");
  assert.strictEqual(evaluateConfidence(["BROWSER", "COMPUTER_VISION", "BEHAVIORAL_METRIC"], 1), "HIGH");
});
