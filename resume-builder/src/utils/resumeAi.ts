import type {
  ResumeModeId,
  ResumeState
} from "../types/resume"

export interface ResumeMode {
  id: ResumeModeId
  label: string
  target: string
  tone: string
  keywords: string[]
}

export interface JobDescriptionAnalysis {
  requiredSkills: string[]
  atsKeywords: string[]
  technologies: string[]
  recruiterIntent: string[]
  seniority: string
  domainEmphasis: string[]
  roleTitle: string
  companySignals: string[]
}

export interface RecruiterScan {
  firstImpression: string
  shortlistProbability: number
  strengths: string[]
  concerns: string[]
  weakSections: string[]
  juniorSignals: string[]
  actions: string[]
}

export interface CredibilityReport {
  warnings: string[]
  strengths: string[]
}

export const resumeModes: Record<ResumeModeId, ResumeMode> = {
  "product-ios": {
    id: "product-ios",
    label: "Product iOS Engineer",
    target: "Product companies, global startups, and modern mobile teams",
    tone: "Scalable architecture, performance, product ownership, realtime systems, app quality, and user experience",
    keywords: [
      "Swift",
      "UIKit",
      "SwiftUI",
      "MVVM",
      "REST APIs",
      "Firebase",
      "app performance",
      "realtime communication",
      "scalable mobile architecture",
      "product ownership",
      "user experience"
    ]
  },
  "startup-execution": {
    id: "startup-execution",
    label: "Startup Execution",
    target: "Startups, AI-native companies, and fast-moving product teams",
    tone: "Ownership, shipping fast, adaptability, rapid iteration, ambiguity, and cross-functional execution",
    keywords: [
      "startup environment",
      "agile execution",
      "realtime features",
      "integrations",
      "SDKs",
      "rapid delivery",
      "scalable systems",
      "ownership",
      "cross-functional execution"
    ]
  },
  "enterprise-consulting": {
    id: "enterprise-consulting",
    label: "Enterprise Consulting",
    target: "Consulting firms, enterprise companies, and service organizations",
    tone: "SDLC, maintainability, collaboration, process-oriented engineering, and enterprise delivery",
    keywords: [
      "SDLC",
      "Agile",
      "enterprise applications",
      "debugging",
      "API integration",
      "client delivery",
      "maintainable code",
      "code reviews",
      "collaboration"
    ]
  }
}

const technologyTerms = [
  "Swift",
  "UIKit",
  "SwiftUI",
  "Objective-C",
  "Xcode",
  "iOS",
  "iPadOS",
  "MVVM",
  "MVC",
  "Combine",
  "async/await",
  "Swift Concurrency",
  "GCD",
  "Core Data",
  "REST APIs",
  "GraphQL",
  "JSON",
  "Firebase",
  "Realtime Database",
  "Firestore",
  "Push Notifications",
  "Socket.IO",
  "WebSockets",
  "BLE",
  "Bluetooth Low Energy",
  "Polar SDK",
  "Mapbox",
  "In-App Purchases",
  "App Store",
  "Unit Testing",
  "UI Testing",
  "TDD",
  "CI/CD",
  "Git",
  "Agile",
  "SDLC",
  "API integration",
  "SDKs",
  "AI",
  "Localization",
  "Performance Optimization",
  "Debugging",
  "Code Reviews"
]

const intentSignals = [
  { pattern: /own|ownership|end-to-end|lead/i, label: "ownership" },
  { pattern: /scale|scalable|architecture|platform/i, label: "scalable architecture" },
  { pattern: /performance|latency|responsive|optimization/i, label: "performance optimization" },
  { pattern: /startup|fast[-\s]?paced|ship|iterate|ambiguity/i, label: "fast execution" },
  { pattern: /collaborat|cross-functional|stakeholder|product/i, label: "cross-functional collaboration" },
  { pattern: /quality|test|reliable|maintainable|code review/i, label: "engineering quality" },
  { pattern: /real[-\s]?time|socket|live|sync/i, label: "realtime systems" },
  { pattern: /client|consulting|enterprise|delivery|SDLC/i, label: "enterprise delivery" }
]

const domainSignals = [
  { pattern: /mobile|ios|app store|iphone|ipad/i, label: "mobile product engineering" },
  { pattern: /fintech|trading|payment|banking|finance/i, label: "fintech" },
  { pattern: /health|fitness|wellness|medical|wearable/i, label: "health and wellness" },
  { pattern: /social|chat|messaging|community/i, label: "social and communication" },
  { pattern: /ai|machine learning|llm|assistant|automation/i, label: "AI-native product" },
  { pattern: /enterprise|consulting|client|service/i, label: "enterprise services" },
  { pattern: /ecommerce|marketplace|commerce/i, label: "marketplace and commerce" }
]

const weakBulletPattern = /^(worked on|responsible for|helped with|involved in|handled|did|made|used)\b/i

