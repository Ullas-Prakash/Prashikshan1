'use strict';
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  personal: {
    name:      { type: String, default: '' },
    email:     { type: String, default: '' },
    phone:     { type: String, default: '' },
    linkedin:  { type: String, default: '' },
    github:    { type: String, default: '' },
    portfolio: { type: String, default: '' },
  },
  summary:  { type: String, default: '' },
  education: [{
    institution: { type: String, default: '' },
    degree:      { type: String, default: '' },
    year:        { type: String, default: '' },
    grade:       { type: String, default: '' },
  }],
  // Flat skills list — kept for backward compatibility with existing saved resumes
  skills: [{ type: String }],
  // Structured skill categories — { category: 'Programming', items: ['C++', 'SQL'] }
  // Takes precedence over `skills` when present
  skillCategories: [{
    category: { type: String, default: '' },
    items:    [{ type: String }],
  }],
  projects: [{
    title:        { type: String, default: '' },
    technologies: { type: String, default: '' },
    description:  { type: String, default: '' },
    contribution: { type: String, default: '' },
  }],
  experience: [{
    company:          { type: String, default: '' },
    role:             { type: String, default: '' },
    duration:         { type: String, default: '' },
    responsibilities: { type: String, default: '' },
  }],
  certifications: [{
    name:   { type: String, default: '' },
    issuer: { type: String, default: '' },
    date:   { type: String, default: '' },
  }],
  achievements: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
