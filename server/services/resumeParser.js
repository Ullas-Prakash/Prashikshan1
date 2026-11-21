'use strict';

/**
 * resumeParser.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Accepts a Buffer + mimetype, extracts raw text from PDF or DOCX, then runs a
 * heuristic section splitter to build a structured object matching the Resume
 * schema shape.
 *
 * Never throws on parse failure — always returns a structured object (possibly
 * all-empty) with an `extractionNote` field explaining what happened.
 */

// ─── Text extraction ──────────────────────────────────────────────────────────

async function extractTextFromPDF(buffer) {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return data.text || '';
}

async function extractTextFromDOCX(buffer) {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

// ─── Section splitter ─────────────────────────────────────────────────────────

/**
 * Known section heading patterns in the order they typically appear.
 * Each entry: [ canonicalKey, regex that matches a heading line ]
 *
 * Rules:
 *  - More-specific patterns must appear before broader ones.
 *  - 'achievements' comes before 'certifications' so combined headings like
 *    "Certifications and Achievements" route to achievements.
 *  - All patterns use the /i flag so ALL-CAPS headings match too.
 */
const SECTION_PATTERNS = [
  ['contact',   /^(contact|contact\s+info(rmation)?|personal\s+info(rmation)?|about\s+me)\s*:?\s*$/i],
  ['objective', /^(career\s+objective|professional\s+objective|objective)\s*:?\s*$/i],
  ['summary',   /^(summary|professional\s+summary|profile|career\s+profile|about)\s*:?\s*$/i],
  // "EDUCATION DETAILS" and other variations
  ['education', /^(education(\s+details?)?|educational\s+(background|qualification|details?)|academic\s+(background|details?|qualifications?)|academics?)\s*:?\s*$/i],
  ['skills',    /^(skills?|technical\s+skills?|core\s+(competencies|skills?)|key\s+skills?)\s*:?\s*$/i],
  ['projects',  /^(projects?|academic\s+projects?|personal\s+projects?|major\s+projects?|key\s+projects?)\s*:?\s*$/i],
  ['experience',/^(experience|work\s+experience|professional\s+experience|internship(s)?|employment\s+history|work\s+history)\s*:?\s*$/i],
  // ── Achievements — placed BEFORE certifications.
  //    Includes "ACHIEVEMENTS AND ACTIVITIES" and all common variations.
  ['achievements', /^(achievements?\s+and\s+(activities|extracurricular|awards?|honors?)|achievements?|academic\s+achievements?|awards?\s*(and|&)\s+honors?|awards?\s*(and|&)\s+achievements?|honors?\s*(and|&)\s+awards?|extra[-\s]?curricular(\s+activities?)?|co[-\s]?curricular(\s+activities?)?|positions?\s+of\s+responsibility|leadership(\s+activities?|\s+roles?|\s+experience)?|volunteer(ing|s|\s+work|\s+experience)?|certif\w*\s+(and|&)\s+achievements?|other\s+activities|accomplishments?|activities\s*(and|&)\s+interests?|interests?\s*(and|&)\s+activities?|notable\s+(achievements?|accomplishments?))\s*:?\s*$/i],
  // ── Certifications — only pure certification headings
  ['certifications', /^(certif(icate|ication)(s)?|credentials?|licenses?(\s+(and|&)\s+certif\w+)?)\s*:?\s*$/i],
];

/**
 * Returns true if `line` looks like a section heading.
 * Used to prevent a stray heading-like line from being swallowed mid-section.
 */
function isSectionHeading(line) {
  for (const [, pattern] of SECTION_PATTERNS) {
    if (pattern.test(line)) return true;
  }
  return false;
}

/**
 * Splits raw resume text into named sections.
 * Returns { sectionName: "text content", ... }
 */
function splitSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = {};
  let currentSection = 'header';
  let buffer = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    let matched = false;

    for (const [key, pattern] of SECTION_PATTERNS) {
      if (pattern.test(line)) {
        if (buffer.length) sections[currentSection] = buffer.join('\n').trim();
        currentSection = key;
        buffer = [];
        matched = true;
        break;
      }
    }

    if (!matched) buffer.push(rawLine);
  }

  if (buffer.length) sections[currentSection] = buffer.join('\n').trim();
  return sections;
}

