import type { ResumeState } from "../types/resume"
import {
  analyzeJobDescription,
  analyzeTechnicalCredibility,
  generateRecruiterScan,
  getKeywordMatches,
  getResumeText,
  hasTerm
} from "./resumeAi"

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

export interface WeakBullet {
  section: string
  bullet: string
  reason: string
}

export interface AtsReport {
  score: number
  recruiterScore: number
  categoryScores: AtsCategoryScore[]
  issues: AtsIssue[]
  strengths: string[]
  missingSkills: string[]
  keywordOpportunities: string[]
  weakBullets: WeakBullet[]
  suggestions: string[]
  matchedKeywords: string[]
  jobAnalysis: ReturnType<typeof analyzeJobDescription>
  recruiterScan: ReturnType<typeof generateRecruiterScan>
  credibility: ReturnType<typeof analyzeTechnicalCredibility>
}

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const phonePattern = /(\+\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?[\d\s-]{7,}/
const linkedInPattern = /linkedin\.com\/|linkedin/i
const sectionTitlePattern = /^(summary|professional summary|objective|experience|work experience|projects|education|skills|technical skills|certifications|languages)$/i
const datePattern =
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s.-]+\d{4}\b|\b\d{4}\b/gi
const weakVerbPattern = /^(worked on|responsible for|helped with|involved in|handled|did|made|used)\b/i
const strongVerbPattern =
  /^(built|delivered|integrated|implemented|optimized|developed|collaborated|launched|improved|designed|debugged|validated|maintained|created|owned)\b/i

const splitSkills = (value: string) =>
  value
    .split(/[,|•·]/)
    .map(item => item.trim())
    .filter(Boolean)

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

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

function scoreKeywordMatch(resume: ResumeState, keywords: string[]) {
  const keywordMatches = getKeywordMatches(resume, keywords)
  return {
    ...keywordMatches,
    score: Math.round(keywordMatches.rate * 25)
  }
}

function scoreTechnicalOverlap(resume: ResumeState, technologies: string[]) {
  const techMatches = getKeywordMatches(resume, technologies)
  const fallbackRate = technologies.length ? techMatches.rate : 0.75

  return {
    ...techMatches,
    score: Math.round(fallbackRate * 20)
  }
}

function getWeakBullets(resume: ResumeState): WeakBullet[] {
  return resume.experience.flatMap(item =>
    item.bullets
      .map(bullet => bullet.trim())
      .filter(Boolean)
      .map(bullet => {
        if (weakVerbPattern.test(bullet)) {
          return {
            section: item.role || item.company || "Experience",
            bullet,
            reason: "Starts with passive or junior-sounding language."
          }
        }

        if (bullet.length < 55) {
          return {
            section: item.role || item.company || "Experience",
            bullet,
            reason: "Too short to show context, scope, or impact."
          }
        }

        if (!strongVerbPattern.test(bullet)) {
          return {
            section: item.role || item.company || "Experience",
            bullet,
            reason: "Could lead with a stronger action verb."
          }
        }

        return null
      })
      .filter((item): item is WeakBullet => Boolean(item))
  )
}

