const test = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");

function computeEventHash(prevHash, event) {
  const canonicalPayload = JSON.stringify({
    attempt_id: event.attempt_id,
    event_type: event.event_type,
    severity: event.severity,
    source: event.source,
    timestamp: event.timestamp,
  });
  return crypto.createHash("sha256").update(`${prevHash}:${canonicalPayload}`).digest("hex");
}

function verifyChain(events) {
  let expectedPrevHash = "0000000000000000000000000000000000000000000000000000000000000000";
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.prev_hash !== expectedPrevHash) {
      return { valid: false, brokenIndex: i };
    }
    const computed = computeEventHash(expectedPrevHash, ev);
    if (ev.curr_hash !== computed) {
      return { valid: false, brokenIndex: i };
    }
    expectedPrevHash = ev.curr_hash;
  }
  return { valid: true, brokenIndex: null };
}

test("Evidence Chain verifies authentic sequentially hashed events", () => {
  const genesisHash = "0000000000000000000000000000000000000000000000000000000000000000";

  const ev1 = {
    attempt_id: "att-1",
    event_type: "WINDOW_BLUR",
    severity: "MEDIUM",
    source: "BROWSER",
    timestamp: "2026-09-04T10:00:00.000Z",
    prev_hash: genesisHash,
  };
  ev1.curr_hash = computeEventHash(genesisHash, ev1);

  const ev2 = {
    attempt_id: "att-1",
    event_type: "TAB_SWITCH",
    severity: "HIGH",
    source: "BROWSER",
    timestamp: "2026-09-04T10:00:02.000Z",
    prev_hash: ev1.curr_hash,
  };
  ev2.curr_hash = computeEventHash(ev1.curr_hash, ev2);

  const verification = verifyChain([ev1, ev2]);
  assert.strictEqual(verification.valid, true);
  assert.strictEqual(verification.brokenIndex, null);
});

test("Evidence Chain detects tampered payloads", () => {
  const genesisHash = "0000000000000000000000000000000000000000000000000000000000000000";

  const ev1 = {
    attempt_id: "att-1",
    event_type: "WINDOW_BLUR",
    severity: "MEDIUM",
    source: "BROWSER",
    timestamp: "2026-09-04T10:00:00.000Z",
    prev_hash: genesisHash,
  };
  ev1.curr_hash = computeEventHash(genesisHash, ev1);

  // Tamper with ev1 payload retroactively
  ev1.event_type = "NORMAL_FOCUS";

  const verification = verifyChain([ev1]);
  assert.strictEqual(verification.valid, false);
  assert.strictEqual(verification.brokenIndex, 0);
});
