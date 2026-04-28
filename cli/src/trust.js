'use strict';

const fs = require('fs');
const path = require('path');
const { exists } = require('./utils');

/**
 * CopilotForge Trust Trajectory Tracking
 *
 * Tracks the human-agent trust relationship over time, inspired by
 * Claude Code paper Section 2.1: auto-approve rates increase from
 * ~20% at <50 sessions to >40% by 750 sessions.
 *
 * Trust is "co-constructed by the model, the user, and the product"
 * — designed for trust trajectories rather than fixed trust states.
 *
 * Signals tracked:
 *   - Session count
 *   - Override rate (how often user changes wizard defaults)
 *   - Rollback frequency (how often user reverts)
 *   - File edit rate (how often user modifies generated files)
 *   - Task success rate (Ralph Loop completion rate)
 *
 * Trust score: 0-100, computed from weighted signals.
 * Higher trust → fewer prompts, more auto-features, bolder suggestions.
 */

// ── Trust data path ─────────────────────────────────────────────────────

function getTrustPath(cwd = process.cwd()) {
  return path.join(cwd, 'forge-memory', 'trust.json');
}

// ── Default trust state ─────────────────────────────────────────────────

function defaultTrustState() {
  return {
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    sessionCount: 0,
    signals: {
      overrides: 0,        // times user changed wizard defaults
      rollbacks: 0,        // times user invoked rollback
      fileEdits: 0,        // times user modified generated files
      tasksCompleted: 0,    // tasks marked [x]
      tasksFailed: 0,       // tasks marked [!]
      extrasSelected: 0,    // extras chosen in Q6
      confirmations: 0,     // times user confirmed without changes
    },
    trustScore: 20,         // Starting score (low trust = more prompts)
    level: 'cautious',      // cautious | standard | trusted | autonomous
    history: [],            // Last 10 trust score snapshots
  };
}

// ── Read/write ──────────────────────────────────────────────────────────

function readTrust(cwd = process.cwd()) {
  const trustPath = getTrustPath(cwd);

  if (!exists(trustPath)) {
    return defaultTrustState();
  }

  try {
    const data = JSON.parse(fs.readFileSync(trustPath, 'utf8'));
    return { ...defaultTrustState(), ...data };
  } catch {
    return defaultTrustState();
  }
}

function writeTrust(state, cwd = process.cwd()) {
  const trustPath = getTrustPath(cwd);
  const dir = path.dirname(trustPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  state.updated = new Date().toISOString();
  fs.writeFileSync(trustPath, JSON.stringify(state, null, 2), 'utf8');
}

// ── Signal recording ────────────────────────────────────────────────────

/**
 * Record a trust signal event.
 * @param {string} signal - One of the signal keys
 * @param {number} [count=1] - How many to add
 * @param {string} [cwd]
 */
function recordSignal(signal, count = 1, cwd = process.cwd()) {
  const state = readTrust(cwd);

  if (signal in state.signals) {
    state.signals[signal] += count;
  }

  // Recalculate trust score
  state.trustScore = calculateScore(state);
  state.level = scoreToLevel(state.trustScore);

  // Snapshot history (keep last 10)
  state.history.push({
    date: new Date().toISOString().slice(0, 10),
    score: state.trustScore,
    signal,
  });
  if (state.history.length > 10) {
    state.history = state.history.slice(-10);
  }

  writeTrust(state, cwd);
  return state;
}

/**
 * Record a new session.
 * @param {string} [cwd]
 */
function recordSession(cwd = process.cwd()) {
  const state = readTrust(cwd);
  state.sessionCount++;
  state.trustScore = calculateScore(state);
  state.level = scoreToLevel(state.trustScore);
  writeTrust(state, cwd);
  return state;
}

// ── Score calculation ───────────────────────────────────────────────────

/**
 * Calculate trust score from signals.
 * Score range: 0-100.
 *
 * Formula weights:
 *   +2 per session (familiarity)
 *   +3 per confirmation without changes (reliability)
 *   +1 per completed task (competence)
 *   +1 per extras selected (engagement)
 *   -5 per rollback (mistakes)
 *   -2 per override (friction)
 *   -3 per failed task (unreliability)
 */
function calculateScore(state) {
  const s = state.signals;

  let score = 20; // base

  score += Math.min(state.sessionCount * 2, 30);       // cap at +30
  score += Math.min(s.confirmations * 3, 20);           // cap at +20
  score += Math.min(s.tasksCompleted * 1, 15);          // cap at +15
  score += Math.min(s.extrasSelected * 1, 10);          // cap at +10
  score -= s.rollbacks * 5;
  score -= s.overrides * 2;
  score -= s.tasksFailed * 3;

  // Clamp 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreToLevel(score) {
  if (score >= 80) return 'autonomous';
  if (score >= 60) return 'trusted';
  if (score >= 40) return 'standard';
  return 'cautious';
}

// ── Trust-based behavior ────────────────────────────────────────────────

/**
 * Get behavior recommendations based on current trust level.
 * @param {string} [cwd]
 * @returns {{ skipConfirmation: boolean, suggestExtras: boolean, autoCommit: boolean, verbosity: string }}
 */
function getTrustBehavior(cwd = process.cwd()) {
  const state = readTrust(cwd);

  switch (state.level) {
    case 'autonomous':
      return {
        skipConfirmation: true,
        suggestExtras: true,
        autoCommit: true,
        verbosity: 'minimal',
        level: state.level,
        score: state.trustScore,
      };
    case 'trusted':
      return {
        skipConfirmation: false,
        suggestExtras: true,
        autoCommit: false,
        verbosity: 'normal',
        level: state.level,
        score: state.trustScore,
      };
    case 'standard':
      return {
        skipConfirmation: false,
        suggestExtras: false,
        autoCommit: false,
        verbosity: 'normal',
        level: state.level,
        score: state.trustScore,
      };
    case 'cautious':
    default:
      return {
        skipConfirmation: false,
        suggestExtras: false,
        autoCommit: false,
        verbosity: 'verbose',
        level: state.level,
        score: state.trustScore,
      };
  }
}

module.exports = {
  getTrustPath,
  readTrust,
  writeTrust,
  recordSignal,
  recordSession,
  calculateScore,
  scoreToLevel,
  getTrustBehavior,
  defaultTrustState,
};
