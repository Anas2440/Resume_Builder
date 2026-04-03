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
        <div className="preview-dot r" />
        <div className="preview-dot y" />
        <div className="preview-dot g" />
        <span className="preview-title">Live Preview</span>
      </div>

      <div className="preview-scroll">
        <div ref={ref} className="resume-paper">
          <div className="resume-header">
            <div className="rh-name">{basics.name || "Your Name"}</div>

            <div className="rh-contact">
              {contacts.length ? (
                contacts.map(contact => (
                  <span key={contact} className="rh-contact-item">
                    <span className="rh-contact-dot" />
                    {contact}
                  </span>
                ))
              ) : (
                <span className="rh-contact-item">Add contact details in the editor</span>
              )}
            </div>
          </div>

          <div className="resume-body">
            {basics.objective && (
              <div className="rs-objective">
                <div className="rs-obj-text">{basics.objective}</div>
              </div>
            )}

            {experience.some(item => item.company || item.role) && (
              <section className="rs-section">
                <div className="rs-section-title">Experience</div>

                {experience.map((item, index) => {
                  if (!item.company && !item.role) {
                    return null
                  }

                  return (
                    <div key={`${item.company}-${index}`} className="rs-exp-item">
                      <div className="rs-exp-head">
                        <span className="rs-exp-company">{item.company || item.role}</span>
                        <span className="rs-exp-date">
                          {[item.start, item.end].filter(Boolean).join(" - ")}
                        </span>
                      </div>

                      <div className="rs-exp-role">
                        {[item.role, item.location].filter(Boolean).join(" · ")}
                      </div>

                      {item.bullets
                        .map(bullet => bullet.trim())
                        .filter(Boolean)
                        .map((bullet, bulletIndex) => (
                          <div key={`${bullet}-${bulletIndex}`} className="rs-bullet">
                            {bullet}
                          </div>
                        ))}
                    </div>
                  )
                })}
              </section>
            )}

            {projects.some(item => item.name) && (
              <section className="rs-section">
                <div className="rs-section-title">Projects &amp; Accomplishments</div>

                {projects.map((item, index) => {
                  if (!item.name) {
                    return null
                  }

                  return (
                    <div key={`${item.name}-${index}`} className="rs-proj-item">
                      <div className="rs-proj-name">{item.name}</div>
                      {item.desc && <div className="rs-proj-desc">{item.desc}</div>}
                      {item.skills && <div className="rs-proj-skills">{item.skills}</div>}
                    </div>
                  )
                })}
              </section>
            )}

            {skills.length > 0 && (
              <section className="rs-section">
                <div className="rs-section-title">Technical Skills</div>

                <div className="rs-skills-wrap">
                  {skills.map(skill => (
                    <span key={skill} className="rs-skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {education.some(item => item.degree || item.school) && (
              <section className="rs-section">
                <div className="rs-section-title">Education</div>

                {education.map((item, index) => {
                  if (!item.degree && !item.school) {
                    return null
                  }

                  return (
                    <div key={`${item.degree}-${index}`} className="rs-edu-item">
                      <div>
                        <div className="rs-edu-deg">{item.degree}</div>
                        <div className="rs-edu-school">{item.school}</div>
                      </div>

                      <div className="rs-edu-date">
                        {[item.start, item.end].filter(Boolean).join(" - ")}
                      </div>
                    </div>
                  )
                })}
              </section>
            )}

            {certifications.some(item => item.name) && (
              <section className="rs-section">
                <div className="rs-section-title">Certifications</div>

                {certifications.map((item, index) => {
                  if (!item.name) {
                    return null
                  }

                  return (
                    <div key={`${item.name}-${index}`} className="rs-cert-item">
                      <div>
                        <div className="rs-cert-name">{item.name}</div>
                        <div className="rs-cert-sub">{item.issuer}</div>
                      </div>

                      <div className="rs-cert-date">{item.date}</div>
                    </div>
                  )
                })}
              </section>
            )}

            {languages.length > 0 && (
              <section className="rs-section">
                <div className="rs-section-title">Languages</div>

                <div className="rs-lang-wrap">
                  {languages.map(language => (
                    <span key={language} className="rs-lang-item">
                      {language}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
})

export default Preview
