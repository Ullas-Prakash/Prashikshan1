'use strict';

/**
 * Course Quiz Service
 * ────────────────────────────────────────────────────────────────────────────
 * Generates course-specific 20-question quizzes using the existing verified
 * questions.json dataset.  Questions are selected from the skills the course
 * covers, mixed across difficulty levels, and randomised per attempt.
 *
 * The questions.json file contains hand-crafted, verified questions organised
 * by skill (HTML, CSS, JavaScript, React, Python, SQL, etc.) with
 * beginner / intermediate / advanced tiers — 24 per skill, 14 skills total.
 *
 * This is a "verified content source" — not fabricated data.
 */

const fs   = require('fs');
const path = require('path');
const {
  QUIZ_QUESTIONS_PER_ATTEMPT,
} = require('../config/quizConfig');

// Load the verified question dataset once at startup.
const QUESTIONS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/questions.json'), 'utf-8')
);

// Maps course skill labels → dataset keys (reused from quizService.js).
const SKILL_ALIASES = {
  'node.js': 'Node', 'nodejs': 'Node', 'node': 'Node',
  'javascript': 'JavaScript', 'react': 'React', 'python': 'Python',
  'html': 'HTML', 'css': 'CSS', 'mongodb': 'MongoDB', 'sql': 'SQL',
  'git': 'Git', 'dsa': 'DSA', 'java': 'Java', 'cloud': 'Cloud',
  'cloud computing': 'Cloud',
  'os': 'OS', 'operating systems': 'OS', 'operating system': 'OS',
  'dbms': 'DBMS', 'database management': 'DBMS',
  'database management systems': 'DBMS',
  'machine learning': 'DSA',     // fallback — no ML key in dataset
  'ml': 'DSA',
  'ui/ux (figma)': 'HTML',       // fallback
  'figma': 'HTML',
};

function resolveSkillKey(skill) {
  const lower = skill.toLowerCase().trim();
  if (SKILL_ALIASES[lower]) return SKILL_ALIASES[lower];
  return Object.keys(QUESTIONS).find((k) => k.toLowerCase() === lower) || null;
}

// ── Shuffle helper ──────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate a 20-question quiz for a specific course.
 *
 * @param {object} course — Mongoose Course document (needs .skills array)
 * @returns {array} — array of 20 question objects:
 *   { id, prompt, options, correctAnswer, skill }
 *   options are shuffled; correctAnswer is the text of the correct option
 *   (text-matched on the server, not index-matched).
 *
 * Returns null if fewer than 20 questions are available for the course's skills.
 */
function generateQuizForCourse(course) {
  // ── Check for a course-specific question file first ──
  // This lets individual courses have hand-crafted questions that are
  // truly about the course content, not reused from the skill pool.
  const courseSpecificPath = path.join(__dirname, `../data/${course.code.toLowerCase()}-questions.json`);
  if (fs.existsSync(courseSpecificPath)) {
    try {
      const courseQuestions = JSON.parse(fs.readFileSync(courseSpecificPath, 'utf-8'));
      if (courseQuestions.length >= QUIZ_QUESTIONS_PER_ATTEMPT) {
        const selected = shuffle(courseQuestions).slice(0, QUIZ_QUESTIONS_PER_ATTEMPT);
        const quiz = selected.map((q, i) => ({
          id:            i + 1,
          prompt:        q.question,
          options:       shuffle(q.options),
          correctAnswer: q.answer,
          skill:         course.code,
        }));
        return quiz;
      }
    } catch (err) {
      console.warn(`[CourseQuiz] Failed to load course-specific questions for ${course.code}: ${err.message}`);
    }
  }

  // ── Fallback: pool questions from the course's skills ──
  const skillKeys = (course.skills || [])
    .map(resolveSkillKey)
    .filter(Boolean);

  // Deduplicate keys (a course may list 'nodejs' and 'node.js')
  const uniqueKeys = [...new Set(skillKeys)];

  if (uniqueKeys.length === 0) return null;

  // Pool ALL questions from all relevant skills, tagging each with its skill name.
  const pool = [];
  for (const key of uniqueKeys) {
    const skillData = QUESTIONS[key];
    if (!skillData) continue;
    for (const level of ['beginner', 'intermediate', 'advanced']) {
      for (const q of skillData[level] || []) {
        pool.push({
          prompt:  q.question,
          options: q.options,
          correctAnswer: q.answer,
          skill:   key,
        });
      }
    }
  }

  // Need at least QUIZ_QUESTIONS_PER_ATTEMPT questions to build a valid quiz.
  if (pool.length < QUIZ_QUESTIONS_PER_ATTEMPT) {
    console.warn(`[CourseQuiz] Course ${course.code} has only ${pool.length} questions available (need ${QUIZ_QUESTIONS_PER_ATTEMPT}).`);
    return null;
  }

  // Randomly select 20 questions and shuffle each question's options.
  const selected = shuffle(pool).slice(0, QUIZ_QUESTIONS_PER_ATTEMPT);

  const quiz = selected.map((q, i) => ({
    id:            i + 1,
    prompt:        q.prompt,
    options:       shuffle(q.options),
    correctAnswer: q.correctAnswer,
    skill:         q.skill,
  }));

  return quiz;
}

/**
 * Strip correct answers from questions before sending to the frontend.
 * Returns a safe copy with only: id, prompt, options, skill.
 */
function sanitizeQuestionsForClient(questions) {
  return questions.map((q) => ({
    id:      q.id,
    prompt:  q.prompt,
    options: q.options,
    skill:   q.skill,
  }));
}

module.exports = { generateQuizForCourse, sanitizeQuestionsForClient };
