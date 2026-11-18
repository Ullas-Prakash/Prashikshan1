'use strict';

/**
 * Course Completion Quiz Routes
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Endpoints:
 *   GET    /api/courses/:courseId/quiz/config   — returns quiz config (threshold, etc.)
 *   GET    /api/courses/:courseId/quiz/status    — quiz status for this student+course
 *   POST   /api/courses/:courseId/quiz/start     — start a new 20-question attempt
 *   POST   /api/courses/quiz/:attemptId/submit  — submit answers (backend grades)
 *   GET    /api/courses/quiz/:attemptId/result   — review submitted answers
 *   GET    /api/courses/me/quiz-certificates     — all quiz certificates for dashboard
 *
 * Security:
 *   — Correct answers are NEVER sent to the frontend before submission.
 *   — Score is calculated on the backend, never trusted from the client.
 *   — Every endpoint verifies the authenticated student owns the resource.
 *   — Duplicate certificate issuance is prevented by checking existing certs.
 */

const express    = require('express');
const Course     = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const QuizAttempt= require('../models/QuizAttempt');
const Certificate = require('../models/Certificate');
const User       = require('../models/User');
const { requireAuth, allowRoles } = require('../lib/auth');
const { generateQuizForCourse, sanitizeQuestionsForClient } = require('../services/courseQuizService');
const { issueQuizCertificate } = require('../services/certificateService');
const {
  QUIZ_QUESTIONS_PER_ATTEMPT,
  QUIZ_MAX_SCORE,
  QUIZ_PASSING_THRESHOLD,
  QUIZ_MIN_PASSING_SCORE,
  QUIZ_ATTEMPT_EXPIRY_MINUTES,
} = require('../config/quizConfig');

const router = express.Router();

// ─── GET /api/courses/:courseId/quiz/config ──────────────────────────────────
router.get('/:courseId/quiz/config', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId).select('quizPassingScore');
    const minPassing = course?.quizPassingScore || QUIZ_MIN_PASSING_SCORE;
    return res.json({
      totalQuestions:   QUIZ_QUESTIONS_PER_ATTEMPT,
      maxScore:         QUIZ_MAX_SCORE,
      passingThreshold: QUIZ_PASSING_THRESHOLD,
      minPassingScore:  minPassing,
      attemptExpiryMin: QUIZ_ATTEMPT_EXPIRY_MINUTES,
    });
  } catch (e) { next(e); }
});

// ─── GET /api/courses/:courseId/quiz/status ───────────────────────────────────
router.get('/:courseId/quiz/status', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.auth.sub;

    // Verify enrollment exists and course is completed
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) return res.status(404).json({ error: 'You are not enrolled in this course.' });

    // Get all attempts for this student+course
    const attempts = await QuizAttempt.find({ student: studentId, course: courseId, status: 'completed' })
      .sort({ submittedAt: -1 });

    const passedAttempts = attempts.filter((a) => a.passed);
    const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.score)) : 0;
    const hasPassed = passedAttempts.length > 0;

    // Check if certificate already exists
    const certificate = hasPassed
      ? await Certificate.findOne({ student: studentId, course: courseId, status: 'VALID' })
      : null;

    return res.json({
      enrolled:          true,
      courseCompleted:   enrollment.status === 'completed',
      courseCompletedAt:  enrollment.completedAt,
      totalAttempts:     attempts.length,
      hasPassed,
      bestScore,
      canRetake:        !hasPassed,
      certificateId:    certificate?.certificateId || null,
      quizScore:        certificate?.quizScore ?? null,
      quizPercentage:   certificate?.quizPercentage ?? null,
    });
  } catch (e) { next(e); }
});

