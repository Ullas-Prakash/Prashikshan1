import { useEffect, useRef, useState } from 'react';
import { api, getSession, API_URL } from '../services/api';

// ─── Empty data shape ─────────────────────────────────────────────────────────

const emptyResume = () => ({
  personal: { name: '', email: '', phone: '', linkedin: '', github: '', portfolio: '' },
  summary: '',
  education: [],
  skills: [],
  skillCategories: [],  // structured: [{ category, items[] }]
  projects: [],
  experience: [],
  certifications: [],
  achievements: [],
});

const emptyEdu       = () => ({ institution: '', degree: '', year: '', grade: '' });
const emptyProject   = () => ({ title: '', technologies: '', description: '', contribution: '' });
const emptyExp       = () => ({ company: '', role: '', duration: '', responsibilities: '' });
const emptyCert      = () => ({ name: '', issuer: '', date: '' });
const emptyCat       = () => ({ category: '', items: [''] });

// ─── Preview component ────────────────────────────────────────────────────────

function ResumePreview({ data, onDownload, downloading }) {
  const p = data.personal || {};
  const contactParts = [p.email, p.phone, p.linkedin, p.github, p.portfolio].filter(Boolean);

  const sectionStyle = {
    marginTop: 18,
    paddingTop: 4,
    borderTop: '2px solid #1c563e',
  };
  const headingStyle = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    color: '#1c563e',
    textTransform: 'uppercase',
    marginBottom: 10,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button
          className="button button-small"
          onClick={onDownload}
          disabled={downloading}
        >
          {downloading ? 'Generating…' : '↓ Download PDF'}
        </button>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #dee5da',
          borderRadius: 8,
          padding: '36px 42px',
          fontFamily: 'Manrope, Arial, sans-serif',
          color: '#172119',
          maxWidth: 760,
          margin: '0 auto',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {/* Name */}
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1b3828', letterSpacing: '-0.03em' }}>
          {p.name || <em style={{ color: '#aaa' }}>Your Name</em>}
        </h1>

        {/* Contact row */}
        {contactParts.length > 0 && (
          <p style={{ margin: '5px 0 0', fontSize: 10, color: '#6b7a6e' }}>
            {contactParts.join('  ·  ')}
          </p>
        )}

        <div style={{ marginTop: 10, borderTop: '2px solid #172119' }} />

        {/* Career Objective */}
        {data.summary?.trim() && (
          <div style={sectionStyle}>
            <p style={headingStyle}>Career Objective</p>
            <p style={{ margin: 0 }}>{data.summary}</p>
          </div>
        )}

        {/* Education */}
        {data.education?.length > 0 && (
          <div style={sectionStyle}>
            <p style={headingStyle}>Education</p>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <strong style={{ fontSize: 13, color: '#1b3828' }}>{edu.institution}</strong>
                {edu.degree && <div style={{ fontSize: 11, color: '#3a5443' }}>{edu.degree}</div>}
                {(edu.year || edu.grade) && (
                  <div style={{ fontSize: 10, color: '#6b7a6e' }}>
                    {[edu.year, edu.grade].filter(Boolean).join('  ·  ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Skills — render categorised if available, flat otherwise */}
        {(data.skillCategories?.length > 0 || data.skills?.length > 0) && (
          <div style={sectionStyle}>
            <p style={headingStyle}>Technical Skills</p>
            {data.skillCategories?.length > 0 ? (
              <div style={{ display: 'grid', gap: 4 }}>
                {data.skillCategories.map((cat, i) => (
                  <div key={i} style={{ fontSize: 11 }}>
                    {cat.category && (
                      <strong style={{ color: '#3a5443' }}>{cat.category}:</strong>
                    )}{' '}
                    {(cat.items || []).join(', ')}
                  </div>
                ))}
              </div>
            ) : (
              <div className="skill-chips">
                {data.skills.map((s, i) => <span key={i}>{s}</span>)}
              </div>
            )}
          </div>
        )}

        {/* Projects */}
        {data.projects?.length > 0 && (
          <div style={sectionStyle}>
            <p style={headingStyle}>Projects</p>
            {data.projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 13, color: '#1b3828' }}>{proj.title}</strong>
                {proj.technologies && (
                  <div style={{ fontSize: 10, color: '#3a5443', marginTop: 2 }}>
                    <strong>Technologies:</strong> {proj.technologies}
                  </div>
                )}
                {proj.description && <p style={{ margin: '3px 0 0', fontSize: 11 }}>{proj.description}</p>}
                {proj.contribution && (
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: '#6b7a6e' }}>
                    <strong>Contribution:</strong> {proj.contribution}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Experience */}
        {data.experience?.length > 0 && (
          <div style={sectionStyle}>
            <p style={headingStyle}>Experience</p>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 13, color: '#1b3828' }}>
                  {[exp.role, exp.company].filter(Boolean).join(' — ')}
                </strong>
                {exp.duration && <div style={{ fontSize: 10, color: '#6b7a6e' }}>{exp.duration}</div>}
                {exp.responsibilities && (
                  <p style={{ margin: '3px 0 0', fontSize: 11, whiteSpace: 'pre-line' }}>
                    {exp.responsibilities}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {data.certifications?.length > 0 && (
          <div style={sectionStyle}>
            <p style={headingStyle}>Certifications</p>
            {data.certifications.map((cert, i) => (
              <div key={i} style={{ marginBottom: 6, fontSize: 11 }}>
                <strong>{cert.name}</strong>
                {(cert.issuer || cert.date) && (
                  <span style={{ color: '#6b7a6e' }}>
                    {' '}{[cert.issuer, cert.date].filter(Boolean).join('  ·  ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Achievements */}
        {data.achievements?.length > 0 && (
          <div style={sectionStyle}>
            <p style={headingStyle}>Achievements</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {data.achievements.map((ach, i) => (
                <li key={i} style={{ fontSize: 11, marginBottom: 4 }}>{ach}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResumeBuilder() {
  const [view, setView]           = useState('upload'); // 'upload' | 'edit' | 'preview'
  const [formData, setFormData]   = useState(emptyResume());
  const [resumeId, setResumeId]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [extractionNote, setExtractionNote] = useState('');
  const [unreviewed, setUnreviewed]         = useState('');
  const fileRef = useRef(null);

  // ── Load existing resume on mount ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { resume } = await api('/resume/me');
        setFormData(normalise(resume));
        setResumeId(resume._id);
        setView('edit');
      } catch (e) {
        if (e.status !== 404) setError(e.message);
        // 404 = no resume yet — stay on upload view
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Ensure all array fields are present
  function normalise(r) {
    return {
      personal:        r.personal        || { name: '', email: '', phone: '', linkedin: '', github: '', portfolio: '' },
      summary:         r.summary         || '',
      education:       r.education       || [],
      skills:          r.skills          || [],
      skillCategories: r.skillCategories || [],
      projects:        r.projects        || [],
      experience:      r.experience      || [],
      certifications:  r.certifications  || [],
      achievements:    r.achievements    || [],
    };
  }

  // ── Upload handler ─────────────────────────────────────────────────────────
  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Please choose a PDF or DOCX file.'); return; }
    setError(''); setSuccess(''); setUploading(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      const session = getSession();
      const resp = await fetch(`${API_URL}/resume/upload`, {
        method: 'POST',
        headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
        body: form,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Upload failed.');
      setFormData(normalise(data.resume));
      setResumeId(data.resume._id);
      setExtractionNote(data.extractionNote || '');
      setUnreviewed(data.unreviewed || '');
      setSuccess('Resume uploaded and parsed. Review the fields below.');
      setView('edit');
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError(''); setSuccess(''); setSaving(true);
    try {
      const { resume } = await api('/resume/me', { method: 'PUT', body: formData });
      setFormData(normalise(resume));
      setResumeId(resume._id);
      setSuccess('Resume saved successfully.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── PDF download ───────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const session = getSession();
      const resp = await fetch(`${API_URL}/resume/me/pdf`, {
        headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        throw new Error(d?.error || 'PDF generation failed.');
      }
      const blob = await resp.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = (formData.personal?.name || 'Resume').replace(/\s+/g, '_') + '_Resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  };

  // ── Field updaters ─────────────────────────────────────────────────────────
  const setPersonal = (key, val) =>    setFormData((f) => ({ ...f, personal: { ...f.personal, [key]: val } }));

  const addItem  = (key, item) => setFormData((f) => ({ ...f, [key]: [...f[key], item] }));
  const removeItem = (key, idx) => setFormData((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));
  const updateItem = (key, idx, patch) =>
    setFormData((f) => ({
      ...f,
      [key]: f[key].map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    }));

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return <div className="page-loader">Loading resume…</div>;

  const tabStyle = (active) => ({
    padding: '9px 18px',
    borderRadius: '5px 5px 0 0',
    border: '1px solid',
    borderBottom: active ? '1px solid #fff' : '1px solid #dee5da',
    background: active ? '#fff' : '#f4f8f0',
    color: active ? '#1c563e' : '#6b7a6e',
    fontWeight: 800,
    fontSize: 12,
    cursor: 'pointer',
    marginRight: 4,
    marginBottom: active ? -1 : 0,
    position: 'relative',
    zIndex: active ? 2 : 1,
  });

  return (
    <div className="workspace">
      <div className="page-width">
        {/* Page heading */}
        <div className="workspace-hero">
          <div>
            <p className="eyebrow">Career tools</p>
            <h1>Resume Builder</h1>
            <p>Build, edit, and download an ATS-friendly resume. Upload an existing PDF or DOCX to auto-fill, or start from scratch.</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #dee5da', marginBottom: 24 }}>
          <button style={tabStyle(view === 'upload')} onClick={() => setView('upload')}>📤 Upload</button>
          <button style={tabStyle(view === 'edit')}   onClick={() => setView('edit')}>✏️ Edit</button>
          <button style={tabStyle(view === 'preview')} onClick={() => { if (!resumeId) { setError('Save your resume before previewing.'); return; } setView('preview'); }}>
            👁 Preview
          </button>
        </div>

        {/* Global alerts */}
        {error   && <p className="form-alert"   style={{ marginBottom: 16 }}>{error}</p>}
        {success && <p className="form-success" style={{ marginBottom: 16 }}>{success}</p>}

        {/* ── UPLOAD VIEW ── */}
        {view === 'upload' && (
          <div className="panel" style={{ maxWidth: 580 }}>
            <p className="eyebrow">Step 1</p>
            <h2>Upload your resume</h2>
            <p style={{ color: '#6b7a6e', fontSize: 13, marginBottom: 20 }}>
              Upload a PDF or DOCX (up to 5 MB). We will extract your information automatically.
              You can review and correct everything in the Edit tab.
            </p>

            {extractionNote && (
              <p className="form-success" style={{ marginBottom: 16 }}>{extractionNote}</p>
            )}

            {/* Drop zone */}
            <label style={{
              display: 'block',
              border: '2px dashed #c5d9c0',
              borderRadius: 8,
              padding: '32px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: '#f4f8f0',
              marginBottom: 16,
            }}>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: 32 }}>📄</span>
              <p style={{ margin: '8px 0 4px', fontWeight: 700, color: '#1b3828' }}>
                Click to choose a file
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#6b7a6e' }}>PDF or DOCX · max 5 MB</p>
            </label>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="button" onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading…' : '↑ Upload & Parse'}
              </button>
              <button
                className="button button-outline"
                onClick={() => { setFormData(emptyResume()); setView('edit'); setError(''); setSuccess(''); }}
              >
                Start from scratch
              </button>
            </div>

            {resumeId && (
              <p style={{ marginTop: 16, fontSize: 11, color: '#6b7a6e' }}>
                You already have a saved resume.{' '}
                <button
                  style={{ background: 'none', border: 'none', padding: 0, color: '#1c563e', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                  onClick={() => setView('edit')}
                >
                  Edit it →
                </button>
              </p>
            )}
          </div>
        )}

        {/* ── EDIT VIEW ── */}
        {view === 'edit' && (
          <div>
            {/* Personal Info */}
            <div className="panel" style={{ marginBottom: 18 }}>
              <p className="eyebrow">Personal information</p>
              <h2>Contact details</h2>
              <div className="field-grid" style={{ marginTop: 16 }}>
                {[
                  ['name', 'Full Name'],
                  ['email', 'Email'],
                  ['phone', 'Phone'],
                  ['linkedin', 'LinkedIn URL'],
                  ['github', 'GitHub URL'],
                  ['portfolio', 'Portfolio / Website'],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="text"
                      value={formData.personal?.[key] || ''}
                      onChange={(e) => setPersonal(key, e.target.value)}
                      placeholder={label}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Career Objective */}
            <div className="panel" style={{ marginBottom: 18 }}>
              <div style={{ marginBottom: 14 }}>
                <p className="eyebrow">Profile summary</p>
                <h2 style={{ margin: 0 }}>About you</h2>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11, fontWeight: 800, color: '#34463a' }}>
                Career Objective
                <textarea
                  value={formData.summary || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, summary: e.target.value }))}
                  rows={4}
                  placeholder="A brief professional summary or career objective…"
                />
              </label>
            </div>

            {/* Education */}
            <div className="panel" style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div><p className="eyebrow" style={{ marginBottom: 4 }}>Academics</p><h2 style={{ margin: 0 }}>Education</h2></div>
                <button className="button button-small button-outline" onClick={() => addItem('education', emptyEdu())}>+ Add</button>
              </div>
              {formData.education.length === 0 && (
                <p className="empty-inline">No education entries yet. Click Add.</p>
              )}
              {formData.education.map((edu, i) => (
                <div key={i} style={{ padding: '16px 0', borderTop: '1px solid #ebefea' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <button className="button button-small button-ghost" onClick={() => removeItem('education', i)}>✕ Remove</button>
                  </div>
                  <div className="field-grid">
                    <label>Institution<input value={edu.institution} onChange={(e) => updateItem('education', i, { institution: e.target.value })} placeholder="College / University" /></label>
                    <label>Degree / Course<input value={edu.degree} onChange={(e) => updateItem('education', i, { degree: e.target.value })} placeholder="B.Tech CSE" /></label>
                    <label>Year<input value={edu.year} onChange={(e) => updateItem('education', i, { year: e.target.value })} placeholder="2021 – 2025" /></label>
                    <label>Grade / CGPA<input value={edu.grade} onChange={(e) => updateItem('education', i, { grade: e.target.value })} placeholder="8.5 CGPA" /></label>
                  </div>
                </div>
              ))}
            </div>

            {/* Skills — categorised when available, flat otherwise */}
            <div className="panel" style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div><p className="eyebrow" style={{ marginBottom: 4 }}>Expertise</p><h2 style={{ margin: 0 }}>Technical Skills</h2></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {formData.skillCategories.length > 0 && (
                    <button
                      className="button button-small button-outline"
                      onClick={() => setFormData((f) => ({ ...f, skillCategories: [...f.skillCategories, emptyCat()] }))}>
                      + Add Category
                    </button>
                  )}
                  {formData.skillCategories.length === 0 && (
                    <>
                      <button className="button button-small button-outline" onClick={() => addItem('skills', '')}>+ Add Skill</button>
                      <button
                        className="button button-small button-outline"
                        style={{ fontSize: 10 }}
                        title="Switch to category view"
                        onClick={() => setFormData((f) => ({
                          ...f,
                          skillCategories: f.skills.length ? [{ category: 'Skills', items: [...f.skills] }] : [emptyCat()],
                        }))}>
                        + Use Categories
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Categorised skills editor */}
              {formData.skillCategories.length > 0 ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {formData.skillCategories.map((cat, ci) => (
                    <div key={ci} style={{ padding: '12px 14px', borderRadius: 7, border: '1px solid #e2ebe0', background: '#f8faf6' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                        <input
                          value={cat.category}
                          onChange={(e) => setFormData((f) => ({
                            ...f,
                            skillCategories: f.skillCategories.map((c, j) => j === ci ? { ...c, category: e.target.value } : c),
                          }))}
                          placeholder="Category (e.g. Programming)"
                          style={{ flex: 1, fontWeight: 700 }}
                        />
                        <button
                          className="button button-small button-ghost"
                          onClick={() => setFormData((f) => ({ ...f, skillCategories: f.skillCategories.filter((_, j) => j !== ci) }))}>
                          ✕ Remove category
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6 }}>
                        {(cat.items || []).map((item, ii) => (
                          <div key={ii} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            <input
                              value={item}
                              onChange={(e) => setFormData((f) => ({
                                ...f,
                                skillCategories: f.skillCategories.map((c, j) =>
                                  j === ci
                                    ? { ...c, items: c.items.map((it, k) => k === ii ? e.target.value : it) }
                                    : c
                                ),
                              }))}
                              placeholder="Skill"
                              style={{ flex: 1 }}
                            />
                            <button
                              className="button button-small button-ghost"
                              onClick={() => setFormData((f) => ({
                                ...f,
                                skillCategories: f.skillCategories.map((c, j) =>
                                  j === ci ? { ...c, items: c.items.filter((_, k) => k !== ii) } : c
                                ),
                              }))}>✕</button>
                          </div>
                        ))}
                        <button
                          className="button button-small button-outline"
                          style={{ fontSize: 10 }}
                          onClick={() => setFormData((f) => ({
                            ...f,
                            skillCategories: f.skillCategories.map((c, j) =>
                              j === ci ? { ...c, items: [...c.items, ''] } : c
                            ),
                          }))}>
                          + Add skill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Flat skills editor — for existing resumes without categories */
                <>
                  {formData.skills.length === 0 && (
                    <p className="empty-inline">No skills yet. Click Add Skill or Use Categories.</p>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
                    {formData.skills.map((skill, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          value={skill}
                          onChange={(e) => setFormData((f) => ({ ...f, skills: f.skills.map((s, j) => j === i ? e.target.value : s) }))}
                          placeholder="e.g. React"
                          style={{ flex: 1 }}
                        />
                        <button className="button button-small button-ghost" onClick={() => removeItem('skills', i)}>✕</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Projects */}
            <div className="panel" style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div><p className="eyebrow" style={{ marginBottom: 4 }}>Portfolio</p><h2 style={{ margin: 0 }}>Projects</h2></div>
                <button className="button button-small button-outline" onClick={() => addItem('projects', emptyProject())}>+ Add</button>
              </div>
              {formData.projects.length === 0 && (
                <p className="empty-inline">No projects yet. Click Add.</p>
              )}
              {formData.projects.map((proj, i) => (
                <div key={i} style={{ padding: '16px 0', borderTop: '1px solid #ebefea' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <button className="button button-small button-ghost" onClick={() => removeItem('projects', i)}>✕ Remove</button>
                  </div>
                  <div className="field-grid" style={{ marginBottom: 8 }}>
                    <label>Project Title<input value={proj.title} onChange={(e) => updateItem('projects', i, { title: e.target.value })} placeholder="Project name" /></label>
                    <label>Technologies Used<input value={proj.technologies} onChange={(e) => updateItem('projects', i, { technologies: e.target.value })} placeholder="React, Node, MongoDB…" /></label>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11, fontWeight: 800, color: '#34463a', marginBottom: 8 }}>
                    Description
                    <textarea value={proj.description} rows={3} onChange={(e) => updateItem('projects', i, { description: e.target.value })} placeholder="What the project does and what problem it solves…" />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11, fontWeight: 800, color: '#34463a' }}>
                    Your Contribution
                    <input value={proj.contribution} onChange={(e) => updateItem('projects', i, { contribution: e.target.value })} placeholder="What specifically you built or led…" />
                  </label>
                </div>
              ))}
            </div>

            {/* Experience */}
            <div className="panel" style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div><p className="eyebrow" style={{ marginBottom: 4 }}>Work history</p><h2 style={{ margin: 0 }}>Experience</h2></div>
                <button className="button button-small button-outline" onClick={() => addItem('experience', emptyExp())}>+ Add</button>
              </div>
              {formData.experience.length === 0 && (
                <p className="empty-inline">No experience entries yet. Click Add.</p>
              )}
              {formData.experience.map((exp, i) => (
                <div key={i} style={{ padding: '16px 0', borderTop: '1px solid #ebefea' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <button className="button button-small button-ghost" onClick={() => removeItem('experience', i)}>✕ Remove</button>
                  </div>
                  <div className="field-grid" style={{ marginBottom: 8 }}>
                    <label>Company / Organisation<input value={exp.company} onChange={(e) => updateItem('experience', i, { company: e.target.value })} placeholder="Acme Corp" /></label>
                    <label>Role / Position<input value={exp.role} onChange={(e) => updateItem('experience', i, { role: e.target.value })} placeholder="Software Intern" /></label>
                    <label style={{ gridColumn: '1 / -1' }}>Duration<input value={exp.duration} onChange={(e) => updateItem('experience', i, { duration: e.target.value })} placeholder="June 2024 – August 2024" /></label>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11, fontWeight: 800, color: '#34463a' }}>
                    Responsibilities
                    <textarea value={exp.responsibilities} rows={3} onChange={(e) => updateItem('experience', i, { responsibilities: e.target.value })} placeholder="Key responsibilities and achievements…" />
                  </label>
                </div>
              ))}
            </div>

            {/* Certifications */}
            <div className="panel" style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div><p className="eyebrow" style={{ marginBottom: 4 }}>Credentials</p><h2 style={{ margin: 0 }}>Certifications</h2></div>
                <button className="button button-small button-outline" onClick={() => addItem('certifications', emptyCert())}>+ Add</button>
              </div>
              {formData.certifications.length === 0 && (
                <p className="empty-inline">No certifications yet. Click Add.</p>
              )}
              {formData.certifications.map((cert, i) => (
                <div key={i} style={{ padding: '12px 0', borderTop: '1px solid #ebefea' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <button className="button button-small button-ghost" onClick={() => removeItem('certifications', i)}>✕ Remove</button>
                  </div>
                  <div className="field-grid">
                    <label>Certificate Name<input value={cert.name} onChange={(e) => updateItem('certifications', i, { name: e.target.value })} placeholder="AWS Certified Solutions Architect" /></label>
                    <label>Issuing Body<input value={cert.issuer} onChange={(e) => updateItem('certifications', i, { issuer: e.target.value })} placeholder="Amazon Web Services" /></label>
                    <label>Date<input value={cert.date} onChange={(e) => updateItem('certifications', i, { date: e.target.value })} placeholder="2024" /></label>
                  </div>
                </div>
              ))}
            </div>

            {/* Achievements */}
            <div className="panel" style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div><p className="eyebrow" style={{ marginBottom: 4 }}>Honours</p><h2 style={{ margin: 0 }}>Achievements</h2></div>
                <button className="button button-small button-outline" onClick={() => addItem('achievements', '')}>+ Add</button>
              </div>
              {formData.achievements.length === 0 && (
                <p className="empty-inline">No achievements yet. Click Add.</p>
              )}
              {formData.achievements.map((ach, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input
                    value={ach}
                    onChange={(e) => setFormData((f) => ({ ...f, achievements: f.achievements.map((a, j) => j === i ? e.target.value : a) }))}
                    placeholder="e.g. Rank 1 in State Hackathon 2024"
                    style={{ flex: 1 }}
                  />
                  <button className="button button-small button-ghost" onClick={() => removeItem('achievements', i)}>✕</button>
                </div>
              ))}
            </div>

            {/* Unreviewed content — shown when parser couldn't classify some text */}
            {unreviewed?.trim() && (
              <div className="panel" style={{ marginBottom: 18, borderColor: '#f0d080', background: '#fffbeb' }}>
                <div style={{ marginBottom: 10 }}>
                  <p className="eyebrow" style={{ marginBottom: 4, color: '#946914' }}>Needs review</p>
                  <h2 style={{ margin: 0 }}>Unclassified content</h2>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7a6e' }}>
                    The parser found text it couldn't confidently assign to a section.
                    Copy anything relevant into the correct section above.
                  </p>
                </div>
                <pre style={{
                  whiteSpace: 'pre-wrap', fontSize: 11, color: '#5a4a1e',
                  background: '#fff8e8', border: '1px solid #f0d080',
                  borderRadius: 6, padding: 12, maxHeight: 200, overflowY: 'auto',
                }}>{unreviewed}</pre>
                <button
                  className="button button-small button-ghost"
                  style={{ marginTop: 8, fontSize: 10 }}
                  onClick={() => setUnreviewed('')}>
                  Dismiss
                </button>
              </div>
            )}

            {/* Save bar */}
            <div style={{ display: 'flex', gap: 10, padding: '18px 0', borderTop: '1px solid #dee5da', flexWrap: 'wrap' }}>
              <button className="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Resume'}
              </button>
              <button
                className="button button-outline"
                onClick={() => {
                  if (!resumeId) { setError('Save your resume first.'); return; }
                  setView('preview');
                }}
              >
                👁 Preview
              </button>
              <button className="button button-light" onClick={handleDownload} disabled={downloading || !resumeId}>
                {downloading ? 'Generating…' : '↓ Download PDF'}
              </button>
            </div>
          </div>
        )}

        {/* ── PREVIEW VIEW ── */}
        {view === 'preview' && (
          <ResumePreview
            data={formData}
            onDownload={handleDownload}
            downloading={downloading}
          />
        )}
      </div>
    </div>
  );
}
