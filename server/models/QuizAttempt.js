'use strict';
const mongoose = require('mongoose');

// Stores one quiz attempt per student per course.
// correctAnswer is kept ONLY on the server — it is stripped before
// the question is sent to the frontend via the API.
const quizQuestionSchema = new mongoose.Schema({
  id:            { type: Number, required: true },
  prompt:        { type: String, required: true },
  options:       { type: [String], required: true },
  correctAnswer: { type: String, required: true },   // server-only — never sent to client during quiz
  selectedAnswer:{ type: String, default: '' },       // filled on submit
  skill:         { type: String, default: '' },
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
  course:        { type: mongoose.Schema.Types.ObjectId, ref: 'Course',    required: true },
  enrollment:    { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
  attemptNumber: { type: Number, required: true, min: 1 },
  questions:     { type: [quizQuestionSchema], required: true },
  totalQuestions:{ type: Number, default: 20 },
  score:         { type: Number, default: 0 },
  percentage:    { type: Number, default: 0 },
  passed:        { type: Boolean, default: false },
  status:        { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
  startedAt:     { type: Date, default: Date.now },
  submittedAt:   { type: Date },
  expiresAt:     { type: Date, required: true },
}, { timestamps: true });

// Auto-expire in-progress attempts after 30 minutes.
quizAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// One active attempt per student per course at a time.
quizAttemptSchema.index({ student: 1, course: 1, status: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