// ─── Personal info extractors ─────────────────────────────────────────────────

const EMAIL_RE     = /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/;
const PHONE_RE     = /(?:\+91[-\s]?)?[6-9]\d{9}/;
const LINKEDIN_RE  = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([^\s,/|>]+)/i;
const GITHUB_RE    = /(?:github\.com\/)([^\s,/|>]+)/i;
const PORTFOLIO_RE = /https?:\/\/(?!(?:linkedin|github)\.com)[^\s,|>]+/i;

function extractPersonal(headerText, allText) {
  const src = (headerText || '') + '\n' + (allText || '');

  const emailMatch   = EMAIL_RE.exec(src);
  const phoneMatch   = PHONE_RE.exec(src);
  const linkedinMatch = LINKEDIN_RE.exec(src);
  const githubMatch  = GITHUB_RE.exec(src);
  const portMatch    = PORTFOLIO_RE.exec(src);

  // Name heuristic: first non-empty line of the header that is NOT an email/URL/phone
  let name = '';
  const headerLines = (headerText || allText || '').split('\n');
  for (const hl of headerLines) {
    const t = hl.trim();
    if (!t) continue;
    if (EMAIL_RE.test(t) || PHONE_RE.test(t) || /https?:\/\//.test(t)) continue;
    if (isSectionHeading(t)) break; // stop at the first real section heading
    if (t.length > 2 && t.length < 80 && /^[A-Za-z]/.test(t)) {
      name = t;
      break;
    }
  }

  return {
    name,
    email:     emailMatch   ? emailMatch[0]                                    : '',
    phone:     phoneMatch   ? phoneMatch[0]                                    : '',
    linkedin:  linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}`   : '',
    github:    githubMatch   ? `https://github.com/${githubMatch[1]}`          : '',
    portfolio: portMatch     ? portMatch[0]                                    : '',
  };
}

// ─── Skills extractor (flat list fallback) ────────────────────────────────────

function extractSkills(skillsText) {
  if (!skillsText) return [];
  const raw = skillsText
    .split(/[\n,|•·;\/\\]/)
    .map((s) => s.replace(/^[-–—*►▪✓✔\s]+|[:\s]+$/g, '').trim())
    .filter((s) => s.length > 1 && s.length < 60);
  return [...new Set(raw)].slice(0, 40);
}

// ─── Skill categories extractor ───────────────────────────────────────────────
//
// Detects lines of the form  "CategoryName: skill1, skill2, ..."
// Returns an array of { category, items } objects.
// If no category lines are detected, returns an empty array (caller falls back
// to the flat extractor above).

const BULLET_STRIP = /^[\s\u2022\u00b7\u25cf\u2013\u2014\u2010\u00b0*\-]+/u;

function extractSkillCategories(skillsText) {
  if (!skillsText) return [];

  const categories = [];
  const lines = skillsText
    .split(/\r?\n/)
    .map((l) => l.replace(BULLET_STRIP, '').trim())
    .filter(Boolean);

  for (const line of lines) {
    // A category line looks like   "Category Name: item1, item2"
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && colonIdx < line.length - 1) {
      const catName = line.slice(0, colonIdx).trim();
      const rest    = line.slice(colonIdx + 1).trim();
      // Category name should be short (< 50 chars) and not contain commas
      if (catName.length < 50 && !catName.includes(',') && rest.length > 0) {
        const items = rest
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        if (items.length > 0) {
          categories.push({ category: catName, items });
          continue;
        }
      }
    }
    // Line without a category prefix — append to last category or create an unnamed one
    if (categories.length > 0) {
      const extra = line.split(',').map((s) => s.trim()).filter(Boolean);
      categories[categories.length - 1].items.push(...extra);
    } else {
      // No category yet — treat the whole line as an unnamed category
      const items = line.split(',').map((s) => s.trim()).filter(Boolean);
      if (items.length > 0) categories.push({ category: '', items });
    }
  }

  return categories;
}

// ─── Education extractor ──────────────────────────────────────────────────────
//
// PDF-extracted education sections often have:
//   • Bullet characters (•) on their own lines — skip these
//   • Institution name and year concatenated on the same line with no space,
//     e.g. "Siddaganga Institute Of Technology2023 - 2027"
//     We split this into institution + year.