const splitValues = (value: string) =>
  value
    .split(/[,|•·\n]/)
    .map(item => item.trim())
    .filter(Boolean)

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim()

const uniqueValues = (values: string[]) => {
  const seen = new Set<string>()
  const result: string[] = []

  values.forEach(value => {
    const cleaned = value.replace(/\s+/g, " ").trim()
    const key = normalize(cleaned)

    if (cleaned && !seen.has(key)) {
      seen.add(key)
      result.push(cleaned)
    }
  })

  return result
}

export function getResumeText(resume: ResumeState) {
  return [
    resume.basics.name,
    resume.basics.objective,
    resume.basics.skills,
    resume.basics.languages,
    ...resume.experience.flatMap(item => [
      item.company,
      item.role,
      item.location,
      ...item.bullets
    ]),
    ...resume.projects.flatMap(item => [item.name, item.desc, item.skills]),
    ...resume.education.flatMap(item => [item.degree, item.school]),
    ...resume.certifications.flatMap(item => [item.name, item.issuer])
  ]
    .filter(Boolean)
    .join(" ")
}

export function hasTerm(text: string, term: string) {
  return normalize(text).includes(normalize(term))
}

export function extractKnownSkills(resume: ResumeState) {
  const resumeText = getResumeText(resume)
  const explicitSkills = splitValues(resume.basics.skills)
  const projectSkills = resume.projects.flatMap(project => splitValues(project.skills))
  const detectedSkills = technologyTerms.filter(term => hasTerm(resumeText, term))

  return uniqueValues([...explicitSkills, ...projectSkills, ...detectedSkills])
}

export function analyzeJobDescription(
  jobDescription: string,
  modeId: ResumeModeId
): JobDescriptionAnalysis {
  const mode = resumeModes[modeId]
  const jd = jobDescription.trim()
  const analysisText = jd || `${mode.target} ${mode.tone} ${mode.keywords.join(" ")}`
  const technologies = technologyTerms.filter(term => hasTerm(analysisText, term))
  const matchedModeKeywords = mode.keywords.filter(keyword => hasTerm(analysisText, keyword))
  const recruiterIntent = intentSignals
    .filter(signal => signal.pattern.test(analysisText))
    .map(signal => signal.label)
  const domainEmphasis = domainSignals
    .filter(signal => signal.pattern.test(analysisText))
    .map(signal => signal.label)
  const companySignals = [
    /startup|founding|early[-\s]?stage|series [abc]/i.test(analysisText) ? "startup" : "",
    /enterprise|fortune|consulting|client/i.test(analysisText) ? "enterprise" : "",
    /remote|distributed|global/i.test(analysisText) ? "distributed team" : "",
    /product|saas|platform/i.test(analysisText) ? "product-led company" : ""
  ].filter(Boolean)

  const roleTitle =
    analysisText.match(
      /\b(senior\s+)?(ios|mobile|software|frontend|backend|full[-\s]?stack)\s+(engineer|developer)\b/i
    )?.[0] ?? mode.label

  const seniority = /principal|staff|lead/i.test(analysisText)
    ? "Lead or staff-level expectations"
    : /senior|sr\./i.test(analysisText)
      ? "Senior-level expectations"
      : /junior|entry|associate|intern/i.test(analysisText)
        ? "Junior or associate-level expectations"
        : "Mid-level or role-flexible expectations"

  const atsKeywords = uniqueValues([
    ...technologies,
    ...matchedModeKeywords,
    ...recruiterIntent,
    ...domainEmphasis,
    ...companySignals,
    ...mode.keywords
  ]).slice(0, 28)

  const requiredSkills = uniqueValues([
    ...technologies,
    ...matchedModeKeywords,
    ...mode.keywords.filter(keyword => technologies.length === 0 || hasTerm(analysisText, keyword))
  ]).slice(0, 18)

  return {
    requiredSkills,
    atsKeywords,
    technologies,
    recruiterIntent: recruiterIntent.length ? recruiterIntent : mode.tone.split(",").map(item => item.trim()),
    seniority,
    domainEmphasis: domainEmphasis.length ? domainEmphasis : [mode.target],
    roleTitle,
    companySignals
  }
}

export function getKeywordMatches(resume: ResumeState, keywords: string[]) {
  const resumeText = getResumeText(resume)
  const matched = keywords.filter(keyword => hasTerm(resumeText, keyword))
  const missing = keywords.filter(keyword => !hasTerm(resumeText, keyword))

  return {
    matched,
    missing,
    rate: keywords.length ? matched.length / keywords.length : 1
  }
}

function scoreTextAgainstKeywords(text: string, keywords: string[]) {
  return keywords.reduce((score, keyword) => score + (hasTerm(text, keyword) ? 1 : 0), 0)
}

function inferYearsExperience(resume: ResumeState) {
  const years = resume.experience
    .map(item => item.start.match(/\b(20\d{2}|19\d{2})\b/)?.[0])
    .filter((value): value is string => Boolean(value))
    .map(value => Number(value))

  if (!years.length) {
    return 0
  }

  return Math.max(0, new Date().getFullYear() - Math.min(...years))
}

