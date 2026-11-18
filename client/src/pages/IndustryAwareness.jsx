import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROLE_CATEGORIES, INDUSTRY_ROLES } from '../data/industryRoles';

// ─── Simple SVG flow diagram (unchanged from original) ───────────────────────
function FlowDiagram() {
  const steps = [
    { icon: '🎓', label: 'Academic\nLearning' },
    { icon: '📝', label: 'Skill\nAssessment' },
    { icon: '🔍', label: 'Identify\nSkill Gaps' },
    { icon: '📚', label: 'Recommended\nCourses' },
    { icon: '🏢', label: 'Internships &\nExperience' },
    { icon: '✅', label: 'Industry\nReadiness' },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      gap: 6, margin: '28px 0', justifyContent: 'center',
    }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 6, padding: '12px 14px', borderRadius: 8,
            border: '1px solid #d5e4cf', background: '#f4faf1',
            minWidth: 80, textAlign: 'center',
          }}>
            <span style={{ fontSize: 22 }}>{step.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: 800, color: '#2d4f39',
              whiteSpace: 'pre-line', lineHeight: 1.3,
            }}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <span style={{ fontSize: 16, color: '#6ea65b', fontWeight: 800, flexShrink: 0 }}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── "Explore the IT Industry" learning section ───────────────────────────────