function extractEducation(eduText) {
  if (!eduText) return [];
  const entries = [];

  // Strip standalone bullet lines, then split on blank lines
  const cleaned = eduText
    .split(/\r?\n/)
    .filter((l) => !/^[\s\u2022\u00b7\u25cf\u2013*\-\u0393]+$/.test(l.trim()))
    .join('\n');

  const blocks = cleaned.split(/\n{2,}/).filter(Boolean);

  for (const block of blocks) {
    const rawLines = block.split('\n').map((l) => l.replace(BULLET_STRIP, '').trim()).filter(Boolean);
    if (!rawLines.length) continue;

    const entry = { institution: '', degree: '', year: '', grade: '' };
    const lines = [];

    // Pre-process: if a line has an institution name concatenated with a year
    // (no space before the year), split them apart.
    // Pattern: "Some Text2023" — letter immediately followed by digit(year)
    for (const l of rawLines) {
      // Split at the boundary where a letter is immediately followed by a 4-digit year
      const yearConcat = l.match(/^(.*[A-Za-z])((?:19|20)\d{2}\b(?:\s*[-–]\s*(?:(?:19|20)\d{2}|present))?)/i);
      if (yearConcat && yearConcat[1] && yearConcat[2]) {
        lines.push(yearConcat[1].trim());
        lines.push(yearConcat[2].trim());
      } else {
        lines.push(l);
      }
    }

    // Institution is the first substantive line
    entry.institution = lines[0] || '';

    for (const l of lines.slice(1)) {
      if (!entry.degree && /b\.?tech|b\.?e\b|b\.?sc|m\.?tech|m\.?e\b|b\.?ca|m\.?ca|bba|mba|b\.?com|m\.?com|phd|bachelor|master|diploma|pre[-\s]university|pre[-\s]pu\b|engineering|science|arts|commerce/i.test(l)) {
        entry.degree = l;
      }
      if (/\b(19|20)\d{2}\b/.test(l)) {
        const yr = l.match(/\b(19|20)\d{2}\b(?:\s*[-–]\s*(?:\b(19|20)\d{2}\b|present))?/i);
        if (yr && !entry.year) entry.year = yr[0];
      }
      if (/cgpa|gpa|grade\s*:|%|percent|score/i.test(l) && !entry.grade) {
        entry.grade = l;
      }
    }

    if (entry.institution || entry.degree) entries.push(entry);
  }
  return entries.slice(0, 6);
}

// ─── Projects extractor ───────────────────────────────────────────────────────
//
// ─── Projects extractor ───────────────────────────────────────────────────────
//
// PDF projects are separated by bullet-only lines (•), not blank lines.
// Strategy:
//   - Track `afterBullet` flag: true when the previous non-empty line was a
//     bullet separator.
//   - When `afterBullet` is true AND current already has a title with some
//     content, the incoming line is a NEW project title → push + start fresh.
//   - Tech Stack lines are always associated with the most recent project.

const BULLET_ONLY_RE    = /^[\s\u2022\u00b7\u25cf\u25e6\u2013\u2014\u2010*\-\u0393\u0394]+$/u;
// Major project separator: only the top-level bullet • (not sub-bullet ◦)
const MAJOR_BULLET_RE  = /^[\s\u2022\u00b7\u25cf*]+$/u;
const TECH_LINE_RE     = /^(tech\s*(stack|used)?|technologies(\s+used)?|built\s+with|tools?\s*:|stack\s*:)\s*[:–-]?\s*/i;

