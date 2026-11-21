'use strict';

const express = require('express');
const multer  = require('multer');
const PDFDoc  = require('pdfkit');

const { requireAuth, allowRoles } = require('../lib/auth');
const Resume                      = require('../models/Resume');
const { parseResume }             = require('../services/resumeParser');

const router  = express.Router();

// ─── Multer — memory storage, PDF/DOCX only, 5 MB limit ──────────────────────

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIMES.has(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF and DOCX files are allowed.'));
  },
});

// ─── Helper — verify ownership ────────────────────────────────────────────────

function ownResume(resume, authSub) {
  return String(resume.student) === String(authSub);
}

// ─── POST /api/resume/upload ──────────────────────────────────────────────────

router.post(
  '/upload',
  requireAuth,
  allowRoles('student'),
  upload.single('resume'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Send a PDF or DOCX as multipart/form-data field "resume".' });
    }

    const structured = await parseResume(req.file.buffer, req.file.mimetype);

    // Upsert resume — create or replace for this student
    const resume = await Resume.findOneAndUpdate(
      { student: req.auth.sub },
      {
        student:         req.auth.sub,
        personal:        structured.personal,
        summary:         structured.summary,
        education:       structured.education,
        skills:          structured.skills,
        skillCategories: structured.skillCategories || [],
        projects:        structured.projects,
        experience:      structured.experience,
        certifications:  structured.certifications,
        achievements:    structured.achievements,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: 'Resume uploaded and parsed successfully.',
      extractionNote: structured.extractionNote,
      unreviewed: structured.unreviewed || '',
      resume,
    });
  }
);

// ─── GET /api/resume/me ───────────────────────────────────────────────────────

router.get('/me', requireAuth, allowRoles('student'), async (req, res) => {
  const resume = await Resume.findOne({ student: req.auth.sub }).lean();
  if (!resume) return res.status(404).json({ error: 'No resume found. Create or upload one.' });
  if (!ownResume(resume, req.auth.sub)) return res.status(403).json({ error: 'Forbidden.' });
  return res.json({ resume });
});

// ─── PUT /api/resume/me ───────────────────────────────────────────────────────

