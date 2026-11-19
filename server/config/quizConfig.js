'use strict';

/**
 * Course Quiz Configuration
 * ────────────────────────────────────────────────────────────────────────────
 * Centralised constants so the frontend reads them from the API rather than
 * hardcoding values across components.
 */

module.exports = {
  QUIZ_QUESTIONS_PER_ATTEMPT: 20,     // exactly 20 questions per attempt
  QUIZ_MAX_SCORE:             20,     // 1 mark per question
  QUIZ_PASSING_THRESHOLD:     0.70,  // 70%
  QUIZ_MIN_PASSING_SCORE:     14,    // ceil(20 * 0.70) = 14
  QUIZ_ATTEMPT_EXPIRY_MINUTES: 30,   // in-progress attempts expire after 30 min
  QUIZ_OPTIONS_PER_QUESTION:   4,    // 4 options per question
};