function IndustryLearningSection() {
  const topics = [
    {
      icon: '🏢',
      title: 'How the IT industry works',
      desc: 'The IT (Information Technology) industry builds the software, websites, apps, and systems that businesses and people use every day. Companies hire engineers to design, build, test, and maintain these products. Your job as a graduate is to solve real problems using technology — not just write code in isolation.',
    },
    {
      icon: '🏷️',
      title: 'Types of companies',
      desc: 'Product-based companies (like Google, Adobe, Amazon) build and sell their own software products. Service-based companies (like TCS, Infosys, Wipro) build software for other companies as a service. Startups are small, fast-moving teams building new products. Each type offers different learning curves, work culture, and growth speeds.',
    },
    {
      icon: '🎯',
      title: 'How companies recruit freshers',
      desc: 'Most companies recruit freshers through campus placements, off-campus drives, or referral programmes. The typical process includes an aptitude/online test, technical interviews (coding + DSA), and an HR interview. Some companies also look at your GitHub, portfolio, and personal projects as evidence of practical ability.',
    },
    {
      icon: '💼',
      title: 'What job roles and responsibilities mean',
      desc: 'A "role" is your job title — like Frontend Developer or Data Analyst. Your "responsibilities" are the tasks you are expected to do every day. Each role requires a specific set of skills and tools. Understanding which role fits your interests helps you focus your learning and avoid wasting time on skills you will never use.',
    },
    {
      icon: '🔄',
      title: 'Internships vs. full-time vs. entry-level',
      desc: 'An internship is a short-term role (3–6 months) where you learn by working on real projects under guidance. A full-time job is a permanent position with a salary and ongoing responsibilities. An entry-level job is your first permanent role after graduation — it expects foundational knowledge but provides on-the-job training to help you grow.',
    },
    {
      icon: '🛠️',
      title: 'Skills and technologies expected from freshers',
      desc: 'Most companies expect freshers to know at least one programming language (Python, Java, or JavaScript), basic data structures and algorithms, databases (SQL), and Git for version control. Beyond that, the specific skills depend on the role you are targeting — which is exactly what the role explorer below will help you understand.',
    },
  ];

  return (
    <section className="skill-select" style={{ marginBottom: 18 }}>
      <h2>Explore the IT Industry</h2>
      <p style={{ color: '#637166', fontSize: 13, lineHeight: 1.75, marginTop: 12 }}>
        New to the IT industry? This section gives you a simple, beginner-friendly overview
        of how everything fits together — no prior experience needed.
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 12, margin: '20px 0',
      }}>
        {topics.map((item) => (
          <div key={item.title} style={{
            padding: '16px', borderRadius: 7,
            border: '1px solid #d9e8d6', background: '#fbfdf9',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
            <strong style={{ fontSize: 12, color: '#1e3829', display: 'block', marginBottom: 5 }}>
              {item.title}
            </strong>
            <p style={{ margin: 0, fontSize: 11, color: '#637166', lineHeight: 1.65 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Role detail view ────────────────────────────────────────────────────────
function RoleDetail({ role, category, onBack, onAssess }) {
  return (
    <div className="assessment-page page-width">
      <section className="assessment-intro">
        <div>
          <p className="eyebrow">{category?.icon} {category?.name}</p>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 'clamp(40px,5vw,62px)' }}>{role.icon}</span>
            {role.name}
          </h1>
          <p>{role.description}</p>
        </div>
        <div className="assessment-facts">
          <span>{role.skills.length} key skills</span>
          <span>{role.tools.length} common tools</span>
          <span>{role.jobTitles.length} job titles</span>
        </div>
      </section>

      <section className="skill-select">
        <button className="button button-outline" style={{ marginBottom: 20 }} onClick={onBack}>
          ← Back to all roles
        </button>

        <h2 style={{ marginBottom: 14 }}>Main responsibilities</h2>
        <div style={{ display: 'grid', gap: 8, marginBottom: 28 }}>
          {role.responsibilities.map((r, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, padding: '12px 14px',
              borderRadius: 6, border: '1px solid #e0e8dc', background: '#fcfdfa',
            }}>
              <span style={{ color: '#4d8b52', fontWeight: 800, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: '#41564a', lineHeight: 1.6 }}>{r}</span>
            </div>
          ))}
        </div>

        <h2 style={{ marginBottom: 14 }}>Important skills & technologies</h2>
        <div className="skill-chips" style={{ marginBottom: 28 }}>
          {role.skills.map((s) => (
            <span key={s} className="tag" style={{
              padding: '5px 9px', borderRadius: 4, background: '#eff4ed',
              color: '#52715d', fontSize: 10, fontWeight: 800, textTransform: 'capitalize',
            }}>{s}</span>
          ))}
        </div>

        <h2 style={{ marginBottom: 14 }}>Common tools used</h2>
        <div className="skill-chips" style={{ marginBottom: 28 }}>
          {role.tools.map((t) => (
            <span key={t} style={{
              padding: '5px 9px', borderRadius: 4, background: '#eef3f8',
              color: '#3a5d8a', fontSize: 10, fontWeight: 800,
            }}>{t}</span>
          ))}
        </div>

        <div style={{
          padding: '18px 20px', borderRadius: 7, marginBottom: 28,
          border: '1px solid #c8dfc4', background: '#edf7ea',
        }}>
          <strong style={{ fontSize: 12, color: '#1e3829' }}>What a fresher should learn</strong>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#4a6453', lineHeight: 1.75 }}>
            {role.fresherPath}
          </p>
        </div>

        <h2 style={{ marginBottom: 14 }}>Example job titles</h2>
        <div className="skill-chips" style={{ marginBottom: 28 }}>
          {role.jobTitles.map((t) => (
            <span key={t} style={{
              padding: '5px 9px', borderRadius: 4, background: '#f4f8f0',
              color: '#3d6d38', fontSize: 10, fontWeight: 800,
            }}>{t}</span>
          ))}
        </div>

        <div style={{
          padding: '18px 20px', borderRadius: 7, marginBottom: 20,
          background: 'linear-gradient(135deg, #1c4d37 0%, #296b4e 100%)', color: 'white',
        }}>
          <strong style={{ fontSize: 13, color: 'white' }}>🎯 Ready to check your skills?</strong>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#c5ded0', lineHeight: 1.7 }}>
            Take Prashikshan's skill assessment to find out which of these skills you already know
            and which you need to learn. Based on your results, we'll recommend courses that
            target your exact gaps.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="button button-light" onClick={onAssess}>
              Take skill assessment →
            </button>
            <button
              className="button button-outline"
              style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              onClick={onBack}
            >
              Keep exploring roles
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Resume Guide ─────────────────────────────────────────────────────────────
function ResumeGuide({ onContinue, onBack }) {
  const sections = [
    {
      icon: '📋',
      title: '1. Contact Information',
      desc: 'Place your name prominently at the top. Include a professional email address, your phone number, LinkedIn profile URL, and your GitHub or portfolio link. Avoid personal details like date of birth, photo, or home address.',
      sample: (
        <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.8, color: '#243c2c' }}>
          <strong style={{ fontSize: 13 }}>Priya Sharma</strong><br />
          priya.sharma@gmail.com · +91 98765 43210<br />
          linkedin.com/in/priya-sharma · github.com/priya-dev
        </div>
      ),
    },
    {
      icon: '🎯',
      title: '2. Career Objective / Professional Summary',
      desc: 'Write 2–3 sentences about who you are, what you are looking for, and what you bring to the table. Keep it specific to the role you are targeting. Avoid vague phrases like "seeking a challenging position to utilise my skills" — they tell employers nothing.',
      sample: (
        <div style={{ fontSize: 11, color: '#243c2c', lineHeight: 1.7, fontStyle: 'italic' }}>
          "Final-year Computer Science student at VTU with a 8.6 CGPA, seeking a frontend
          developer internship. Proficient in React, JavaScript, and responsive web design.
          Built three deployed projects and completed the Prashikshan Web Foundations course."
        </div>
      ),
    },
    {
      icon: '🎓',
      title: '3. Education',
      desc: 'List your most recent qualification first. Include the institution name, degree, branch, graduation year (expected or completed), and your CGPA or percentage. If you scored above 7.5 CGPA, make it visible.',
      sample: (
        <div style={{ fontSize: 11, color: '#243c2c', lineHeight: 1.8 }}>
          <strong>B.E. Computer Science Engineering</strong> — VTU<br />
          Graduating 2025 · CGPA: 8.6 / 10
        </div>
      ),
    },
    {
      icon: '💻',
      title: '4. Technical Skills',
      desc: 'List only skills you are genuinely comfortable discussing in an interview. Organise them into short, scannable groups. Do not pad this section with tools you have only briefly touched.',
      sample: (
        <div style={{ fontSize: 11, color: '#243c2c', lineHeight: 1.8 }}>
          <strong>Languages:</strong> JavaScript, Python, Java<br />
          <strong>Frameworks:</strong> React, Node.js, Express<br />
          <strong>Databases:</strong> MongoDB, MySQL<br />
          <strong>Tools:</strong> Git, VS Code, Postman
        </div>
      ),
    },
    {
      icon: '🛠️',
      title: '5. Projects',
      desc: 'Projects are the most important section for freshers with no work experience. Describe what you built, why you built it, which technologies you used, and what it does. Each project should take 3–4 bullet points. Add a GitHub or deployed link if available.',
      sample: (
        <div style={{ fontSize: 11, color: '#243c2c', lineHeight: 1.8 }}>
          <strong>Task Manager App</strong> — React, Node.js, MongoDB{' '}
          <span style={{ color: '#4d8b52' }}>↗ github.com/priya-dev/task-manager</span><br />
          · Full-stack CRUD app with JWT authentication and MongoDB storage.<br />
          · Implemented drag-and-drop task reordering using React DnD.<br />
          · Deployed on Render; 200+ test users during college hackathon.
        </div>
      ),
    },
    {
      icon: '🏢',
      title: '6. Internships / Experience',
      desc: 'If you have done an internship, list the company, role, duration, and 2–3 bullet points describing what you contributed. If you have no experience yet, leave this section out entirely — it is better to omit it than to have a blank entry.',
      sample: (
        <div style={{ fontSize: 11, color: '#243c2c', lineHeight: 1.8 }}>
          <strong>Frontend Intern</strong> — TechCorp India · Jan–Mar 2025<br />
          · Built and tested three React components for the company's admin dashboard.<br />
          · Reduced page load time by 15% by implementing lazy loading.
        </div>
      ),
    },
    {
      icon: '🏅',
      title: '7. Certifications',
      desc: 'List certifications that are relevant to the role you are applying for. Include the certification name, the platform or organisation that issued it, and the completion date.',
      sample: (
        <div style={{ fontSize: 11, color: '#243c2c', lineHeight: 1.8 }}>
          · Web Development Foundations — Prashikshan, 2025<br />
          · Introduction to Python — Coursera, 2024<br />
          · Git & GitHub Essentials — freeCodeCamp, 2024
        </div>
      ),
    },
    {
      icon: '🏆',
      title: '8. Achievements & Extracurricular Activities',
      desc: 'Include technical competitions, hackathons, open source contributions, leadership roles in clubs, or relevant academic awards. These show that you are engaged and self-motivated beyond coursework.',
      sample: (
        <div style={{ fontSize: 11, color: '#243c2c', lineHeight: 1.8 }}>
          · 2nd place, Smart India Hackathon internal round, 2024<br />
          · Technical Lead, CSE Department Association 2023–24<br />
          · Contributor to 2 open-source JavaScript projects on GitHub
        </div>
      ),
    },
    {
      icon: '➕',
      title: '9. Additional Information (Optional)',
      desc: 'Only include this section if the information is relevant. Mention languages you speak fluently if the role requires communication, or specific interests that align with the company (e.g. open source, competitive programming).',
      sample: (
        <div style={{ fontSize: 11, color: '#243c2c', lineHeight: 1.8 }}>
          Languages: English (fluent), Kannada (native), Hindi (conversational)
        </div>
      ),
    },
  ];

  return (
    <div className="assessment-page page-width">
      <section className="assessment-intro">
        <div>
          <p className="eyebrow">Resume awareness</p>
          <h1>How to write a professional fresher resume.</h1>
          <p>
            Your resume is the first impression you make. This guide walks you through every
            section — with realistic examples — so you know exactly what to include.
          </p>
        </div>
        <div className="assessment-facts">
          <span>9 key sections</span>
          <span>Sample content included</span>
          <span>ATS-friendly format</span>
        </div>
      </section>

      {/* Sample resume preview */}
      <section className="skill-select" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Sample Resume Layout</h2>
          <span style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
            background: '#fff0cd', color: '#946914', border: '1px solid #f0d080',
          }}>
            ⚠ SAMPLE — fictional details only
          </span>
        </div>
        <p style={{ color: '#637166', fontSize: 12, marginBottom: 18 }}>
          This shows how a well-structured one-page fresher resume looks. The name, contact,
          and all other details below are fictional examples — not real people.
        </p>

        {/* Simulated resume */}
        <div style={{
          border: '1px solid #c8d8c4', borderRadius: 8, overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(28,56,40,0.08)',
          fontFamily: 'Arial, sans-serif', background: 'white',
          maxWidth: 680, margin: '0 auto',
        }}>
          {/* Resume header */}
          <div style={{
            background: '#1c563e', padding: '22px 28px', color: 'white',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
              Priya Sharma
            </div>
            <div style={{ fontSize: 11, color: '#c5ded0', lineHeight: 1.8 }}>
              priya.sharma@gmail.com &nbsp;·&nbsp; +91 98765 43210 &nbsp;·&nbsp;
              linkedin.com/in/priya-sharma &nbsp;·&nbsp; github.com/priya-dev
            </div>
          </div>

          <div style={{ padding: '20px 28px' }}>
            {/* Objective */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: '#1c563e', textTransform: 'uppercase',
                letterSpacing: '0.1em', borderBottom: '1px solid #d5e4cf',
                paddingBottom: 4, marginBottom: 8,
              }}>Career Objective</div>
              <p style={{ margin: 0, fontSize: 11, color: '#3a4a3e', lineHeight: 1.65 }}>
                Final-year Computer Science Engineering student at VTU with a 8.6 CGPA,
                seeking a frontend developer internship. Proficient in React, JavaScript,
                and responsive web design. Built and deployed three personal projects.
              </p>
            </div>

            {/* Education */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: '#1c563e', textTransform: 'uppercase',
                letterSpacing: '0.1em', borderBottom: '1px solid #d5e4cf',
                paddingBottom: 4, marginBottom: 8,
              }}>Education</div>
              <div style={{ fontSize: 11, color: '#3a4a3e', lineHeight: 1.7 }}>
                <strong>B.E. Computer Science Engineering</strong> — VTU, Bengaluru<br />
                Expected Graduation: May 2025 &nbsp;·&nbsp; CGPA: 8.6 / 10
              </div>
            </div>

            {/* Technical skills */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: '#1c563e', textTransform: 'uppercase',
                letterSpacing: '0.1em', borderBottom: '1px solid #d5e4cf',
                paddingBottom: 4, marginBottom: 8,
              }}>Technical Skills</div>
              <div style={{ fontSize: 11, color: '#3a4a3e', lineHeight: 1.7 }}>
                <strong>Languages:</strong> JavaScript, Python, Java &nbsp;
                <strong>Frameworks:</strong> React, Node.js, Express<br />
                <strong>Databases:</strong> MongoDB, MySQL &nbsp;
                <strong>Tools:</strong> Git, VS Code, Postman
              </div>
            </div>

            {/* Projects */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: '#1c563e', textTransform: 'uppercase',
                letterSpacing: '0.1em', borderBottom: '1px solid #d5e4cf',
                paddingBottom: 4, marginBottom: 8,
              }}>Projects</div>
              <div style={{ fontSize: 11, color: '#3a4a3e', lineHeight: 1.7, marginBottom: 8 }}>
                <strong>Task Manager App</strong> — React, Node.js, MongoDB<br />
                <span style={{ paddingLeft: 10 }}>· Full-stack CRUD app with JWT auth and drag-and-drop reordering.</span><br />
                <span style={{ paddingLeft: 10 }}>· Deployed on Render; presented at college hackathon.</span>
              </div>
              <div style={{ fontSize: 11, color: '#3a4a3e', lineHeight: 1.7 }}>
                <strong>Weather Dashboard</strong> — React, OpenWeather API<br />
                <span style={{ paddingLeft: 10 }}>· Displays 5-day forecasts with responsive UI and localStorage caching.</span>
              </div>
            </div>

            {/* Certifications */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: '#1c563e', textTransform: 'uppercase',
                letterSpacing: '0.1em', borderBottom: '1px solid #d5e4cf',
                paddingBottom: 4, marginBottom: 8,
              }}>Certifications</div>
              <div style={{ fontSize: 11, color: '#3a4a3e', lineHeight: 1.7 }}>
                · Web Development Foundations — Prashikshan, 2025<br />
                · Introduction to Python — Coursera, 2024
              </div>
            </div>

            {/* Achievements */}
            <div>
              <div style={{
                fontSize: 10, fontWeight: 800, color: '#1c563e', textTransform: 'uppercase',
                letterSpacing: '0.1em', borderBottom: '1px solid #d5e4cf',
                paddingBottom: 4, marginBottom: 8,
              }}>Achievements</div>
              <div style={{ fontSize: 11, color: '#3a4a3e', lineHeight: 1.7 }}>
                · 2nd place, Smart India Hackathon internal round, 2024<br />
                · Technical Lead, CSE Department Association 2023–24
              </div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: '#8a978c' }}>
          ↑ All names, contacts, and details above are fictional sample content.
        </p>
      </section>

      {/* Section-by-section guide */}
      <section className="skill-select" style={{ marginBottom: 18 }}>
        <h2 style={{ marginBottom: 6 }}>What goes in each section</h2>
        <p style={{ color: '#637166', fontSize: 13, marginBottom: 20 }}>
          Click through each section to understand what to write and how to write it.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {sections.map((sec) => (
            <div key={sec.title} style={{
              borderRadius: 7, border: '1px solid #d9e8d6', overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 16px', background: '#f8faf6',
              }}>
                <span style={{ fontSize: 20 }}>{sec.icon}</span>
                <strong style={{ fontSize: 13, color: '#1e3829' }}>{sec.title}</strong>
              </div>
              <div style={{ padding: '12px 16px', background: 'white' }}>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#637166', lineHeight: 1.65 }}>
                  {sec.desc}
                </p>
                {/* Sample content box */}
                <div style={{
                  padding: '10px 14px', borderRadius: 5,
                  background: '#f4f8f0', border: '1px solid #cde0c6',
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 800, color: '#5a7a5c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Sample
                  </p>
                  {sec.sample}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips box */}
      <section className="skill-select" style={{ marginBottom: 18 }}>
        <h2 style={{ marginBottom: 14 }}>Quick tips for a strong resume</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
        }}>
          {[
            { icon: '📄', tip: 'Keep it to one page. Recruiters spend an average of 7 seconds scanning a fresher resume.' },
            { icon: '🔤', tip: 'Use a clean, ATS-friendly font (Arial, Calibri, or Helvetica) at 10–11pt size.' },
            { icon: '✅', tip: 'Use bullet points, not paragraphs. Start each bullet with an action verb (Built, Designed, Implemented).' },
            { icon: '🚫', tip: 'Do not include a photo, date of birth, or salary expectations unless specifically asked.' },
            { icon: '🔗', tip: 'Every project should have a GitHub link or a deployed URL — it proves the work is real.' },
            { icon: '🎯', tip: 'Tailor your objective and skills to match the job description. Generic resumes get filtered out.' },
          ].map((item) => (
            <div key={item.tip} style={{
              padding: '14px', borderRadius: 6,
              border: '1px solid #d9e8d6', background: '#fbfdf9',
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
              <p style={{ margin: 0, fontSize: 11, color: '#637166', lineHeight: 1.6 }}>
                {item.tip}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation */}
      <section className="skill-select" style={{ marginBottom: 18 }}>
        <div style={{
          padding: '20px', borderRadius: 7,
          background: 'linear-gradient(135deg, #1c4d37 0%, #296b4e 100%)',
          color: 'white',
        }}>
          <strong style={{ fontSize: 14, color: 'white' }}>
            📝 You don't need a finished resume to continue.
          </strong>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#c5ded0', lineHeight: 1.7 }}>
            Prashikshan's skill assessment and course recommendations will help you build
            the skills and projects that actually go on your resume. Take the assessment
            first, then revisit this guide when you are ready to write your resume.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="button button-large button-full" onClick={onContinue}>
            Continue to Skill Assessment →
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 12, margin: '12px 0 0' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#5a7a5c', fontWeight: 700, fontSize: 12,
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            ← Back to previous step
          </button>
        </p>
      </section>
    </div>
  );
}

// ─── Resume question screen ───────────────────────────────────────────────────
function ResumeQuestion({ onYes, onNo, onBack }) {
  return (
    <div className="assessment-page page-width">
      <section className="assessment-intro">
        <div>
          <p className="eyebrow">One more thing</p>
          <h1>A quick check-in on your resume.</h1>
          <p>
            Your resume is how you introduce yourself to employers. Before we start your
            skill assessment, we want to make sure you know the basics.
          </p>
        </div>
        <div className="assessment-facts">
          <span>Takes 30 seconds</span>
          <span>No right answer</span>
          <span>Optional guide available</span>
        </div>
      </section>

      <section className="skill-select">
        <div style={{ textAlign: 'center', padding: '10px 0 28px' }}>
          <h2 style={{ marginBottom: 10 }}>
            Are you familiar with creating a professional resume?
          </h2>
          <p style={{ color: '#637166', fontSize: 13, maxWidth: 520, margin: '0 auto 30px' }}>
            This helps us guide you to the right resources before you start your assessment.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 14, maxWidth: 520, margin: '0 auto',
          }}>
            <button
              className="button button-large button-outline"
              style={{ flexDirection: 'column', gap: 8, minHeight: 100, alignItems: 'center' }}
              onClick={onYes}
            >
              <span style={{ fontSize: 28 }}>👍</span>
              <span>Yes, I know how</span>
              <small style={{ fontWeight: 500, fontSize: 10, opacity: 0.8 }}>
                Continue to assessment
              </small>
            </button>

            <button
              className="button button-large"
              style={{ flexDirection: 'column', gap: 8, minHeight: 100, alignItems: 'center' }}
              onClick={onNo}
            >
              <span style={{ fontSize: 28 }}>📄</span>
              <span>No, show me how</span>
              <small style={{ fontWeight: 500, fontSize: 10, opacity: 0.8 }}>
                Show me the resume guide
              </small>
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#5a7a5c', fontWeight: 700, fontSize: 12,
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            ← Back to previous step
          </button>
        </p>
      </section>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function IndustryAwareness() {
  const navigate = useNavigate();

  // view state machine:
  //   'question'        — initial industry-awareness yes/no
  //   'learn'           — industry overview + roles (triggered by "No" on industry question)
  //   'role-detail'     — individual role deep-dive
  //   'resume-question' — resume awareness yes/no (shown after both industry paths)
  //   'resume-guide'    — full resume guide (triggered by "No" on resume question)
  const [view, setView] = useState('question');
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // The screen that the resume question should return to when "Back" is pressed.
  // Set to 'question' when coming via the "Yes, I'm familiar" path,
  // and 'learn' when coming from the industry learning section.
  const [resumeBackTarget, setResumeBackTarget] = useState('question');

  // Navigate to the existing skill assessment (unchanged logic).
  const goToAssessment = () => navigate('/assessment');

  // Show resume question, remembering which view to go back to.
  const showResumeQuestion = (backTarget) => {
    setResumeBackTarget(backTarget);
    setView('resume-question');
    window.scrollTo(0, 0);
  };

  // Filter roles by search query and active category.
  const filteredRoles = useMemo(() => {
    return INDUSTRY_ROLES.filter((role) => {
      const matchesCategory = activeCategory === 'all' || role.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        role.name.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q) ||
        role.skills.some((s) => s.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  // ── Role detail view ──
  if (view === 'role-detail' && selectedRole) {
    const cat = ROLE_CATEGORIES.find((c) => c.id === selectedRole.category);
    return (
      <RoleDetail
        role={selectedRole}
        category={cat}
        onBack={() => { setView('learn'); window.scrollTo(0, 0); }}
        onAssess={() => showResumeQuestion('learn')}
      />
    );
  }

  // ── Resume guide view ──
  if (view === 'resume-guide') {
    return (
      <ResumeGuide
        onContinue={goToAssessment}
        onBack={() => { setView('resume-question'); window.scrollTo(0, 0); }}
      />
    );
  }

  // ── Resume question view ──
  if (view === 'resume-question') {
    return (
      <ResumeQuestion
        onYes={goToAssessment}
        onNo={() => { setView('resume-guide'); window.scrollTo(0, 0); }}
        onBack={() => { setView(resumeBackTarget); window.scrollTo(0, 0); }}
      />
    );
  }

  // ── Learn view (triggered by "No" on industry question) ──
  if (view === 'learn') {
    return (
      <div className="assessment-page page-width">
        {/* Keep existing explanation header */}
        <section className="assessment-intro">
          <div>
            <p className="eyebrow">Industry readiness</p>
            <h1>What the industry really looks for.</h1>
            <p>
              A degree is a great start — but employers today look for much more than
              academic knowledge alone. Here's what that means in practice.
            </p>
          </div>
          <div className="assessment-facts">
            <span>Practical skills matter</span>
            <span>Projects build credibility</span>
            <span>Prashikshan bridges the gap</span>
          </div>
        </section>

        {/* Keep existing "Beyond the classroom" section */}
        <section className="skill-select" style={{ marginBottom: 18 }}>
          <h2>Beyond the classroom</h2>
          <p style={{ color: '#637166', fontSize: 13, lineHeight: 1.75, marginTop: 12 }}>
            When companies hire fresh graduates, they're looking for people who can
            <strong> apply</strong> what they know — not just recall it. Here are the key areas
            they evaluate:
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12, margin: '20px 0',
          }}>
            {[
              { icon: '⚙️', title: 'Practical skills', desc: 'Can you write real code, build something, or solve a problem end-to-end — not just answer theory questions?' },
              { icon: '📁', title: 'Projects & portfolio', desc: 'Have you built anything? Even a small personal project shows initiative and the ability to follow through.' },
              { icon: '🧩', title: 'Problem-solving', desc: 'Employers want people who break down ambiguous problems and find workable solutions, not just memorise formulas.' },
              { icon: '🤝', title: 'Teamwork & communication', desc: 'Most work happens in teams. Being able to explain your thinking and collaborate clearly is as important as technical ability.' },
            ].map((item) => (
              <div key={item.title} style={{
                padding: '16px', borderRadius: 7,
                border: '1px solid #d9e8d6', background: '#fbfdf9',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <strong style={{ fontSize: 12, color: '#1e3829', display: 'block', marginBottom: 5 }}>
                  {item.title}
                </strong>
                <p style={{ margin: 0, fontSize: 11, color: '#637166', lineHeight: 1.65 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            padding: '18px 20px', borderRadius: 7, marginTop: 4,
            border: '1px solid #c8dfc4', background: '#edf7ea',
          }}>
            <strong style={{ fontSize: 12, color: '#1e3829' }}>How Prashikshan helps</strong>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#4a6453', lineHeight: 1.7 }}>
              Prashikshan's skill assessment identifies exactly where your gaps are. Based on
              your results, it recommends courses that target those gaps — and connects you with
              real internship opportunities to build the practical experience employers are looking for.
            </p>
          </div>
        </section>

        {/* Explore the IT Industry */}
        <IndustryLearningSection />

        {/* Explore Current Industry Roles */}
        <section className="skill-select" style={{ marginBottom: 18 }}>
          <h2>Explore Current Industry Roles</h2>
          <p style={{ color: '#637166', fontSize: 13, lineHeight: 1.75, marginTop: 12, marginBottom: 20 }}>
            Browse common IT industry roles to understand what each one involves, what skills you
            need, and how to get started as a fresher. Click any role to see the full details.
          </p>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles by name or skill…"
            style={{ marginBottom: 16, maxWidth: 400 }}
          />

          <div className="filter-bar" style={{ marginBottom: 20 }}>
            <span>Category:</span>
            <button
              className={activeCategory === 'all' ? 'active' : ''}
              onClick={() => setActiveCategory('all')}
            >
              All ({INDUSTRY_ROLES.length})
            </button>
            {ROLE_CATEGORIES.map((cat) => {
              const count = INDUSTRY_ROLES.filter((r) => r.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  className={activeCategory === cat.id ? 'active' : ''}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.icon} {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {filteredRoles.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {filteredRoles.map((role) => {
                const cat = ROLE_CATEGORIES.find((c) => c.id === role.category);
                return (
                  <div
                    key={role.id}
                    onClick={() => { setSelectedRole(role); setView('role-detail'); window.scrollTo(0, 0); }}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      padding: '20px', borderRadius: 8,
                      border: '1px solid #dce4d9', background: 'white',
                      cursor: 'pointer',
                      transition: 'transform .15s, box-shadow .15s, border-color .15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(50,80,52,0.1)';
                      e.currentTarget.style.borderColor = '#b0cf9e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.borderColor = '#dce4d9';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 28 }}>{role.icon}</span>
                      <div>
                        <strong style={{ fontSize: 14, color: '#243e2d', display: 'block', lineHeight: 1.2 }}>
                          {role.name}
                        </strong>
                        <span style={{
                          fontSize: 9, color: '#7b887e', textTransform: 'uppercase',
                          letterSpacing: '0.05em', fontWeight: 700,
                        }}>
                          {cat?.icon} {cat?.name}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 11, color: '#6e7d72', lineHeight: 1.6, flex: 1 }}>
                      {role.description}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {role.skills.slice(0, 4).map((s) => (
                        <span key={s} style={{
                          padding: '3px 6px', borderRadius: 3, background: '#eff4ed',
                          color: '#52715d', fontSize: 8, fontWeight: 800, textTransform: 'capitalize',
                        }}>{s}</span>
                      ))}
                      {role.skills.length > 4 && (
                        <span style={{ padding: '3px 6px', fontSize: 8, color: '#8a978c', fontWeight: 700 }}>
                          +{role.skills.length - 4} more
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 800, color: '#1d5b41',
                      paddingTop: 8, borderTop: '1px solid #e7ece6',
                    }}>
                      View details →
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <strong>No roles found</strong>
              <p>Try a different search term or category filter.</p>
            </div>
          )}
        </section>

        {/* Flow diagram + assessment CTA — now routes through resume question */}
        <section className="skill-select">
          <FlowDiagram />
          <button
            className="button button-large button-full"
            onClick={() => showResumeQuestion('learn')}
          >
            I'm ready — start my assessment →
          </button>
        </section>

        <p style={{ textAlign: 'center', marginTop: 18 }}>
          <Link to="/dashboard" className="text-action" style={{ fontSize: 11 }}>
            Skip to my dashboard <span>→</span>
          </Link>
        </p>
      </div>
    );
  }

  // ── Initial question screen (unchanged) ──────────────────────────────────────
  return (
    <div className="assessment-page page-width">
      <section className="assessment-intro">
        <div>
          <p className="eyebrow">Before you begin</p>
          <h1>A quick check-in.</h1>
          <p>
            Before jumping into your skill assessment, we want to make sure you have the
            right context to get the most out of it.
          </p>
        </div>
        <div className="assessment-facts">
          <span>Takes 30 seconds</span>
          <span>No right answer</span>
          <span>Helps personalise your path</span>
        </div>
      </section>

      <section className="skill-select">
        <div style={{ textAlign: 'center', padding: '10px 0 28px' }}>
          <h2 style={{ marginBottom: 10 }}>
            Are you familiar with what the industry expects from a graduate entering the workforce?
          </h2>
          <p style={{ color: '#637166', fontSize: 13, maxWidth: 520, margin: '0 auto 30px' }}>
            This helps us understand where you're starting from so we can guide you more effectively.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 14, maxWidth: 520, margin: '0 auto',
          }}>
            {/* "Yes" — routes through resume question before assessment */}
            <button
              className="button button-large button-outline"
              style={{ flexDirection: 'column', gap: 8, minHeight: 100, alignItems: 'center' }}
              onClick={() => showResumeQuestion('question')}
            >
              <span style={{ fontSize: 28 }}>👍</span>
              <span>Yes, I'm familiar</span>
              <small style={{ fontWeight: 500, fontSize: 10, opacity: 0.8 }}>
                Continue to next step
              </small>
            </button>

            {/* "No" — goes to industry learning first */}
            <button
              className="button button-large"
              style={{ flexDirection: 'column', gap: 8, minHeight: 100, alignItems: 'center' }}
              onClick={() => { setView('learn'); window.scrollTo(0, 0); }}
            >
              <span style={{ fontSize: 28 }}>📖</span>
              <span>No, I'd like to learn</span>
              <small style={{ fontWeight: 500, fontSize: 10, opacity: 0.8 }}>
                Show me a quick overview
              </small>
            </button>
          </div>
        </div>
      </section>

      <p style={{ textAlign: 'center', marginTop: 18 }}>
        <Link to="/assessment" className="text-action" style={{ fontSize: 11 }}>
          Skip this step <span>→</span>
        </Link>
      </p>
    </div>
  );
}