function extractProjects(projText) {
  if (!projText) return [];

  const rawLines      = projText.split(/\r?\n/);
  const entries       = [];
  let current         = null;
  let afterMajorBullet = true; // first content line is always a potential title

  const pushCurrent = () => {
    if (current && (current.title || current.description)) {
      current.description = current.description.trim().slice(0, 800);
      entries.push(current);
    }
    current = null;
  };

  for (const rawLine of rawLines) {
    const line = rawLine.trim();

    if (!line) { afterMajorBullet = false; continue; }

    // Major bullet-only separator (•) — set flag
    if (MAJOR_BULLET_RE.test(line)) { afterMajorBullet = true; continue; }

    // Sub-bullet (◦) or other minor bullet — treat as description, do NOT set flag
    if (BULLET_ONLY_RE.test(line)) { continue; }

    const stripped = line.replace(BULLET_STRIP, '').trim();
    if (!stripped) continue;

    // Tech Stack line
    if (TECH_LINE_RE.test(stripped)) {
      const techValue = stripped.replace(TECH_LINE_RE, '').trim();
      if (current) current.technologies = techValue;
      afterMajorBullet = false;
      continue;
    }

    // After a MAJOR bullet separator AND current project already populated → new project
    if (afterMajorBullet && current && current.title) {
      pushCurrent();
      current = { title: stripped, technologies: '', description: '', contribution: '' };
      afterMajorBullet = false;
      continue;
    }

    // No current project yet → first title
    if (!current || !current.title) {
      pushCurrent();
      current = { title: stripped, technologies: '', description: '', contribution: '' };
      afterMajorBullet = false;
      continue;
    }

    // Description bullet
    current.description += (current.description ? ' ' : '') + stripped;
    afterMajorBullet = false;
  }

  pushCurrent();
  return entries.slice(0, 10);
}

// ─── Experience extractor ─────────────────────────────────────────────────────

function extractExperience(expText) {
  if (!expText) return [];
  const entries = [];
  const blocks = expText.split(/\n{2,}/).filter(Boolean);
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.replace(BULLET_STRIP, '').trim()).filter(Boolean);
    if (!lines.length) continue;
    const entry = { company: '', role: '', duration: '', responsibilities: '' };
    entry.company = lines[0] || '';
    entry.role    = lines[1] || '';
    const durLine = lines.find((l) =>
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|20\d{2}|19\d{2}|present|current)/i.test(l)
    );
    if (durLine) entry.duration = durLine;
    const respLines = lines.filter((l) =>
      l !== entry.company && l !== entry.role && l !== durLine
    );
    entry.responsibilities = respLines.join('\n').slice(0, 600);
    if (entry.company || entry.role) entries.push(entry);
  }
  return entries.slice(0, 6);
}

// ─── Certifications extractor ─────────────────────────────────────────────────

function extractCertifications(certText) {
  if (!certText) return [];
  const lines = certText.split('\n')
    .map((l) => l.replace(BULLET_STRIP, '').trim())
    .filter(Boolean);
  return lines.slice(0, 10).map((l) => {
    const dateMatch = l.match(/\b(20\d{2}|19\d{2})\b/);
    return {
      name:   l.replace(/[-–|,].*/, '').trim(),
      issuer: '',
      date:   dateMatch ? dateMatch[0] : '',
    };
  });
}

// ─── Achievements extractor ───────────────────────────────────────────────────
//
// Improvements:
//   1. Handles parent organization names + sub-bullets (nested structure).
//   2. Preserves organization context: "KISA — Represented Karnataka…"
//   3. Strips bullet characters but keeps meaningful text.
//   4. Blank-line-separated OR bullet-separated blocks both work.

function extractAchievements(achText) {
  if (!achText) return [];

  const rawLines = achText.split(/\r?\n/);
  const results  = [];
  let parentOrg  = '';

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) { parentOrg = ''; continue; }

    // Skip standalone bullet-only lines
    if (BULLET_ONLY_RE.test(line)) continue;

    const stripped = line.replace(BULLET_STRIP, '').trim();
    if (stripped.length < 3) continue;

    // Heuristic: a line that ends without a period and is short (<= 80 chars)
    // AND is not a typical bullet description is likely an organization/group name.
    const looksLikeOrg =
      stripped.length <= 80 &&
      !stripped.endsWith('.') &&
      !stripped.endsWith(')') &&
      !/\b(20\d{2}|19\d{2})\b/.test(stripped) && // no year
      !/^(represented|secured|participated|won|awarded|ranked|completed|received)/i.test(stripped);

    if (looksLikeOrg && rawLines.some((l) => {
      const s = l.trim();
      return s && !BULLET_ONLY_RE.test(s) && s !== line &&
        /^[\s\u2022\u00b7\u25cf\u25e6\u0393]+/.test(l); // next line starts with sub-bullet
    })) {
      // Treat as parent organization name — will prefix subsequent bullets
      parentOrg = stripped;
      continue;
    }

    // Build the entry string
    const entry = parentOrg ? `${parentOrg} — ${stripped}` : stripped;

    // Avoid duplicate entries
    if (!results.includes(entry) && entry.length > 5) {
      results.push(entry);
    }
  }

  return results.slice(0, 20);
}

