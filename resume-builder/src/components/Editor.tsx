import type React from "react"
import {
  type Basics,
  type Experience,
  type Project,
  type Education,
  type Certification,
  type ResumeTargeting
} from "../types/resume"
import type { AtsReport } from "../utils/ats"
import { resumeModes } from "../utils/resumeAi"

interface Props {
  tab: string
  basics: Basics
  setBasics: React.Dispatch<React.SetStateAction<Basics>>
  experience: Experience[]
  setExperience: React.Dispatch<React.SetStateAction<Experience[]>>
  projects: Project[]
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  education: Education[]
  setEducation: React.Dispatch<React.SetStateAction<Education[]>>
  certifications: Certification[]
  setCertifications: React.Dispatch<React.SetStateAction<Certification[]>>
  targeting: ResumeTargeting
  setTargeting: React.Dispatch<React.SetStateAction<ResumeTargeting>>
  atsReport: AtsReport
  importMeta: {
    fileName: string
    warnings: string[]
  } | null
  optimizationNotes: string[]
  onOptimizeResume: () => void
  onGenerateSummary: () => void
  onRewriteAllBullets: () => void
}

interface SectionMeta {
  id: string
  title: string
  description: string
}

const sections: SectionMeta[] = [
  {
    id: "basics",
    title: "Personal Details",
    description: "Add your name, contact information, and profile links."
  },
  {
    id: "targeting",
    title: "AI Job Targeting",
    description: "Paste a job description, choose a resume mode, and generate a tailored ATS-first resume."
  },
  {
    id: "objective",
    title: "Professional Summary",
    description: "Write a short summary tailored to the role you are targeting."
  },
  {
    id: "experience",
    title: "Work Experience",
    description: "Show impact with short bullet points and strong action verbs."
  },
  {
    id: "projects",
    title: "Projects",
    description: "Include side projects, freelance work, or product launches."
  },
  {
    id: "skills",
    title: "Technical Skills",
    description: "Use commas to separate skills so they render as tags in the preview."
  },
  {
    id: "education",
    title: "Education",
    description: "Add degrees, schools, and dates in reverse chronological order."
  },
  {
    id: "certifications",
    title: "Certifications",
    description: "Include relevant certifications, workshops, and credentials."
  },
  {
    id: "languages",
    title: "Languages",
    description: "Use one language per line to keep the resume clean and readable."
  },
  {
    id: "ats",
    title: "ATS Review",
    description: "See a readiness score, strengths, and the main fixes to improve parsing and recruiter fit."
  }
]