// ─── POST /api/courses/:courseId/quiz/start ─────────────────────────────────
router.post('/:courseId/quiz/start', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const courseId  = req.params.courseId;
    const studentId = req.auth.sub;

    // ── 1. Verify enrollment exists and course is completed ──
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId }).populate('course');
    if (!enrollment) return res.status(404).json({ error: 'You are not enrolled in this course.' });
    if (enrollment.status !== 'completed')
      return res.status(400).json({ error: 'Complete the course before taking the quiz.' });

    // ── 2. If already passed, they can't retake ──
    const existingPassed = await QuizAttempt.findOne({ student: studentId, course: courseId, passed: true });
    if (existingPassed)
      return res.status(409).json({ error: 'You have already passed this course quiz.', certificateId: enrollment.certificateId || null });

    // ── 3. Check for an active in-progress attempt ──
    const activeAttempt = await QuizAttempt.findOne({
      student: studentId, course: courseId, status: 'in-progress',
      expiresAt: { $gt: new Date() },
    });
    if (activeAttempt) {
      // Resume the existing attempt
      return res.json({
        attemptId:    activeAttempt._id,
        attemptNumber:activeAttempt.attemptNumber,
        questions:    sanitizeQuestionsForClient(activeAttempt.questions),
        expiresAt:    activeAttempt.expiresAt,
      });
    }

    // ── 4. Generate course-specific quiz ──
    const course = enrollment.course;
    const questions = generateQuizForCourse(course);
    if (!questions || questions.length < QUIZ_QUESTIONS_PER_ATTEMPT) {
      return res.status(503).json({
        error: 'This course does not have enough verified quiz questions yet. Please contact support or try again later.',
      });
    }

    // ── 5. Count previous attempts for attempt number ──
    const attemptCount = await QuizAttempt.countDocuments({ student: studentId, course: courseId });

    // ── 6. Create the attempt ──
    const attempt = await QuizAttempt.create({
      student:       studentId,
      course:        courseId,
      enrollment:    enrollment._id,
      attemptNumber: attemptCount + 1,
      questions,
      totalQuestions:QUIZ_QUESTIONS_PER_ATTEMPT,
      status:        'in-progress',
      expiresAt:     new Date(Date.now() + QUIZ_ATTEMPT_EXPIRY_MINUTES * 60 * 1000),
    });

    return res.status(201).json({
      attemptId:    attempt._id,
      attemptNumber:attempt.attemptNumber,
      questions:    sanitizeQuestionsForClient(attempt.questions),
      expiresAt:    attempt.expiresAt,
    });
  } catch (e) { next(e); }
});

