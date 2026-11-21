'use strict';

/**
 * Demo Course Auto-Enrollment Service
 * ────────────────────────────────────────────────────────────────────────────
 * Ensures every student has a completed enrollment for the DEMO-101 course.
 * Called from the /me endpoint on each app load — idempotent and non-blocking.
 *
 * The enrollment is created with status='completed' and progress=100 so the
 * student can immediately access the quiz without watching videos.
 */

const Course     = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const DEMO_COURSE_CODE = 'DEMO-101';

/**
 * If the user is a student and does not yet have a completed enrollment for
 * the demo course, create one.  Does nothing for partners/coordinators or
 * if the enrollment already exists.
 *
 * @param {object} user — Mongoose User document (must have ._id and .role)
 * @returns {Promise<void>}
 */
async function ensureDemoEnrollment(user) {
  if (!user || user.role !== 'student') return;

  const demoCourse = await Course.findOne({ code: DEMO_COURSE_CODE }).select('_id');
  if (!demoCourse) return; // demo course not seeded yet

  // Idempotent: check before creating
  const existing = await Enrollment.findOne({ student: user._id, course: demoCourse._id });
  if (existing) return; // already enrolled — do NOT touch existing progress

  await Enrollment.create({
    student:      user._id,
    course:       demoCourse._id,
    progress:     100,
    status:       'completed',
    completedAt:  new Date(),
    startedAt:    new Date(),
    estimatedHours: 1,
  });

  console.log(`[Demo] Auto-enrolled student ${user._id} in ${DEMO_COURSE_CODE}`);
}

module.exports = { ensureDemoEnrollment, DEMO_COURSE_CODE };