function SectionHeader({ title, description }: Omit<SectionMeta, "id">) {
  return (
    <div className="section-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}

function InsightList({
  title,
  items,
  empty
}: {
  title: string
  items: string[]
  empty: string
}) {
  return (
    <div className="insight-block">
      <div className="insight-title">{title}</div>
      {items.length > 0 ? (
        <div className="keyword-chip-list">
          {items.map(item => (
            <span key={`${title}-${item}`} className="keyword-chip">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="ats-empty">{empty}</p>
      )}
    </div>
  )
}

export default function Editor({
  tab,
  basics,
  setBasics,
  experience,
  setExperience,
  projects,
  setProjects,
  education,
  setEducation,
  certifications,
  setCertifications,
  targeting,
  setTargeting,
  atsReport,
  importMeta,
  optimizationNotes,
  onOptimizeResume,
  onGenerateSummary,
  onRewriteAllBullets
}: Props) {
  const activeSection = sections.find(section => section.id === tab) ?? sections[0]
  const jobAnalysis = atsReport.jobAnalysis

  const updateBasics = (field: keyof Basics, value: string) => {
    setBasics(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateExperience = (index: number, field: keyof Experience, value: string | string[]) => {
    setExperience(prev =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    )
  }

  const updateProjects = (index: number, field: keyof Project, value: string) => {
    setProjects(prev =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    )
  }

  const moveProject = (index: number, direction: "up" | "down") => {
    setProjects(prev => {
      const targetIndex = direction === "up" ? index - 1 : index + 1

      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev
      }

      const next = [...prev]
      const [project] = next.splice(index, 1)
      next.splice(targetIndex, 0, project)
      return next
    })
  }

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setEducation(prev =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    )
  }

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    setCertifications(prev =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    )
  }

  const updateTargeting = <Key extends keyof ResumeTargeting,>(
    field: Key,
    value: ResumeTargeting[Key]
  ) => {
    setTargeting(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <main className="editor">
      <SectionHeader title={activeSection.title} description={activeSection.description} />

      {tab === "basics" && (
        <section className="editor-section active">
          <div className="row2">
            <div className="field-group">
              <label>Full Name</label>
              <input
                value={basics.name}
                onChange={event => updateBasics("name", event.target.value)}
                placeholder="Anas Parekh"
              />
            </div>

            <div className="field-group">
              <label>Phone</label>
              <input
                value={basics.phone}
                onChange={event => updateBasics("phone", event.target.value)}
                placeholder="+91 99999 99999"
              />
            </div>
          </div>

          <div className="row2">
            <div className="field-group">
              <label>Email</label>
              <input
                value={basics.email}
                onChange={event => updateBasics("email", event.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="field-group">
              <label>Location</label>
              <input
                value={basics.location}
                onChange={event => updateBasics("location", event.target.value)}
                placeholder="Ahmedabad, India"
              />
            </div>
          </div>

          <div className="row2">
            <div className="field-group">
              <label>LinkedIn</label>
              <input
                value={basics.linkedin}
                onChange={event => updateBasics("linkedin", event.target.value)}
                placeholder="linkedin.com/in/yourname"
              />
            </div>

            <div className="field-group">
              <label>Portfolio</label>
              <input
                value={basics.portfolio}
                onChange={event => updateBasics("portfolio", event.target.value)}
                placeholder="yourportfolio.com"
              />
            </div>
          </div>
        </section>
      )}

      {tab === "targeting" && (
        <section className="editor-section active">
          <div className="mode-grid">
            {Object.values(resumeModes).map(mode => (
              <button
                key={mode.id}
                type="button"
                className={`mode-card ${targeting.mode === mode.id ? "active" : ""}`}
                onClick={() => updateTargeting("mode", mode.id)}
              >
                <span className="mode-title">{mode.label}</span>
                <span className="mode-target">{mode.target}</span>
                <span className="mode-tone">{mode.tone}</span>
              </button>
            ))}
          </div>

          <div className="row2">
            <div className="field-group">
              <label>Target Role</label>
              <input
                value={targeting.targetRole}
                onChange={event => updateTargeting("targetRole", event.target.value)}
                placeholder="iOS Engineer"
              />
            </div>

            <div className="field-group">
              <label>Company Type</label>
              <input
                value={targeting.companyType}
                onChange={event => updateTargeting("companyType", event.target.value)}
                placeholder="Product startup, enterprise team, consulting firm"
              />
            </div>
          </div>

          <div className="field-group">
            <label>Paste Job Description</label>
            <textarea
              rows={12}
              value={targeting.jobDescription}
              onChange={event => updateTargeting("jobDescription", event.target.value)}
              placeholder="Paste the full job description here. The engine will extract required skills, technologies, recruiter intent, seniority expectations, and domain emphasis."
            />
          </div>

          <div className="optimizer-actions">
            <button type="button" className="action-btn primary" onClick={onOptimizeResume}>
              Optimize Resume For This JD
            </button>

            <button type="button" className="action-btn" onClick={onGenerateSummary}>
              Generate Tailored Summary
            </button>

            <button type="button" className="action-btn" onClick={onRewriteAllBullets}>
              Rewrite Experience Bullets
            </button>
          </div>

          <div className="ats-callout">
            <div className="ats-callout-title">Ethical Optimization Guardrail</div>
            <p>
              The optimizer can reframe, prioritize, and strengthen real experience. It does not invent
              employers, education, certifications, projects, fake metrics, or unsupported seniority.
            </p>
          </div>

          {optimizationNotes.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-num">Last Optimization</span>
              </div>

              <div className="ats-list">
                {optimizationNotes.map(note => (
                  <div key={note} className="ats-list-item success">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="insight-grid">
            <InsightList
              title="Required Skills"
              items={jobAnalysis.requiredSkills}
              empty="Paste a JD to extract required skills."
            />
            <InsightList
              title="ATS Keywords"
              items={jobAnalysis.atsKeywords}
              empty="Keyword opportunities will appear here."
            />
            <InsightList
              title="Technologies"
              items={jobAnalysis.technologies}
              empty="No explicit technologies detected yet."
            />
            <InsightList
              title="Recruiter Intent"
              items={jobAnalysis.recruiterIntent}
              empty="Recruiter intent will appear here."
            />
            <InsightList
              title="Domain Emphasis"
              items={jobAnalysis.domainEmphasis}
              empty="Domain emphasis will appear here."
            />
            <div className="insight-block">
              <div className="insight-title">Seniority Expectations</div>
              <p className="insight-copy">{jobAnalysis.seniority}</p>
            </div>
          </div>
        </section>
      )}

      {tab === "objective" && (
        <section className="editor-section active">
          <div className="field-group">
            <label>Summary</label>
            <textarea
              rows={8}
              value={basics.objective}
              onChange={event => updateBasics("objective", event.target.value)}
              placeholder="Results-focused developer with experience shipping high-performance apps..."
            />
          </div>
        </section>
      )}

      {tab === "experience" && (
        <section className="editor-section active">
          {experience.map((item, index) => (
            <div key={`${item.company}-${index}`} className="card">
              <div className="card-header">
                <span className="card-num">Experience {index + 1}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => setExperience(prev => prev.filter((_, itemIndex) => itemIndex !== index))}
                >
                  Remove
                </button>
              </div>

              <div className="row2">
                <div className="field-group">
                  <label>Company</label>
                  <input
                    value={item.company}
                    onChange={event => updateExperience(index, "company", event.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label>Role</label>
                  <input
                    value={item.role}
                    onChange={event => updateExperience(index, "role", event.target.value)}
                  />
                </div>
              </div>

              <div className="row3">
                <div className="field-group">
                  <label>Location</label>
                  <input
                    value={item.location}
                    onChange={event => updateExperience(index, "location", event.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label>Start</label>
                  <input
                    value={item.start}
                    onChange={event => updateExperience(index, "start", event.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label>End</label>
                  <input
                    value={item.end}
                    onChange={event => updateExperience(index, "end", event.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label>Bullets, One Per Line</label>
                <textarea
                  rows={7}
                  value={item.bullets.join("\n")}
                  onChange={event =>
                    updateExperience(
                      index,
                      "bullets",
                      event.target.value.split("\n")
                    )
                  }
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            className="add-btn"
            onClick={() =>
              setExperience(prev => [
                ...prev,
                { company: "", role: "", location: "", start: "", end: "", bullets: [""] }
              ])
            }
          >
            + Add Experience
          </button>
        </section>
      )}

      {tab === "projects" && (
        <section className="editor-section active">
          {projects.map((item, index) => (
            <div key={`${item.name}-${index}`} className="card">
              <div className="card-header">
                <span className="card-num">Project {index + 1}</span>
                <div className="card-actions">
                  <button
                    type="button"
                    className="reorder-btn"
                    onClick={() => moveProject(index, "up")}
                    disabled={index === 0}
                  >
                    Move Up
                  </button>

                  <button
                    type="button"
                    className="reorder-btn"
                    onClick={() => moveProject(index, "down")}
                    disabled={index === projects.length - 1}
                  >
                    Move Down
                  </button>

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => setProjects(prev => prev.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label>Project Name</label>
                <input
                  value={item.name}
                  onChange={event => updateProjects(index, "name", event.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Description</label>
                <textarea
                  rows={4}
                  value={item.desc}
                  onChange={event => updateProjects(index, "desc", event.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Skills Used</label>
                <input
                  value={item.skills}
                  onChange={event => updateProjects(index, "skills", event.target.value)}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            className="add-btn"
            onClick={() => setProjects(prev => [...prev, { name: "", desc: "", skills: "" }])}
          >
            + Add Project
          </button>
        </section>
      )}

      {tab === "skills" && (
        <section className="editor-section active">
          <div className="field-group">
            <label>Skills, Separated By Commas</label>
            <textarea
              rows={8}
              value={basics.skills}
              onChange={event => updateBasics("skills", event.target.value)}
              placeholder="Swift, UIKit, React, TypeScript, Firebase"
            />
          </div>
        </section>
      )}

      {tab === "education" && (
        <section className="editor-section active">
          {education.map((item, index) => (
            <div key={`${item.degree}-${index}`} className="card">
              <div className="card-header">
                <span className="card-num">Education {index + 1}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => setEducation(prev => prev.filter((_, itemIndex) => itemIndex !== index))}
                >
                  Remove
                </button>
              </div>

              <div className="field-group">
                <label>Degree</label>
                <input
                  value={item.degree}
                  onChange={event => updateEducation(index, "degree", event.target.value)}
                />
              </div>

              <div className="field-group">
                <label>School / University</label>
                <input
                  value={item.school}
                  onChange={event => updateEducation(index, "school", event.target.value)}
                />
              </div>

              <div className="row2">
                <div className="field-group">
                  <label>Start</label>
                  <input
                    value={item.start}
                    onChange={event => updateEducation(index, "start", event.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label>End</label>
                  <input
                    value={item.end}
                    onChange={event => updateEducation(index, "end", event.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="add-btn"
            onClick={() => setEducation(prev => [...prev, { degree: "", school: "", start: "", end: "" }])}
          >
            + Add Education
          </button>
        </section>
      )}

      {tab === "certifications" && (
        <section className="editor-section active">
          {certifications.map((item, index) => (
            <div key={`${item.name}-${index}`} className="card">
              <div className="card-header">
                <span className="card-num">Certificate {index + 1}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() =>
                    setCertifications(prev => prev.filter((_, itemIndex) => itemIndex !== index))
                  }
                >
                  Remove
                </button>
              </div>

              <div className="field-group">
                <label>Certificate Name</label>
                <input
                  value={item.name}
                  onChange={event => updateCertification(index, "name", event.target.value)}
                />
              </div>

              <div className="row2">
                <div className="field-group">
                  <label>Issuer</label>
                  <input
                    value={item.issuer}
                    onChange={event => updateCertification(index, "issuer", event.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label>Date</label>
                  <input
                    value={item.date}
                    onChange={event => updateCertification(index, "date", event.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="add-btn"
            onClick={() => setCertifications(prev => [...prev, { name: "", issuer: "", date: "" }])}
          >
            + Add Certification
          </button>
        </section>
      )}

      {tab === "languages" && (
        <section className="editor-section active">
          <div className="field-group">
            <label>Languages, One Per Line</label>
            <textarea
              rows={8}
              value={basics.languages}
              onChange={event => updateBasics("languages", event.target.value)}
              placeholder={"English - Fluent\nHindi - Fluent"}
            />
          </div>
        </section>
      )}

      {tab === "ats" && (
        <section className="editor-section active">
          <div className="ats-hero">
            <div>
              <div className="ats-label">Dynamic ATS Score</div>
              <div className="ats-score">{atsReport.score}<span>/100</span></div>
            </div>

            <div>
              <div className="ats-label">Recruiter Score</div>
              <div className="ats-score recruiter">{atsReport.recruiterScore}<span>/100</span></div>
            </div>

            <div className="ats-score-copy">
              Scores update from the pasted JD, selected mode, keyword overlap, semantic fit, bullet quality,
              formatting safety, and recruiter readability.
            </div>
          </div>

          {importMeta && (
            <div className="ats-callout">
              <div className="ats-callout-title">Imported from {importMeta.fileName}</div>
              <p>The PDF data has been mapped into your current theme. Review the imported sections below for accuracy.</p>
              {importMeta.warnings.length > 0 && (
                <div className="ats-warning-list">
                  {importMeta.warnings.map(warning => (
                    <div key={warning} className="ats-warning-item">
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="ats-grid">
            {atsReport.categoryScores.map(category => (
              <div key={category.label} className="ats-metric-card">
                <div className="ats-metric-label">{category.label}</div>
                <div className="ats-metric-value">
                  {category.score}<span>/{category.maxScore}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="insight-grid ats-insights">
            <InsightList
              title="Matched Keywords"
              items={atsReport.matchedKeywords}
              empty="Paste a JD or add role-relevant language to create matches."
            />
            <InsightList
              title="Missing Skills"
              items={atsReport.missingSkills}
              empty="No major missing target keywords detected."
            />
            <InsightList
              title="Keyword Opportunities"
              items={atsReport.keywordOpportunities}
              empty="No keyword opportunities detected."
            />
            <div className="insight-block">
              <div className="insight-title">6-Second Recruiter Scan</div>
              <p className="insight-copy">{atsReport.recruiterScan.firstImpression}</p>
              <div className="shortlist-estimate">
                Shortlist probability estimate: {atsReport.recruiterScan.shortlistProbability}%
              </div>
            </div>
          </div>

          <div className="ats-columns">
            <div className="card">
              <div className="card-header">
                <span className="card-num">Strengths</span>
              </div>

              {atsReport.strengths.length > 0 ? (
                <div className="ats-list">
                  {atsReport.strengths.map(item => (
                    <div key={item} className="ats-list-item success">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ats-empty">Keep filling your resume and strengths will appear here.</p>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-num">Priority Fixes</span>
              </div>

              {atsReport.issues.length > 0 ? (
                <div className="ats-list">
                  {atsReport.issues.map(issue => (
                    <div key={`${issue.severity}-${issue.title}`} className={`ats-list-item ${issue.severity}`}>
                      <strong>{issue.title}</strong>
                      <span>{issue.detail}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ats-empty">No major ATS issues detected in the current draft.</p>
              )}
            </div>
          </div>

          <div className="ats-columns">
            <div className="card">
              <div className="card-header">
                <span className="card-num">Weak Bullet Detection</span>
              </div>

              {atsReport.weakBullets.length > 0 ? (
                <div className="ats-list">
                  {atsReport.weakBullets.map(item => (
                    <div key={`${item.section}-${item.bullet}`} className="ats-list-item medium">
                      <strong>{item.section}</strong>
                      <span>{item.reason}</span>
                      <span>{item.bullet}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ats-empty">No weak bullets detected in the current draft.</p>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-num">Technical Credibility</span>
              </div>

              <div className="ats-list">
                {atsReport.credibility.strengths.map(item => (
                  <div key={item} className="ats-list-item success">
                    {item}
                  </div>
                ))}

                {atsReport.credibility.warnings.map(item => (
                  <div key={item} className="ats-list-item medium">
                    {item}
                  </div>
                ))}

                {atsReport.credibility.strengths.length === 0 &&
                  atsReport.credibility.warnings.length === 0 && (
                    <p className="ats-empty">No credibility warnings detected.</p>
                  )}
              </div>
            </div>
          </div>

          <div className="ats-columns">
            <div className="card">
              <div className="card-header">
                <span className="card-num">Recruiter Concerns</span>
              </div>

              {atsReport.recruiterScan.concerns.length > 0 ||
              atsReport.recruiterScan.juniorSignals.length > 0 ? (
                <div className="ats-list">
                  {[...atsReport.recruiterScan.concerns, ...atsReport.recruiterScan.juniorSignals].map(item => (
                    <div key={item} className="ats-list-item medium">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ats-empty">No major recruiter concerns detected.</p>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-num">Next Improvements</span>
              </div>

              <div className="ats-list">
                {[...atsReport.suggestions, ...atsReport.recruiterScan.actions].map(item => (
                  <div key={item} className="ats-list-item low">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