export function analyzeAts(resume: ResumeState): AtsReport {
  const issues: AtsIssue[] = []
  const strengths: string[] = []
  const suggestions: string[] = []
  const analysis = analyzeJobDescription(resume.targeting.jobDescription, resume.targeting.mode)
  const skills = splitSkills(resume.basics.skills)
  const resumeText = getResumeText(resume)
  const experienceEntries = resume.experience.filter(item => item.company || item.role)
  const projectEntries = resume.projects.filter(item => item.name)
  const educationEntries = resume.education.filter(item => item.degree || item.school)
  const certificationEntries = resume.certifications.filter(item => item.name)
  const bullets = experienceEntries.flatMap(item => item.bullets.map(bullet => bullet.trim()).filter(Boolean))
  const weakBullets = getWeakBullets(resume)
  const keywordMatch = scoreKeywordMatch(resume, analysis.atsKeywords)
  const technicalOverlap = scoreTechnicalOverlap(resume, analysis.technologies)

  let formatScore = 0
  if (resume.basics.name.trim() && !sectionTitlePattern.test(resume.basics.name.trim())) formatScore += 4
  if (emailPattern.test(resume.basics.email)) formatScore += 4
  if (phonePattern.test(resume.basics.phone)) formatScore += 3
  if (resume.basics.location.trim()) formatScore += 2
  if (linkedInPattern.test(resume.basics.linkedin) || resume.basics.portfolio.trim()) formatScore += 2
  if (experienceEntries.every(item => item.start.trim() || item.end.trim())) formatScore += 3
  if (skills.every(skill => !/[|•]/.test(skill))) formatScore += 2

  let sectionQualityScore = 0
  if (resume.basics.objective.trim().length >= 90) sectionQualityScore += 5
  if (experienceEntries.length > 0) sectionQualityScore += 5
  if (skills.length >= 10) sectionQualityScore += 4
  if (projectEntries.length > 0) sectionQualityScore += 3
  if (educationEntries.length > 0) sectionQualityScore += 2
  if (certificationEntries.length > 0) sectionQualityScore += 1

  const quantifiedBullets = bullets.filter(bullet =>
    /\d|%|\+|x\b|million|kpi|users|downloads|revenue|latency|load time/i.test(bullet)
  )
  const actionVerbBullets = bullets.filter(bullet => strongVerbPattern.test(bullet))
  let impactScore = 0
  if (bullets.length >= 6) impactScore += 5
  if (actionVerbBullets.length >= Math.max(1, Math.ceil(bullets.length * 0.55))) impactScore += 5
  if (quantifiedBullets.length >= 3) impactScore += 5
  else if (quantifiedBullets.length >= 1) impactScore += 3

  let readabilityScore = 0
  if (resume.basics.objective.trim().length >= 90 && resume.basics.objective.trim().length <= 320) readabilityScore += 5
  if (weakBullets.length <= 2) readabilityScore += 5
  if (bullets.every(bullet => bullet.length <= 220)) readabilityScore += 3
  if (!/\b(rockstar|ninja|guru|wizard)\b/i.test(resumeText)) readabilityScore += 2

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
      detail: "Recruiters need a readable phone number for direct follow-up."
    })
  }

  if (resume.basics.objective.trim().length < 70) {
    issues.push({
      severity: "medium",
      title: "Summary is too thin",
      detail: "A targeted summary should quickly communicate role fit, stack, and delivery strength."
    })
  }

  if (skills.length < 10) {
    issues.push({
      severity: "medium",
      title: "Expand technical skills",
      detail: "Use a plain comma-separated technical skills section with credible role-relevant keywords."
    })
  }

  if (keywordMatch.rate < 0.45 && resume.targeting.jobDescription.trim()) {
    issues.push({
      severity: "high",
      title: "Low JD keyword alignment",
      detail: "The resume does not yet reflect enough of the pasted job description's required skills and recruiter intent."
    })
  }

  if (technicalOverlap.rate < 0.45 && analysis.technologies.length > 0) {
    issues.push({
      severity: "medium",
      title: "Technical overlap needs work",
      detail: "Several technologies from the job description are not visible in the resume. Add only truthful skills you can defend."
    })
  }

  if (weakBullets.length > 0) {
    issues.push({
      severity: "medium",
      title: "Weak bullet language detected",
      detail: "Some bullets sound task-based or junior. Rewrite them with stronger action verbs, technical scope, and truthful outcomes."
    })
  }

  if (quantifiedBullets.length < 2 && experienceEntries.length > 0) {
    issues.push({
      severity: "medium",
      title: "Add more measurable impact",
      detail: "Use truthful numbers, scale, delivery cadence, app counts, downloads, performance, or quality outcomes where available."
    })
  }

  if (resume.basics.objective.trim().length > 340) {
    issues.push({
      severity: "low",
      title: "Summary may be too long",
      detail: "Keep the summary concise so recruiters can understand the fit during a fast scan."
    })
  }

  const categoryScores: AtsCategoryScore[] = [
    { label: "Keyword Match", score: keywordMatch.score, maxScore: 25 },
    { label: "Technical Overlap", score: technicalOverlap.score, maxScore: 20 },
    { label: "Readability", score: readabilityScore, maxScore: 15 },
    { label: "Impact", score: impactScore, maxScore: 15 },
    { label: "ATS Format", score: formatScore, maxScore: 20 },
    { label: "Section Quality", score: sectionQualityScore, maxScore: 20 }
  ]
  const totalScore = Math.round(
    (categoryScores.reduce((sum, category) => sum + category.score, 0) /
      categoryScores.reduce((sum, category) => sum + category.maxScore, 0)) *
      100
  )

  if (emailPattern.test(resume.basics.email) && phonePattern.test(resume.basics.phone)) {
    strengths.push("Contact details are ATS-readable.")
  }

  if (keywordMatch.matched.length > 0) {
    strengths.push(`Matches target keywords including ${keywordMatch.matched.slice(0, 5).join(", ")}.`)
  }

  if (quantifiedBullets.length >= 2) {
    strengths.push("Experience includes measurable impact signals.")
  }

  if (projectEntries.some(project => analysis.atsKeywords.some(keyword => hasTerm([project.desc, project.skills].join(" "), keyword)))) {
    strengths.push("Projects provide role-relevant technical evidence.")
  }

  const missingSkills = keywordMatch.missing.slice(0, 12)
  const keywordOpportunities = missingSkills.map(
    skill => `Consider adding ${skill} only if it reflects real experience, project work, training, or a defensible transferable skill.`
  )

  if (missingSkills.length) {
    suggestions.push("Review missing skills and add only truthful evidence-backed keywords.")
  }

  if (weakBullets.length) {
    suggestions.push("Use the bullet rewriter to convert task descriptions into credible delivery statements.")
  }

  if (!resume.targeting.jobDescription.trim()) {
    suggestions.push("Paste a job description to activate role-specific ATS matching and recruiter simulation.")
  }

  const recruiterScore = clampScore(
    totalScore * 0.42 +
      keywordMatch.rate * 25 +
      (weakBullets.length <= 2 ? 12 : 5) +
      (quantifiedBullets.length >= 2 ? 10 : 4) +
      (resume.basics.objective.trim().length >= 90 ? 11 : 4)
  )
  const credibility = analyzeTechnicalCredibility(resume, analysis)
  const recruiterScan = generateRecruiterScan(resume, analysis, recruiterScore)

  return {
    score: clampScore(totalScore),
    recruiterScore,
    categoryScores,
    issues: issues.sort((a, b) => severityWeight(a.severity) - severityWeight(b.severity)),
    strengths,
    missingSkills,
    keywordOpportunities,
    weakBullets: weakBullets.slice(0, 8),
    suggestions,
    matchedKeywords: keywordMatch.matched,
    jobAnalysis: analysis,
    recruiterScan,
    credibility
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
