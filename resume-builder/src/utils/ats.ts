import type { ResumeState } from "../types/resume"

export interface AtsIssue {
  severity: "high" | "medium" | "low"
  title: string
  detail: string
}

export interface AtsCategoryScore {
  label: string
  score: number
  maxScore: number
}

export interface AtsReport {
  score: number
  categoryScores: AtsCategoryScore[]
  issues: AtsIssue[]
  strengths: string[]
}

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const phonePattern = /(\+\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?[\d\s-]{7,}/
const linkedInPattern = /linkedin\.com\/|linkedin/i
const sectionTitlePattern = /^(summary|professional summary|objective|experience|work experience|projects|education|skills|technical skills|certifications|languages)$/i
const datePattern =
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s.-]+\d{4}\b|\b\d{4}\b/gi

const splitSkills = (value: string) =>
  value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)

export function analyzeAts(resume: ResumeState): AtsReport {
  const issues: AtsIssue[] = []
  const strengths: string[] = []

  const skills = splitSkills(resume.basics.skills)
  const experienceEntries = resume.experience.filter(item => item.company || item.role)
  const projectEntries = resume.projects.filter(item => item.name)
  const educationEntries = resume.education.filter(item => item.degree || item.school)
  const certificationEntries = resume.certifications.filter(item => item.name)
  const bulletCount = experienceEntries.reduce(
    (count, item) => count + item.bullets.map(b => b.trim()).filter(Boolean).length,
    0
  )

  let contactScore = 0
  if (resume.basics.name.trim()) contactScore += 8
  if (emailPattern.test(resume.basics.email)) contactScore += 6
  if (phonePattern.test(resume.basics.phone)) contactScore += 6
  if (resume.basics.location.trim()) contactScore += 4
  if (linkedInPattern.test(resume.basics.linkedin)) contactScore += 3
  if (resume.basics.portfolio.trim()) contactScore += 3

  if (!resume.basics.name.trim()) {
    issues.push({
      severity: "high",
      title: "Missing full name",
      detail: "Your resume should begin with your full name so ATS and recruiters can identify it immediately."
    })
  }

  if (!emailPattern.test(resume.basics.email)) {
    issues.push({
      severity: "high",
      title: "Add a valid email address",
      detail: "A professional email is a core ATS field and should be easy to parse."
    })
  }

  if (!phonePattern.test(resume.basics.phone)) {
    issues.push({
      severity: "high",
      title: "Add a phone number",
      detail: "Many recruiters in Gulf markets still shortlist through direct calls or WhatsApp, so a readable phone number matters."
    })
  }

  let contentScore = 0
  if (resume.basics.objective.trim().length >= 80) contentScore += 8
  if (experienceEntries.length > 0) contentScore += 12
  if (educationEntries.length > 0) contentScore += 6
  if (skills.length >= 8) contentScore += 8
  if (projectEntries.length > 0 || certificationEntries.length > 0) contentScore += 6

  if (resume.basics.objective.trim().length < 60) {
    issues.push({
      severity: "medium",
      title: "Summary is too thin",
      detail: "A stronger summary helps ATS and recruiters understand your target role and core strengths faster."
    })
  }

  if (skills.length < 8) {
    issues.push({
      severity: "medium",
      title: "Expand your technical skills",
      detail: "ATS matching usually improves when you list a broader set of role-relevant skills in a plain comma-separated format."
    })
  }

  if (experienceEntries.length === 0) {
    issues.push({
      severity: "high",
      title: "No experience entries found",
      detail: "Add at least one work experience entry so the resume has a clear employment history."
    })
  }

  let impactScore = 0
  if (bulletCount >= 6) impactScore += 10

  const quantifiedBullets = experienceEntries.reduce(
    (count, item) =>
      count +
      item.bullets.filter(bullet => /\d|%|\+|x\b|million|kpi|users|downloads|revenue/i.test(bullet))
        .length,
    0
  )

  if (quantifiedBullets >= 3) impactScore += 10
  else if (quantifiedBullets >= 1) impactScore += 6

  if (experienceEntries.some(item => item.bullets.some(bullet => bullet.trim().length >= 40))) {
    impactScore += 5
  }

  if (quantifiedBullets < 2 && experienceEntries.length > 0) {
    issues.push({
      severity: "medium",
      title: "Add more measurable impact",
      detail: "Bullets with numbers, percentages, usage scale, or delivery metrics tend to rank better and feel more credible."
    })
  }

  let formatScore = 0
  const duplicateSectionTitles = [resume.basics.objective, resume.basics.skills, resume.basics.languages]
    .join(" ")
    .match(sectionTitlePattern)

  if (resume.basics.name.trim() && !sectionTitlePattern.test(resume.basics.name.trim())) {
    formatScore += 6
  }

  if (experienceEntries.every(item => item.start.trim() || item.end.trim())) {
    formatScore += 7
  } else if (experienceEntries.length > 0) {
    issues.push({
      severity: "medium",
      title: "Use consistent dates",
      detail: "Each role should show a start and end date, or Present, to make the timeline ATS-friendly."
    })
  }

  if (skills.every(skill => !/[|•]/.test(skill))) {
    formatScore += 6
  } else {
    issues.push({
      severity: "low",
      title: "Keep skills plain and simple",
      detail: "Comma-separated skills are safer for ATS parsing than stylized separators."
    })
  }

  if (!duplicateSectionTitles) {
    formatScore += 6
  }

  const longSummary = resume.basics.objective.trim().length > 320
  if (longSummary) {
    issues.push({
      severity: "low",
      title: "Summary may be too long",
      detail: "Aim for a concise summary that targets the role without becoming a full paragraph block."
    })
  }

  let gulfScore = 0
  if (resume.basics.location.trim()) gulfScore += 5
  if (resume.basics.phone.trim()) gulfScore += 5
  if (experienceEntries.length > 0) gulfScore += 5

  const hasTargetTitle = /developer|engineer|designer|manager|analyst|specialist|consultant/i.test(
    [resume.basics.objective, ...experienceEntries.map(item => item.role)].join(" ")
  )

  if (hasTargetTitle) gulfScore += 5
  else {
    issues.push({
      severity: "low",
      title: "Add a clearer target title",
      detail: "A role label like iOS Developer or Mobile App Developer helps Gulf recruiters understand your fit immediately."
    })
  }

  if (contactScore >= 24) {
    strengths.push("Core contact details are well covered.")
  }

  if (quantifiedBullets >= 3) {
    strengths.push("Experience bullets already include measurable impact.")
  }

  if (experienceEntries.length >= 2) {
    strengths.push("Your work history has enough depth for a solid ATS profile.")
  }

  if (skills.length >= 10) {
    strengths.push("Technical skills coverage is broad and keyword-friendly.")
  }

  const categoryScores: AtsCategoryScore[] = [
    { label: "Contact", score: contactScore, maxScore: 30 },
    { label: "Content", score: contentScore, maxScore: 40 },
    { label: "Impact", score: impactScore, maxScore: 25 },
    { label: "Format", score: formatScore, maxScore: 25 },
    { label: "Gulf Fit", score: gulfScore, maxScore: 20 }
  ]

  const totalScore = Math.round(
    (categoryScores.reduce((sum, category) => sum + category.score, 0) /
      categoryScores.reduce((sum, category) => sum + category.maxScore, 0)) *
      100
  )

  return {
    score: Math.max(0, Math.min(100, totalScore)),
    categoryScores,
    issues: issues.sort((a, b) => severityWeight(a.severity) - severityWeight(b.severity)),
    strengths
  }
}

function severityWeight(severity: AtsIssue["severity"]) {
  switch (severity) {
    case "high":
      return 0
    case "medium":
      return 1
    default:
      return 2
  }
}

export function estimateResumeLength(resume: ResumeState) {
  const sections = [
    resume.basics.objective,
    resume.basics.skills,
    resume.basics.languages,
    ...resume.experience.flatMap(item => [item.company, item.role, item.location, item.start, item.end, ...item.bullets]),
    ...resume.projects.flatMap(item => [item.name, item.desc, item.skills]),
    ...resume.education.flatMap(item => [item.degree, item.school, item.start, item.end]),
    ...resume.certifications.flatMap(item => [item.name, item.issuer, item.date])
  ]

  const wordCount = sections
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  const dateCount = (sections.join(" ").match(datePattern) ?? []).length

  return { wordCount, dateCount }
}