export function analyzeTechnicalCredibility(
  resume: ResumeState,
  analysis: JobDescriptionAnalysis
): CredibilityReport {
  const warnings: string[] = []
  const strengths: string[] = []
  const resumeText = getResumeText(resume)
  const skills = splitValues(resume.basics.skills)
  const years = inferYearsExperience(resume)

  if (skills.length > 36) {
    warnings.push("The skills section may look keyword-stuffed. Keep it focused on skills you can discuss in an interview.")
  }

  if (years > 0 && years < 4 && /\b(architect|principal|staff|lead)\b/i.test(resume.basics.objective)) {
    warnings.push("The summary uses seniority language that may exceed the visible experience timeline.")
  }

  if (/\bexpert\b/i.test(resumeText)) {
    warnings.push("Avoid claiming expert-level depth unless the experience bullets clearly prove it.")
  }

  const unsupportedKeywords = analysis.requiredSkills.filter(
    skill => hasTerm(resume.basics.skills, skill) && !resume.experience.some(item => hasTerm(item.bullets.join(" "), skill))
  )

  if (unsupportedKeywords.length > 4) {
    warnings.push("Several skills appear in the skills list but are not supported by experience bullets. Add evidence or remove weak claims.")
  }

  if (resume.experience.some(item => item.bullets.some(bullet => /app store|production|launched/i.test(bullet)))) {
    strengths.push("Production and launch experience is visible, which improves technical credibility.")
  }

  if (analysis.technologies.some(tech => resume.experience.some(item => hasTerm(item.bullets.join(" "), tech)))) {
    strengths.push("Some target technologies are backed by actual experience bullets, not just the skills list.")
  }

  if (resume.projects.some(project => scoreTextAgainstKeywords([project.desc, project.skills].join(" "), analysis.atsKeywords) > 1)) {
    strengths.push("Projects reinforce the target job description with matching technical context.")
  }

  return { warnings, strengths }
}

export function generateRecruiterScan(
  resume: ResumeState,
  analysis: JobDescriptionAnalysis,
  recruiterScore: number
): RecruiterScan {
  const weakBullets = resume.experience.flatMap(item =>
    item.bullets.filter(bullet => bullet.trim().length > 0 && (weakBulletPattern.test(bullet) || bullet.trim().length < 55))
  )
  const quantifiedBullets = resume.experience.flatMap(item =>
    item.bullets.filter(bullet => /\d|%|\+|users|downloads|revenue|latency|load/i.test(bullet))
  )
  const keywordMatches = getKeywordMatches(resume, analysis.requiredSkills)
  const concerns = [
    keywordMatches.rate < 0.55 ? "Target keyword alignment is still below a strong callback threshold." : "",
    weakBullets.length ? "Some bullets still read task-based rather than outcome-based." : "",
    quantifiedBullets.length < 2 ? "The resume would benefit from more measurable proof where truthful metrics exist." : ""
  ].filter(Boolean)
  const strengths = [
    resume.basics.objective.length >= 90 ? "Summary gives a clear role-positioning signal." : "",
    keywordMatches.matched.length ? `Matches visible target keywords such as ${keywordMatches.matched.slice(0, 4).join(", ")}.` : "",
    resume.projects.length > 2 ? "Project depth gives recruiters more technical evidence to scan." : ""
  ].filter(Boolean)
  const weakSections = [
    resume.basics.objective.length < 90 ? "Professional summary" : "",
    resume.basics.skills.split(",").filter(Boolean).length < 10 ? "Technical skills" : "",
    weakBullets.length ? "Experience bullets" : ""
  ].filter(Boolean)
  const juniorSignals = [
    weakBullets.some(bullet => /^worked on/i.test(bullet)) ? "Phrases like Worked on can make contributions sound passive." : "",
    !resume.experience.some(item => /owned|led|delivered|launched|optimized/i.test(item.bullets.join(" ")))
      ? "Ownership and delivery language is not yet strong enough."
      : ""
  ].filter(Boolean)

  return {
    firstImpression:
      recruiterScore >= 82
        ? "Strong targeted resume: the first scan communicates role fit, technical relevance, and credible delivery."
        : recruiterScore >= 68
          ? "Promising resume: the target fit is visible, but a recruiter may still want stronger impact evidence."
          : "Generic resume risk: the first scan does not yet prove enough alignment for a competitive shortlist.",
    shortlistProbability: Math.max(5, Math.min(95, Math.round(recruiterScore * 0.9 + keywordMatches.rate * 10))),
    strengths,
    concerns,
    weakSections,
    juniorSignals,
    actions: [
      "Lead with the most relevant target technologies in summary, skills, and top bullets.",
      "Replace passive bullets with delivery, integration, optimization, or launch language.",
      "Add truthful scale, usage, performance, or delivery metrics wherever they can be defended."
    ]
  }
}
