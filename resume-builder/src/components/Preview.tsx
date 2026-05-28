import { forwardRef } from "react"
import {
  type Basics,
  type Experience,
  type Project,
  type Education,
  type Certification
} from "../types/resume"

interface Props {
  basics: Basics
  experience: Experience[]
  projects: Project[]
  education: Education[]
  certifications: Certification[]
}

const splitCommaValues = (value: string) =>
  value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)

const splitLineValues = (value: string) =>
  value
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean)

const Preview = forwardRef<HTMLDivElement, Props>(function Preview(
  { basics, experience, projects, education, certifications },
  ref
) {
  const contacts = [
    basics.email,
    basics.phone,
    basics.location,
    basics.linkedin,
    basics.portfolio
  ].filter(Boolean)

  const skills = splitCommaValues(basics.skills)
  const languages = splitLineValues(basics.languages)

  return (
    <aside className="preview-panel">
      <div className="preview-topbar">
        <span className="preview-title">ATS Resume Preview</span>
      </div>

      <div className="preview-scroll">
        <div ref={ref} className="resume-paper">
          <div className="resume-header">
            <h1 className="rh-name">{basics.name || "Your Name"}</h1>

            <div className="rh-contact">
              {contacts.length ? (
                contacts.join(" | ")
              ) : (
                <span className="rh-contact-item">Add contact details in the editor</span>
              )}
            </div>
          </div>

          <div className="resume-body">
            {basics.objective && (
              <section className="rs-section">
                <h2 className="rs-section-title">Professional Summary</h2>
                <p className="rs-obj-text">{basics.objective}</p>
              </section>
            )}

            {experience.some(item => item.company || item.role) && (
              <section className="rs-section">
                <h2 className="rs-section-title">Experience</h2>

                {experience.map((item, index) => {
                  if (!item.company && !item.role) {
                    return null
                  }

                  return (
                    <div key={`${item.company}-${index}`} className="rs-exp-item">
                      <h3 className="rs-exp-company">{item.company || item.role}</h3>
                      <div className="rs-exp-meta">
                        {[item.role, item.location, [item.start, item.end].filter(Boolean).join(" - ")]
                          .filter(Boolean)
                          .join(" | ")}
                      </div>

                      <ul className="rs-bullet-list">
                        {item.bullets
                          .map(bullet => bullet.trim())
                          .filter(Boolean)
                          .map((bullet, bulletIndex) => (
                            <li key={`${bullet}-${bulletIndex}`} className="rs-bullet">
                              {bullet}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )
                })}
              </section>
            )}

            {projects.some(item => item.name) && (
              <section className="rs-section">
                <h2 className="rs-section-title">Projects</h2>

                {projects.map((item, index) => {
                  if (!item.name) {
                    return null
                  }

                  return (
                    <div key={`${item.name}-${index}`} className="rs-proj-item">
                      <h3 className="rs-proj-name">{item.name}</h3>
                      {item.desc && <p className="rs-proj-desc">{item.desc}</p>}
                      {item.skills && <p className="rs-proj-skills">Technologies: {item.skills}</p>}
                    </div>
                  )
                })}
              </section>
            )}

            {skills.length > 0 && (
              <section className="rs-section">
                <h2 className="rs-section-title">Technical Skills</h2>
                <p className="rs-skills-text">{skills.join(", ")}</p>
              </section>
            )}

            {education.some(item => item.degree || item.school) && (
              <section className="rs-section">
                <h2 className="rs-section-title">Education</h2>

                {education.map((item, index) => {
                  if (!item.degree && !item.school) {
                    return null
                  }

                  return (
                    <div key={`${item.degree}-${index}`} className="rs-edu-item">
                      <h3 className="rs-edu-deg">{item.degree}</h3>
                      <p className="rs-edu-school">
                        {[item.school, [item.start, item.end].filter(Boolean).join(" - ")]
                          .filter(Boolean)
                          .join(" | ")}
                      </p>
                    </div>
                  )
                })}
              </section>
            )}

            {certifications.some(item => item.name) && (
              <section className="rs-section">
                <h2 className="rs-section-title">Certifications</h2>

                {certifications.map((item, index) => {
                  if (!item.name) {
                    return null
                  }

                  return (
                    <div key={`${item.name}-${index}`} className="rs-cert-item">
                      <h3 className="rs-cert-name">{item.name}</h3>
                      <p className="rs-cert-sub">
                        {[item.issuer, item.date].filter(Boolean).join(" | ")}
                      </p>
                    </div>
                  )
                })}
              </section>
            )}

            {languages.length > 0 && (
              <section className="rs-section">
                <h2 className="rs-section-title">Languages</h2>
                <p className="rs-skills-text">{languages.join(", ")}</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
})

export default Preview
