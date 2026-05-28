interface Props {
  tab: string
  setTab: (tab: string) => void
  resumes: Array<{ id: string; name: string }>
  activeResumeId: string
  onSelectResume: (resumeId: string) => void
  onCreateResume: () => void
  onDuplicateResume: () => void
  onRenameResume: () => void
  onDeleteResume: () => void
  onExportPdf: () => void
  onCopyAts: () => void
  onImportPdf: () => void
  onImportPdfAsNew: () => void
}

const items = [
  { id: "basics", label: "Personal" },
  { id: "targeting", label: "AI Targeting" },
  { id: "objective", label: "Summary" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "certifications", label: "Certificates" },
  { id: "languages", label: "Languages" },
  { id: "ats", label: "ATS Review" }
]

export default function Sidebar({
  tab,
  setTab,
  resumes,
  activeResumeId,
  onSelectResume,
  onCreateResume,
  onDuplicateResume,
  onRenameResume,
  onDeleteResume,
  onExportPdf,
  onCopyAts,
  onImportPdf,
  onImportPdfAsNew
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        Re<span>·</span>sume
      </div>

      <div className="sidebar-tagline">AI Resume Optimization</div>

      <div className="nav-label">Resumes</div>

      <div className="resume-switcher">
        <select
          className="resume-select"
          value={activeResumeId}
          onChange={event => onSelectResume(event.target.value)}
        >
          {resumes.map(item => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <div className="resume-actions">
          <button type="button" className="mini-action-btn" onClick={onCreateResume}>
            + New
          </button>

          <button type="button" className="mini-action-btn" onClick={onDuplicateResume}>
            From Current
          </button>

          <button type="button" className="mini-action-btn" onClick={onRenameResume}>
            Rename
          </button>

          <button type="button" className="mini-action-btn danger" onClick={onDeleteResume}>
            Delete
          </button>
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="nav-label">Editor</div>

      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className={`nav-item ${tab === item.id ? "active" : ""}`}
          onClick={() => setTab(item.id)}
        >
          <span>{item.label}</span>
        </button>
      ))}

      <div className="sidebar-divider" />

      <div className="nav-label">Export</div>

      <button type="button" className="export-btn secondary" onClick={onImportPdf}>
        Import Into Current
      </button>

      <button type="button" className="export-btn secondary" onClick={onImportPdfAsNew}>
        Import As New
      </button>

      <button type="button" className="export-btn primary" onClick={onExportPdf}>
        Print / Save ATS PDF
      </button>

      <button type="button" className="export-btn secondary" onClick={onCopyAts}>
        Copy ATS Text
      </button>

      <p className="tip-text">
        The editor auto-saves locally. Use browser Save as PDF to preserve selectable ATS-readable text.
      </p>
    </aside>
  )
}