router.put('/me', requireAuth, allowRoles('student'), async (req, res) => {
  const {
    personal = {}, summary = '', education = [], skills = [],
    skillCategories = [],
    projects = [], experience = [], certifications = [], achievements = [],
  } = req.body;

  const resume = await Resume.findOneAndUpdate(
    { student: req.auth.sub },
    {
      student: req.auth.sub,
      personal, summary, education, skills, skillCategories,
      projects, experience, certifications, achievements,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  if (!ownResume(resume, req.auth.sub)) return res.status(403).json({ error: 'Forbidden.' });
  return res.json({ message: 'Resume saved.', resume });
});

// ─── GET /api/resume/me/pdf ───────────────────────────────────────────────────

router.get('/me/pdf', requireAuth, allowRoles('student'), async (req, res) => {
  const resume = await Resume.findOne({ student: req.auth.sub }).lean();
  if (!resume) return res.status(404).json({ error: 'No resume found.' });
  if (!ownResume(resume, req.auth.sub)) return res.status(403).json({ error: 'Forbidden.' });

  const name = (resume.personal?.name || 'Resume').replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'Resume';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/ /g, '_')}_Resume.pdf"`);

  const doc = new PDFDoc({ size: 'A4', margin: 50, info: { Title: `${name} — Resume`, Author: name } });
  doc.pipe(res);

  const W          = doc.page.width  - 100; // usable width (margins 50 each)
  const LEFT       = 50;
  const C_DARK     = '#172119';
  const C_HEADING  = '#1c563e';
  const C_MID      = '#3a5443';
  const C_LIGHT    = '#6b7a6e';
  const C_RULE     = '#d5ded3';

  // ── Name ──
  doc.font('Helvetica-Bold').fontSize(22).fillColor(C_DARK)
     .text(name || 'Your Name', LEFT, 50, { width: W });

  // ── Contact row ──
  const p = resume.personal || {};
  const contactParts = [p.email, p.phone, p.linkedin, p.github, p.portfolio].filter(Boolean);
  if (contactParts.length) {
    doc.moveDown(0.3)
       .font('Helvetica').fontSize(9).fillColor(C_LIGHT)
       .text(contactParts.join('  ·  '), LEFT, doc.y, { width: W });
  }

  // ── Horizontal rule ──
  doc.moveDown(0.5);
  doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).lineWidth(1).strokeColor(C_DARK).stroke();
  doc.moveDown(0.6);

  function sectionHeading(title) {
    doc.moveDown(0.5)
       .font('Helvetica-Bold').fontSize(10).fillColor(C_HEADING)
       .text(title.toUpperCase(), LEFT, doc.y, { width: W });
    doc.moveDown(0.15);
    doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).lineWidth(0.5).strokeColor(C_RULE).stroke();
    doc.moveDown(0.3);
  }

  function bodyText(text, indent = 0) {
    if (!text) return;
    doc.font('Helvetica').fontSize(10).fillColor(C_DARK)
       .text(String(text), LEFT + indent, doc.y, { width: W - indent });
  }

  function labelText(label, value) {
    if (!value) return;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C_MID)
       .text(label + ': ', LEFT + 4, doc.y, { continued: true, width: W - 4 })
       .font('Helvetica').fontSize(9).fillColor(C_DARK)
       .text(value, { width: W - 4 });
  }

  // ── Career Objective ──
  if (resume.summary?.trim()) {
    sectionHeading('Career Objective');
    bodyText(resume.summary);
  }

  // ── Education ──
  if (resume.education?.length) {
    sectionHeading('Education');
    for (const edu of resume.education) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(C_DARK)
         .text(edu.institution || '', LEFT, doc.y, { width: W });
      if (edu.degree) labelText('Degree', edu.degree);
      const yearGrade = [edu.year, edu.grade].filter(Boolean).join('  ·  ');
      if (yearGrade) {
        doc.font('Helvetica').fontSize(9).fillColor(C_LIGHT)
           .text(yearGrade, LEFT + 4, doc.y, { width: W });
      }
      doc.moveDown(0.4);
    }
  }

  // ── Technical Skills ──
  if (resume.skillCategories?.length) {
    sectionHeading('Technical Skills');
    for (const cat of resume.skillCategories) {
      if (cat.category) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(C_MID)
           .text(cat.category + ': ', LEFT, doc.y, { continued: true })
           .font('Helvetica').fontSize(9).fillColor(C_DARK)
           .text(cat.items.join(', '), { width: W });
        doc.moveDown(0.3);
      } else if (cat.items?.length) {
        doc.font('Helvetica').fontSize(10).fillColor(C_DARK)
           .text(cat.items.join('  ·  '), LEFT, doc.y, { width: W });
      }
    }
  } else if (resume.skills?.length) {
    sectionHeading('Technical Skills');
    doc.font('Helvetica').fontSize(10).fillColor(C_DARK)
       .text(resume.skills.join('  ·  '), LEFT, doc.y, { width: W });
  }

  // ── Projects ──
  if (resume.projects?.length) {
    sectionHeading('Projects');
    for (const proj of resume.projects) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(C_DARK)
         .text(proj.title || 'Untitled Project', LEFT, doc.y, { width: W });
      if (proj.technologies) labelText('Technologies', proj.technologies);
      if (proj.description) bodyText(proj.description, 4);
      if (proj.contribution) labelText('Contribution', proj.contribution);
      doc.moveDown(0.4);
    }
  }

  // ── Experience ──
  if (resume.experience?.length) {
    sectionHeading('Experience');
    for (const exp of resume.experience) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(C_DARK)
         .text([exp.role, exp.company].filter(Boolean).join(' — ') || 'Role', LEFT, doc.y, { width: W });
      if (exp.duration) {
        doc.font('Helvetica').fontSize(9).fillColor(C_LIGHT)
           .text(exp.duration, LEFT + 4, doc.y, { width: W });
      }
      if (exp.responsibilities) bodyText(exp.responsibilities, 4);
      doc.moveDown(0.4);
    }
  }

  // ── Certifications ──
  if (resume.certifications?.length) {
    sectionHeading('Certifications');
    for (const cert of resume.certifications) {
      const line = [cert.name, cert.issuer, cert.date].filter(Boolean).join('  ·  ');
      bodyText(line, 4);
      doc.moveDown(0.2);
    }
  }

  // ── Achievements ──
  if (resume.achievements?.length) {
    sectionHeading('Achievements');
    for (const ach of resume.achievements) {
      bodyText('• ' + ach, 4);
      doc.moveDown(0.15);
    }
  }

  doc.end();
});

module.exports = router;
