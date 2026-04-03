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
  { id: "basics", label: "Personal", icon: "👤" },
  { id: "objective", label: "Summary", icon: "💡" },
  { id: "experience", label: "Experience", icon: "💼" },
  { id: "projects", label: "Projects", icon: "🚀" },
  { id: "skills", label: "Skills", icon: "⚡" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "certifications", label: "Certificates", icon: "🏅" },
  { id: "languages", label: "Languages", icon: "🌐" },
  { id: "ats", label: "ATS Review", icon: "📈" }
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

      <div className="sidebar-tagline">ATS-Friendly Builder</div>

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

      <div className="nav-items-grid">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="nav-label">Export</div>

      <div className="sidebar-actions-grid">
        <button type="button" className="export-btn secondary" onClick={onImportPdf}>
          📄 Import Into Current
        </button>

        <button type="button" className="export-btn secondary" onClick={onImportPdfAsNew}>
          🗂 Import As New
        </button>

        <button type="button" className="export-btn primary" onClick={onExportPdf}>
          ⬇ Export / Print PDF
        </button>

        <button type="button" className="export-btn secondary" onClick={onCopyAts}>
          📋 Copy ATS Text
        </button>
      </div>

      <p className="tip-text">
        The editor auto-saves locally. Use the PDF button to open your browser print dialog and save the
        resume as a PDF.
      </p>
    </aside>
  )
}