// ─── Unreviewed content collector ─────────────────────────────────────────────
//
// Any text that ended up in splitSections under a key we don't recognise is
// surfaced here so the student can review it, rather than silently discarding.

function collectUnreviewed(sections) {
  const known = new Set([
    'header', 'contact', 'objective', 'summary',
    'education', 'skills', 'projects', 'experience',
    'certifications', 'achievements',
  ]);
  const chunks = [];
  for (const [key, text] of Object.entries(sections)) {
    if (!known.has(key) && text && text.trim()) {
      chunks.push(`[${key}]\n${text.trim()}`);
    }
  }
  return chunks.join('\n\n');
}

// ─── Empty resume shape ───────────────────────────────────────────────────────

function emptyResume() {
  return {
    personal:        { name: '', email: '', phone: '', linkedin: '', github: '', portfolio: '' },
    summary:         '',
    education:       [],
    skills:          [],
    skillCategories: [],
    projects:        [],
    experience:      [],
    certifications:  [],
    achievements:    [],
    unreviewed:      '',
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * @param {Buffer} buffer
 * @param {string} mimetype  — 'application/pdf' or DOCX mimetype
 * @returns {Promise<object>}  structured resume + extractionNote
 */
async function parseResume(buffer, mimetype) {
  const result = emptyResume();

  let rawText = '';
  try {
    if (mimetype === 'application/pdf') {
      rawText = await extractTextFromPDF(buffer);
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      rawText = await extractTextFromDOCX(buffer);
    } else {
      result.extractionNote = 'Unsupported file type. Upload a PDF or DOCX.';
      return result;
    }
  } catch (err) {
    result.extractionNote = `Text extraction failed: ${err.message}. Fields left blank for manual entry.`;
    return result;
  }

  if (!rawText.trim()) {
    result.extractionNote =
      'No text could be extracted. This may be a scanned image PDF — text extraction requires selectable text. All fields have been left blank for manual entry.';
    return result;
  }

  try {
    const sections = splitSections(rawText);

    result.personal  = extractPersonal(sections.header || sections.contact || '', rawText);
    result.summary   = (sections.summary || sections.objective || '').slice(0, 1000).trim();
    result.education = extractEducation(sections.education);

    // Skills — try structured categories first; fall back to flat list
    const skillCategories = extractSkillCategories(sections.skills);
    if (skillCategories.length > 0) {
      result.skillCategories = skillCategories;
      // Also populate flat skills for backward compat (all items flattened)
      result.skills = skillCategories.flatMap((c) => c.items);
    } else {
      result.skills          = extractSkills(sections.skills);
      result.skillCategories = [];
    }

    result.projects        = extractProjects(sections.projects);
    result.experience      = extractExperience(sections.experience);
    result.certifications  = extractCertifications(sections.certifications);
    result.achievements    = extractAchievements(sections.achievements);
    result.unreviewed      = collectUnreviewed(sections);

    const warnings = [];
    if (result.education.length === 0 && sections.education) {
      warnings.push('Education section found but could not be parsed — please fill it in manually.');
    }
    if (result.projects.length === 0 && sections.projects) {
      warnings.push('Projects section found but could not be parsed — please fill it in manually.');
    }

    result.extractionNote = warnings.length
      ? `Partial extraction. ${warnings.join(' ')} Review all fields before saving.`
      : 'Extraction successful. Please review and correct all fields before saving.';
  } catch (err) {
    result.extractionNote =
      `Parsing error: ${err.message}. Some fields may be incomplete — please fill them in manually.`;
  }

  return result;
}

// Keep the legacy export used by the assessment upload flow
function detectSkillsFromText(text) {
  const sections = splitSections(text || '');
  return extractSkills(sections.skills);
}

module.exports = { parseResume, detectSkillsFromText };
