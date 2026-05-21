import { useEffect, useRef, useState, type ChangeEvent } from "react"
import Sidebar from "./components/Sidebar"
import Editor from "./components/Editor"
import Preview from "./components/Preview"
import {
  initialBasics,
  initialExperience,
  initialProjects,
  initialEducation,
  initialCertifications,
  initialTargeting
} from "./data/initialData"
import {
  type Basics,
  type Experience,
  type Project,
  type Education,
  type Certification,
  type ResumeState,
  type ResumeTargeting
} from "./types/resume"
import { analyzeAts } from "./utils/ats"
import { importResumeFromPdf } from "./utils/importResume"
import {
  analyzeJobDescription,
  generateTailoredSummary,
  optimizeResumeForJob,
  rewriteBulletForTarget
} from "./utils/resumeAi"

const LEGACY_STORAGE_KEY = "resume-builder-data-v2"
const STORAGE_KEY = "resume-builder-data-v3"

interface ResumeDocument {
  id: string
  name: string
  data: ResumeState
  updatedAt: string
}

interface ResumeWorkspace {
  activeResumeId: string
  resumes: ResumeDocument[]
}

type ImportMode = "replace-current" | "create-new"

function normalizeResumeState(saved?: Partial<ResumeState>): ResumeState {
  return {
    basics: { ...initialBasics, ...saved?.basics },
    experience: saved?.experience?.length ? saved.experience : initialExperience,
    projects: saved?.projects?.length ? saved.projects : initialProjects,
    education: saved?.education?.length ? saved.education : initialEducation,
    certifications: saved?.certifications?.length ? saved.certifications : initialCertifications,
    targeting: { ...initialTargeting, ...saved?.targeting }
  }
}

function getInitialResumeState(): ResumeState {
  if (typeof window === "undefined") {
    return normalizeResumeState()
  }

  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)

  if (!raw) {
    return normalizeResumeState()
  }

  try {
    const saved = JSON.parse(raw) as Partial<ResumeState>

    return normalizeResumeState(saved)
  } catch (error) {
    console.error("Failed to load saved resume data", error)

    return normalizeResumeState()
  }
}

function cloneResumeState(state: ResumeState): ResumeState {
  return JSON.parse(JSON.stringify(state)) as ResumeState
}

function createResumeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `resume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createResumeDocument(name: string, data: ResumeState): ResumeDocument {
  return {
    id: createResumeId(),
    name,
    data: cloneResumeState(data),
    updatedAt: new Date().toISOString()
  }
}

function getInitialWorkspace(): ResumeWorkspace {
  if (typeof window === "undefined") {
    const defaultResume = getInitialResumeState()
    const defaultDocument = createResumeDocument("Primary Resume", defaultResume)

    return {
      activeResumeId: defaultDocument.id,
      resumes: [defaultDocument]
    }
  }

  const workspaceRaw = window.localStorage.getItem(STORAGE_KEY)

  if (workspaceRaw) {
    try {
      const saved = JSON.parse(workspaceRaw) as ResumeWorkspace
      if (saved.resumes?.length) {
        const resumes = saved.resumes.map(item => ({
          ...item,
          data: normalizeResumeState(item.data)
        }))
        const activeResumeId = resumes.some(item => item.id === saved.activeResumeId)
          ? saved.activeResumeId
          : resumes[0].id

        return {
          activeResumeId,
          resumes
        }
      }
    } catch (error) {
      console.error("Failed to load saved resume workspace", error)
    }
  }

  const legacyResume = getInitialResumeState()
  const migratedDocument = createResumeDocument("Primary Resume", legacyResume)

  return {
    activeResumeId: migratedDocument.id,
    resumes: [migratedDocument]
  }
}

function buildAtsText({
  basics,
  experience,
  projects,
  education,
  certifications
}: ResumeState) {
  const lines: string[] = []

  if (basics.name) {
    lines.push(basics.name)
  }

  const contactLine = [
    basics.email,
    basics.phone,
    basics.location,
    basics.linkedin,
    basics.portfolio
  ].filter(Boolean)

  if (contactLine.length) {
    lines.push(contactLine.join(" | "))
  }

  if (basics.objective) {
    lines.push("", "PROFESSIONAL SUMMARY", basics.objective)
  }

  if (experience.some(item => item.company || item.role)) {
    lines.push("", "EXPERIENCE")

    experience.forEach(item => {
      if (!item.company && !item.role) {
        return
      }

      lines.push(item.company || item.role)
      lines.push(
        [item.role, item.location, [item.start, item.end].filter(Boolean).join(" - ")]
          .filter(Boolean)
          .join(" | ")
      )

      item.bullets
        .map(bullet => bullet.trim())
        .filter(Boolean)
        .forEach(bullet => lines.push(`- ${bullet}`))

      lines.push("")
    })
  }

  if (projects.some(item => item.name)) {
    lines.push("PROJECTS")

    projects.forEach(item => {
      if (!item.name) {
        return
      }

      lines.push(item.name)

      if (item.desc) {
        lines.push(item.desc)
      }

      if (item.skills) {
        lines.push(`Skills: ${item.skills}`)
      }

      lines.push("")
    })
  }

  if (basics.skills) {
    lines.push("TECHNICAL SKILLS", basics.skills, "")
  }

  if (education.some(item => item.degree || item.school)) {
    lines.push("EDUCATION")

    education.forEach(item => {
      if (!item.degree && !item.school) {
        return
      }

      lines.push(
        [item.degree, item.school, [item.start, item.end].filter(Boolean).join(" - ")]
          .filter(Boolean)
          .join(" | ")
      )
    })

    lines.push("")
  }

  if (certifications.some(item => item.name)) {
    lines.push("CERTIFICATIONS")

    certifications.forEach(item => {
      if (!item.name) {
        return
      }

      lines.push(
        [item.name, item.issuer && ` - ${item.issuer}`, item.date && ` (${item.date})`]
          .filter(Boolean)
          .join("")
      )
    })

    lines.push("")
  }

  if (basics.languages) {
    lines.push("LANGUAGES", basics.languages)
  }

  return lines.join("\n").trim()
}

function createBlankResumeState(): ResumeState {
  return {
    basics: {
      name: "",
      phone: "",
      email: "",
      linkedin: "",
      portfolio: "",
      location: "",
      objective: "",
      skills: "",
      languages: ""
    },
    experience: [{ company: "", role: "", location: "", start: "", end: "", bullets: [""] }],
    projects: [{ name: "", desc: "", skills: "" }],
    education: [{ degree: "", school: "", start: "", end: "" }],
    certifications: [{ name: "", issuer: "", date: "" }],
    targeting: { ...initialTargeting }
  }
}

function getPrimaryRole(resume: ResumeState) {
  const experienceRole = resume.experience.find(item => item.role.trim())?.role.trim()

  if (experienceRole) {
    return experienceRole
  }

  const summaryMatch = resume.basics.objective.match(
    /\b(iOS Developer|Mobile App Developer|Software Engineer|Frontend Developer|Backend Developer|Full Stack Developer|Designer|Project Manager|QA Engineer|Data Analyst)\b/i
  )

  return summaryMatch?.[0] ?? ""
}

function slugTitleCase(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
}

function buildSuggestedResumeName(
  resume: ResumeState,
  options?: {
    fallback?: string
    suffix?: string
  }
) {
  const fallback = options?.fallback ?? "New Resume"
  const name = slugTitleCase(resume.basics.name)
  const role = slugTitleCase(getPrimaryRole(resume))
  const suffix = slugTitleCase(options?.suffix ?? "")

  const parts = [name, role, suffix].filter(Boolean)
  return parts.length ? parts.join(" - ") : fallback
}

export default function App() {
  const previewRef = useRef<HTMLDivElement | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const importModeRef = useRef<ImportMode>("replace-current")
  const [tab, setTab] = useState<string>("basics")
  const [workspace, setWorkspace] = useState<ResumeWorkspace>(() => getInitialWorkspace())
  const initialActiveResume =
    workspace.resumes.find(doc => doc.id === workspace.activeResumeId) ?? workspace.resumes[0]
  const [activeResumeId, setActiveResumeId] = useState<string>(workspace.activeResumeId)
  const [basics, setBasics] = useState<Basics>(initialActiveResume.data.basics)
  const [experience, setExperience] = useState<Experience[]>(initialActiveResume.data.experience)
  const [projects, setProjects] = useState<Project[]>(initialActiveResume.data.projects)
  const [education, setEducation] = useState<Education[]>(initialActiveResume.data.education)
  const [certifications, setCertifications] = useState<Certification[]>(
    initialActiveResume.data.certifications
  )
  const [targeting, setTargeting] = useState<ResumeTargeting>(initialActiveResume.data.targeting)
  const [importMeta, setImportMeta] = useState<{ fileName: string; warnings: string[] } | null>(null)
  const [optimizationNotes, setOptimizationNotes] = useState<string[]>([])

  const currentResumeState: ResumeState = {
    basics,
    experience,
    projects,
    education,
    certifications,
    targeting
  }

  const atsReport = analyzeAts(currentResumeState)

  const resumeOptions = workspace.resumes.map(item => ({
    id: item.id,
    name: item.name
  }))

  useEffect(() => {
    const payload: ResumeState = {
      basics,
      experience,
      projects,
      education,
      certifications,
      targeting
    }

    setWorkspace(prev => ({
      ...prev,
      activeResumeId,
      resumes: prev.resumes.map(item =>
        item.id === activeResumeId
          ? {
              ...item,
              data: cloneResumeState(payload),
              updatedAt: new Date().toISOString()
            }
          : item
      )
    }))
  }, [activeResumeId, basics, experience, projects, education, certifications, targeting])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
  }, [workspace])

  const loadResumeIntoEditor = (resume: ResumeState) => {
    const normalized = normalizeResumeState(resume)

    setBasics(cloneResumeState(normalized).basics)
    setExperience(cloneResumeState(normalized).experience)
    setProjects(cloneResumeState(normalized).projects)
    setEducation(cloneResumeState(normalized).education)
    setCertifications(cloneResumeState(normalized).certifications)
    setTargeting(cloneResumeState(normalized).targeting)
  }

  const handleSelectResume = (resumeId: string) => {
    const selected = workspace.resumes.find(item => item.id === resumeId)

    if (!selected) {
      return
    }

    setActiveResumeId(selected.id)
    loadResumeIntoEditor(selected.data)
    setImportMeta(null)
    setOptimizationNotes([])
    setTab("basics")
  }

  const handleCreateResume = () => {
    const name = window.prompt("Name for the new resume?", "New Resume")?.trim()

    if (!name) {
      return
    }

    const blankResume = createBlankResumeState()
    const newDocument = createResumeDocument(name, blankResume)

    setWorkspace(prev => ({
      activeResumeId: newDocument.id,
      resumes: [...prev.resumes, newDocument]
    }))
    setActiveResumeId(newDocument.id)
    loadResumeIntoEditor(blankResume)
    setImportMeta(null)
    setOptimizationNotes([])
    setTab("basics")
  }

  const handleDuplicateResume = () => {
    const currentDocument = workspace.resumes.find(item => item.id === activeResumeId)

    if (!currentDocument) {
      return
    }

    const nextName =
      window.prompt(
        "Name for the new copy?",
        buildSuggestedResumeName(currentResumeState, { fallback: `${currentDocument.name} Copy`, suffix: "v2" })
      )?.trim() ?? ""

    if (!nextName) {
      return
    }

    const duplicate = createResumeDocument(nextName, currentResumeState)

    setWorkspace(prev => ({
      activeResumeId: duplicate.id,
      resumes: [...prev.resumes, duplicate]
    }))
    setActiveResumeId(duplicate.id)
    loadResumeIntoEditor(duplicate.data)
    setImportMeta(null)
    setOptimizationNotes([])
    setTab("basics")
  }

  const handleRenameResume = () => {
    const currentDocument = workspace.resumes.find(item => item.id === activeResumeId)

    if (!currentDocument) {
      return
    }

    const nextName = window.prompt("Rename this resume", currentDocument.name)?.trim()

    if (!nextName) {
      return
    }

    setWorkspace(prev => ({
      ...prev,
      resumes: prev.resumes.map(item =>
        item.id === activeResumeId
          ? {
              ...item,
              name: nextName
            }
          : item
      )
    }))
  }

  const handleDeleteResume = () => {
    const currentDocument = workspace.resumes.find(item => item.id === activeResumeId)

    if (!currentDocument) {
      return
    }

    if (workspace.resumes.length === 1) {
      window.alert("Keep at least one saved resume. You can rename it or replace its content instead.")
      return
    }

    const confirmed = window.confirm(`Delete "${currentDocument.name}"? This will remove it from local storage.`)

    if (!confirmed) {
      return
    }

    const remaining = workspace.resumes.filter(item => item.id !== activeResumeId)
    const nextActive = remaining[0]

    setWorkspace({
      activeResumeId: nextActive.id,
      resumes: remaining
    })
    setActiveResumeId(nextActive.id)
    loadResumeIntoEditor(nextActive.data)
    setImportMeta(null)
    setOptimizationNotes([])
    setTab("basics")
  }

  const handleExportPdf = () => {
    const originalTitle = document.title
    const safeName = buildSuggestedResumeName(currentResumeState, { fallback: "ATS Resume" })
    document.title = safeName
    window.print()
    window.setTimeout(() => {
      document.title = originalTitle
    }, 250)
  }

  const handleCopyAts = async () => {
    const atsText = buildAtsText(currentResumeState)

    try {
      await navigator.clipboard.writeText(atsText)
      window.alert("ATS-friendly resume text copied to your clipboard.")
    } catch {
      window.alert("Clipboard access was blocked. Please try again in a secure browser tab.")
    }
  }

  const handleImportPdf = () => {
    importModeRef.current = "replace-current"
    importInputRef.current?.click()
  }

  const handleImportPdfAsNew = () => {
    importModeRef.current = "create-new"
    importInputRef.current?.click()
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const blankResume = createBlankResumeState()
      const imported = await importResumeFromPdf(file, blankResume)
      const importedResume: ResumeState = {
        basics: imported.resume.basics,
        experience: imported.resume.experience,
        projects: imported.resume.projects,
        education: imported.resume.education,
        certifications:
          imported.resume.certifications.length > 0
            ? imported.resume.certifications
            : blankResume.certifications,
        targeting
      }

      if (importModeRef.current === "create-new") {
        const suggestedName = buildSuggestedResumeName(importedResume, {
          fallback: file.name.replace(/\.pdf$/i, ""),
          suffix: "Imported"
        })
        const chosenName =
          window.prompt("Name for the imported resume?", suggestedName)?.trim() ?? ""

        if (!chosenName) {
          return
        }

        const newDocument = createResumeDocument(chosenName, importedResume)

        setWorkspace(prev => ({
          activeResumeId: newDocument.id,
          resumes: [...prev.resumes, newDocument]
        }))
        setActiveResumeId(newDocument.id)
      }

      loadResumeIntoEditor(importedResume)
      setImportMeta({
        fileName: file.name,
        warnings: imported.warnings
      })
      setOptimizationNotes([])
      setTab("ats")
    } catch (error) {
      console.error("Failed to import resume PDF", error)
      window.alert("Resume import failed. Please try a text-based PDF with selectable text.")
    } finally {
      event.target.value = ""
    }
  }

  const handleOptimizeResume = () => {
    const result = optimizeResumeForJob(currentResumeState, targeting)

    setBasics(result.resume.basics)
    setExperience(result.resume.experience)
    setProjects(result.resume.projects)
    setEducation(result.resume.education)
    setCertifications(result.resume.certifications)
    setTargeting(result.resume.targeting)
    setOptimizationNotes([...result.changes, ...result.safeguards])
    setTab("ats")
  }

  const handleGenerateSummary = () => {
    const analysis = analyzeJobDescription(targeting.jobDescription, targeting.mode)
    const objective = generateTailoredSummary(currentResumeState, analysis, targeting)

    setBasics(prev => ({
      ...prev,
      objective
    }))
    setOptimizationNotes(["Generated a tailored professional summary from the selected mode and pasted job description."])
    setTab("objective")
  }

  const handleRewriteAllBullets = () => {
    const analysis = analyzeJobDescription(targeting.jobDescription, targeting.mode)

    setExperience(prev =>
      prev.map(item => ({
        ...item,
        bullets: item.bullets.map(bullet => rewriteBulletForTarget(bullet, analysis, targeting.mode))
      }))
    )
    setOptimizationNotes([
      "Rewrote experience bullets with stronger action verbs, technical scope, and truthful outcome language.",
      "No new companies, fake metrics, or unlisted projects were added."
    ])
    setTab("experience")
  }

  return (
    <div className="app">
      <input
        ref={importInputRef}
        type="file"
        accept="application/pdf"
        className="sr-only-input"
        onChange={handleImportFile}
      />

      <Sidebar
        tab={tab}
        setTab={setTab}
        resumes={resumeOptions}
        activeResumeId={activeResumeId}
        onSelectResume={handleSelectResume}
        onCreateResume={handleCreateResume}
        onDuplicateResume={handleDuplicateResume}
        onRenameResume={handleRenameResume}
        onDeleteResume={handleDeleteResume}
        onExportPdf={handleExportPdf}
        onCopyAts={handleCopyAts}
        onImportPdf={handleImportPdf}
        onImportPdfAsNew={handleImportPdfAsNew}
      />

      <Editor
        tab={tab}
        basics={basics}
        setBasics={setBasics}
        experience={experience}
        setExperience={setExperience}
        projects={projects}
        setProjects={setProjects}
        education={education}
        setEducation={setEducation}
        certifications={certifications}
        setCertifications={setCertifications}
        targeting={targeting}
        setTargeting={setTargeting}
        atsReport={atsReport}
        importMeta={importMeta}
        optimizationNotes={optimizationNotes}
        onOptimizeResume={handleOptimizeResume}
        onGenerateSummary={handleGenerateSummary}
        onRewriteAllBullets={handleRewriteAllBullets}
      />

      <Preview
        ref={previewRef}
        basics={basics}
        experience={experience}
        projects={projects}
        education={education}
        certifications={certifications}
      />
    </div>
  )
}
