const test = require("node:test");
const assert = require("node:assert");

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

test("End-to-End Pipeline: Complete integrity journey from student exam to examiner decision", async () => {
  // 1. Fetch available exams
  const examsRes = await fetch(`${BASE_URL}/api/exams`);
  assert.strictEqual(examsRes.status, 200);
  const { exams } = await examsRes.json();
  assert.ok(exams && exams.length > 0, "Exams must be returned");
  const targetExam = exams[0];

  // 2. Fetch questions for student and verify correct_answer is NOT exposed
  const examDetailRes = await fetch(`${BASE_URL}/api/exams/${targetExam.id}`);
  assert.strictEqual(examDetailRes.status, 200);
  const { exam: studentExam } = await examDetailRes.json();
  assert.ok(studentExam.questions.length > 0, "Exam must have questions");
  for (const q of studentExam.questions) {
    assert.strictEqual(q.correct_answer, undefined, "Security: correct_answer must never leak to student");
  }

  // 3. Start candidate attempt as authenticated student Alex Mercer
  const studentCookie = "aegis_demo_user_id=d0000000-0000-0000-0000-000000000003";
  const examinerCookie = "aegis_demo_user_id=d0000000-0000-0000-0000-000000000001";

  const startRes = await fetch(`${BASE_URL}/api/attempts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({ exam_id: targetExam.id }),
  });
  assert.strictEqual(startRes.status, 200);
  const { attempt } = await startRes.json();
  assert.ok(attempt.id, "Attempt ID must be created");
  assert.strictEqual(attempt.status, "IN_PROGRESS");

  // 4. Autosave an answer with debounced persistence
  const targetQuestion = studentExam.questions[0];
  const saveAnswerRes = await fetch(`${BASE_URL}/api/attempts/${attempt.id}/answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      question_id: targetQuestion.id,
      answer_value: "Test Candidate Answer",
      time_spent_delta: 25,
    }),
  });
  assert.strictEqual(saveAnswerRes.status, 200);
  const { answer: savedAns } = await saveAnswerRes.json();
  assert.strictEqual(savedAns.answer_value, "Test Candidate Answer");

  // 5. Ingest Security Telemetry Event (e.g. TAB_SWITCH departure)
  const eventRes = await fetch(`${BASE_URL}/api/attempts/${attempt.id}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      event_type: "TAB_SWITCH",
      severity: "HIGH",
      source: "BROWSER",
      duration_ms: 3200,
      metadata: { tab_departed: true, target: "external" },
      confidence: 1.0,
    }),
  });
  assert.strictEqual(eventRes.status, 200);
  const eventData = await eventRes.json();
  assert.ok(eventData.success);
  assert.ok(eventData.event.curr_hash, "Cryptographic tamper hash must be calculated");
  assert.ok(typeof eventData.risk_score === "number");

  // 6. Ingest Correlating Suspicious Sequence (Focus Departure + Face Missing)
  await fetch(`${BASE_URL}/api/attempts/${attempt.id}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      event_type: "FACE_MISSING",
      severity: "MEDIUM",
      source: "COMPUTER_VISION",
      duration_ms: 2500,
      metadata: { detection_confidence: 0.94 },
      confidence: 0.95,
    }),
  });

  // 7. Mutate Answer to trigger correlated episode
  await fetch(`${BASE_URL}/api/attempts/${attempt.id}/answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      question_id: targetQuestion.id,
      answer_value: "Mutated Value After Departure",
      time_spent_delta: 10,
    }),
  });

  // 8. Fetch Attempt Details and verify pipeline outputs
  const detailsRes = await fetch(`${BASE_URL}/api/attempts/${attempt.id}`, {
    headers: { Cookie: examinerCookie },
  });
  assert.strictEqual(detailsRes.status, 200);
  const details = await detailsRes.json();

  assert.ok(details.events.length >= 2, "Security events must be recorded");
  assert.strictEqual(details.chainIntegrity.valid, true, "Tamper-evident chain must be valid");
  assert.ok(details.riskAssessment, "Risk assessment must be computed");
  assert.ok(details.riskAssessment.risk_score >= 0, "Aegis Risk Index must be computed");
  assert.ok(details.questionMatrix.length > 0, "Question Behavior Matrix must be generated");

  // 9. Run AI Investigation (as Examiner)
  const investRes = await fetch(`${BASE_URL}/api/attempts/${attempt.id}/investigation`, {
    method: "POST",
    headers: { Cookie: examinerCookie },
  });
  assert.strictEqual(investRes.status, 200);
  const { investigation } = await investRes.json();
  assert.ok(investigation, "AI investigation must be returned");
  assert.ok(
    investigation.investigation_status === "COMPLETED" ||
    investigation.investigation_status === "UNAVAILABLE" ||
    investigation.investigation_status === "FAILED",
    "Investigation status must be valid"
  );
  assert.ok(investigation.key_findings.length > 0, "Key findings must be articulated");

  // 10. Human Examiner Reviews & Records Final Decision with Rationale
  const decisionRes = await fetch(`${BASE_URL}/api/attempts/${attempt.id}/decision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: examinerCookie,
    },
    body: JSON.stringify({
      decision: "NEEDS_MORE_REVIEW",
      rationale: "Candidate departed exam window for 3.2 seconds concurrently with facial absence. Recommend proctor interview.",
    }),
  });
  assert.strictEqual(decisionRes.status, 200);
  const decisionData = await decisionRes.json();
  assert.strictEqual(decisionData.decision.decision, "NEEDS_MORE_REVIEW");

  // 11. Student Submits Attempt
  const submitRes = await fetch(`${BASE_URL}/api/attempts/${attempt.id}/submit`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert.strictEqual(submitRes.status, 200);
  const submitData = await submitRes.json();
  assert.strictEqual(submitData.attempt.status, "SUBMITTED");
  assert.ok(typeof submitData.score === "number", "Score must be computed server-side");
});