// ─── POST /api/courses/quiz/:attemptId/submit ────────────────────────────────
router.post('/quiz/:attemptId/submit', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const attemptId = req.params.attemptId;
    const studentId = req.auth.sub;

    const attempt = await QuizAttempt.findOne({ _id: attemptId, student: studentId });
    if (!attempt) return res.status(404).json({ error: 'Quiz attempt not found.' });

    // ── Prevent double submission ──
    if (attempt.status === 'completed')
      return res.status(409).json({ error: 'This quiz attempt has already been submitted.' });

    // ── Check expiry ──
    if (new Date() > attempt.expiresAt)
      return res.status(400).json({ error: 'This quiz attempt has expired. Please start a new one.' });

    // ── Validate submitted answers ──
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length !== attempt.questions.length) {
      return res.status(400).json({ error: `Please answer all ${attempt.questions.length} questions.` });
    }

    // ── Grade on the backend — never trust client-calculated scores ──
    let correctCount = 0;
    const gradedQuestions = [];

    for (let i = 0; i < attempt.questions.length; i++) {
      const q = attempt.questions[i];
      const submitted = answers.find((a) => Number(a.id) === q.id);
      const selectedAnswer = submitted ? String(submitted.selectedAnswer || '').trim() : '';

      // Validate that the selected answer is one of the options
      const isValidOption = q.options.includes(selectedAnswer);
      const isCorrect = isValidOption && selectedAnswer === q.correctAnswer;

      if (isCorrect) correctCount++;

      gradedQuestions.push({
        ...q.toObject(),
        selectedAnswer: isValidOption ? selectedAnswer : '',
      });
    }

    const score      = correctCount;
    const percentage = Math.round((score / attempt.totalQuestions) * 100);

    // ── Use per-course passing score if set, else global default ──
    const course = await Course.findById(attempt.course);
    const minPassing = course.quizPassingScore || QUIZ_MIN_PASSING_SCORE;
    const passed     = score >= minPassing;

    // ── Update attempt ──
    attempt.questions   = gradedQuestions;
    attempt.score       = score;
    attempt.percentage  = percentage;
    attempt.passed      = passed;
    attempt.status      = 'completed';
    attempt.submittedAt = new Date();
    await attempt.save();

    // ── If passed, generate certificate (prevent duplicates) ──
    let certificateId = null;
    let pdfUrl = null;

    if (passed) {
      // Check if a certificate already exists for this student+course
      const existingCert = await Certificate.findOne({
        student: studentId,
        course:  attempt.course,
        status:  'VALID',
      });

      if (existingCert) {
        // Already has a certificate — don't issue a duplicate
        certificateId = existingCert.certificateId;
        pdfUrl = existingCert.pdfUrl;
      } else {
        // Generate a new quiz-based certificate (course already fetched above)
        const user   = await User.findById(studentId).select('name');
        const enrollment = await Enrollment.findOne({ student: studentId, course: attempt.course });

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const cert = await issueQuizCertificate({
          studentName:       user.name,
          courseName:        course.title,
          courseCode:        course.code,
          credits:           course.credits,
          studentId,
          courseId:         course._id,
          enrollmentDoc:     enrollment,
          baseUrl,
          quizScore:         score,
          quizTotalQuestions: attempt.totalQuestions,
          quizPercentage:    percentage,
          courseCompletedAt: enrollment.completedAt,
          quizPassedAt:      attempt.submittedAt,
        });

        certificateId = cert.certificateId;
        pdfUrl = cert.pdfUrl;
      }
    }

    return res.json({
      score,
      totalQuestions:  attempt.totalQuestions,
      percentage,
      correctAnswers:  correctCount,
      incorrectAnswers: attempt.totalQuestions - correctCount,
      passed,
      minPassingScore:  minPassing,
      passingThreshold: QUIZ_PASSING_THRESHOLD,
      certificateId,
      pdfUrl,
    });
  } catch (e) { next(e); }
});

// ─── GET /api/courses/quiz/:attemptId/result ─────────────────────────────────
// Returns the full attempt with correct answers for review (only after submission).
router.get('/quiz/:attemptId/result', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findOne({ _id: req.params.attemptId, student: req.auth.sub })
      .populate('course', 'title code');
    if (!attempt) return res.status(404).json({ error: 'Quiz attempt not found.' });
    if (attempt.status !== 'completed')
      return res.status(400).json({ error: 'This quiz has not been submitted yet.' });

    return res.json({
      attemptId:      attempt._id,
      courseTitle:    attempt.course?.title || '',
      courseCode:     attempt.course?.code || '',
      attemptNumber:  attempt.attemptNumber,
      totalQuestions: attempt.totalQuestions,
      score:          attempt.score,
      percentage:     attempt.percentage,
      passed:         attempt.passed,
      submittedAt:    attempt.submittedAt,
      questions:      attempt.questions.map((q) => ({
        id:            q.id,
        prompt:        q.prompt,
        options:       q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer:q.selectedAnswer,
        skill:         q.skill,
      })),
    });
  } catch (e) { next(e); }
});

// ─── GET /api/courses/me/quiz-certificates ───────────────────────────────────
// Returns all certificates for the student for the "My Certificates" dashboard section.
router.get('/me/quiz-certificates', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ student: req.auth.sub, status: 'VALID' })
      .populate('course', 'title code credits')
      .sort({ issuedAt: -1 });

    return res.json({
      certificates: certificates.map((cert) => ({
        certificateId:      cert.certificateId,
        courseTitle:       cert.course?.title || 'Unknown',
        courseCode:        cert.course?.code || '',
        credits:           cert.course?.credits || 0,
        issuedAt:          cert.issuedAt,
        quizScore:         cert.quizScore,
        quizTotalQuestions:cert.quizTotalQuestions,
        quizPercentage:    cert.quizPercentage,
        pdfUrl:            cert.pdfUrl,
      })),
    });
  } catch (e) { next(e); }
});

module.exports = router;
