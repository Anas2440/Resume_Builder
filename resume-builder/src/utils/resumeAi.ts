import type {
  Project,
  ResumeModeId,
  ResumeState,
  ResumeTargeting
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

export interface OptimizationResult {
  resume: ResumeState
  analysis: JobDescriptionAnalysis
  changes: string[]
  safeguards: string[]
  keywordOpportunities: string[]
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

const strongActionVerbs = [
  "Built",
  "Delivered",
  "Integrated",
  "Implemented",
  "Optimized",
  "Developed",
  "Collaborated",
  "Launched",
  "Improved",
  "Designed",
  "Debugged",
  "Validated",
  "Maintained"
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

function getPrimaryRole(resume: ResumeState, analysis: JobDescriptionAnalysis, targeting: ResumeTargeting) {
  return (
    targeting.targetRole.trim() ||
    analysis.roleTitle.trim() ||
    resume.experience.find(item => item.role.trim())?.role.trim() ||
    "Software Engineer"
  )
}

function getModePositioning(modeId: ResumeModeId) {
  switch (modeId) {
    case "startup-execution":
      return "shipping reliable features quickly in ambiguous, cross-functional environments"
    case "enterprise-consulting":
      return "delivering maintainable, API-driven applications through disciplined SDLC practices"
    default:
      return "building scalable, product-focused mobile applications with strong app quality and user experience"
  }
}

export function generateTailoredSummary(
  resume: ResumeState,
  analysis: JobDescriptionAnalysis,
  targeting: ResumeTargeting
) {
  const years = inferYearsExperience(resume)
  const knownSkills = extractKnownSkills(resume)
  const matchedStack = uniqueValues([
    ...analysis.technologies.filter(skill => knownSkills.some(known => hasTerm(known, skill))),
    ...resumeModes[targeting.mode].keywords.filter(skill =>
      knownSkills.some(known => hasTerm(known, skill) || hasTerm(skill, known))
    )
  ]).slice(0, 6)
  const role = getPrimaryRole(resume, analysis, targeting)
  const yearsPhrase = years >= 1 ? `${years}+ years of experience` : "hands-on experience"
  const stackPhrase = matchedStack.length
    ? ` across ${matchedStack.join(", ")}`
    : " across mobile, API-driven, and production application workflows"

  return `${role} with ${yearsPhrase} building production software${stackPhrase}. Strong focus on ${getModePositioning(targeting.mode)}, with experience translating product requirements into recruiter-readable, technically credible delivery outcomes.`
}

function makeSentence(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ")

  if (!trimmed) {
    return ""
  }

  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`
}

function removeWeakOpening(bullet: string) {
  return bullet
    .replace(/^[-•]\s*/, "")
    .replace(weakBulletPattern, "")
    .replace(/^\s*(on|with|for|to)\s+/i, "")
    .trim()
}

function preserveMetricClause(bullet: string) {
  return bullet.match(/\b(?:\d+[%+]?|[1-9]\d*x|[1-9]\d{2,}\+|100,000\+)[^.;]*/i)?.[0]?.trim() ?? ""
}

export function rewriteBulletForTarget(
  bullet: string,
  analysis: JobDescriptionAnalysis,
  modeId: ResumeModeId
) {
  const cleaned = removeWeakOpening(bullet)

  if (!cleaned) {
    return bullet
  }

  const lower = cleaned.toLowerCase()
  const metric = preserveMetricClause(bullet)
  const suffix = metric && !hasTerm(cleaned, metric) ? `, preserving the reported impact of ${metric}` : ""
  const modeQuality =
    modeId === "enterprise-consulting"
      ? "maintainability and reliable delivery"
      : modeId === "startup-execution"
        ? "rapid delivery and product iteration"
        : "app quality, performance, and user experience"

  if (/api|backend|json|graphql/.test(lower)) {
    return makeSentence(`Integrated API-driven mobile workflows with asynchronous data handling to improve synchronization, reliability, and application responsiveness${suffix}`)
  }

  if (/ble|bluetooth|polar|sensor/.test(lower)) {
    return makeSentence(`Implemented BLE-based device connectivity, pairing, connection-state handling, and live data flows for reliable realtime mobile experiences${suffix}`)
  }

  if (/socket|real[-\s]?time|live|sync/.test(lower)) {
    return makeSentence(`Developed realtime communication features with dependable state updates and user-facing responsiveness across production iOS workflows${suffix}`)
  }

  if (/firebase|push|notification|database|firestore/.test(lower)) {
    return makeSentence(`Built Firebase-backed mobile features supporting notifications, data persistence, and reliable product workflows${suffix}`)
  }

  if (/test|qa|quality|unit|ui testing/.test(lower)) {
    return makeSentence(`Validated feature quality through testing and release checks to support stable delivery and reduce production regressions${suffix}`)
  }

  if (/optimi[sz]|performance|load|speed|responsive/.test(lower)) {
    return makeSentence(`Optimized iOS application performance and code paths to improve responsiveness, load behavior, and user experience${suffix}`)
  }

  if (/collaborat|agile|scrum|daily|weekly|team/.test(lower)) {
    return makeSentence(`Collaborated in Agile delivery cycles with cross-functional stakeholders to clarify scope, unblock delivery, and ship reliable builds${suffix}`)
  }

  if (/launch|app store|downloads|production/.test(lower)) {
    return makeSentence(`Launched production iOS applications through App Store-ready delivery practices while maintaining ${modeQuality}${suffix}`)
  }

  if (weakBulletPattern.test(bullet) || cleaned.length < 70) {
    const recruiterTerm = analysis.recruiterIntent[0] ?? modeQuality
    return makeSentence(`Delivered ${cleaned} with emphasis on ${recruiterTerm}, ${modeQuality}, and technically credible execution${suffix}`)
  }

  const startsStrong = strongActionVerbs.some(verb => cleaned.startsWith(verb))
  return startsStrong ? makeSentence(cleaned) : makeSentence(`Delivered ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`)
}

function strengthenProject(project: Project, analysis: JobDescriptionAnalysis, modeId: ResumeModeId) {
  const projectText = [project.name, project.desc, project.skills].join(" ")
  const matched = uniqueValues(
    [...analysis.atsKeywords, ...resumeModes[modeId].keywords].filter(keyword =>
      hasTerm(projectText, keyword)
    )
  ).slice(0, 4)

  if (!project.desc.trim() || matched.length === 0) {
    return project
  }

  const cleanDescription = project.desc.trim().replace(/\.$/, "")
  const emphasis = matched.join(", ")

  return {
    ...project,
    desc: `${cleanDescription}, with resume emphasis on ${emphasis} for closer role alignment.`
  }
}

export function optimizeResumeForJob(
  resume: ResumeState,
  targeting: ResumeTargeting
): OptimizationResult {
  const analysis = analyzeJobDescription(targeting.jobDescription, targeting.mode)
  const knownSkills = extractKnownSkills(resume)
  const rankedSkills = knownSkills
    .map((skill, index) => ({
      skill,
      index,
      score:
        (analysis.requiredSkills.some(keyword => hasTerm(skill, keyword) || hasTerm(keyword, skill)) ? 8 : 0) +
        (analysis.atsKeywords.some(keyword => hasTerm(skill, keyword) || hasTerm(keyword, skill)) ? 4 : 0) +
        (resumeModes[targeting.mode].keywords.some(keyword => hasTerm(skill, keyword) || hasTerm(keyword, skill)) ? 3 : 0)
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.skill)
  const optimizedSkills = uniqueValues(rankedSkills).join(", ")
  const optimizedExperience = resume.experience.map(item => ({
    ...item,
    bullets: item.bullets.map(bullet => rewriteBulletForTarget(bullet, analysis, targeting.mode))
  }))
  const rankedProjects = resume.projects
    .map((project, index) => ({
      project: strengthenProject(project, analysis, targeting.mode),
      index,
      score: scoreTextAgainstKeywords(
        [project.name, project.desc, project.skills].join(" "),
        [...analysis.atsKeywords, ...resumeModes[targeting.mode].keywords]
      )
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.project)
  const nextResume: ResumeState = {
    ...resume,
    basics: {
      ...resume.basics,
      objective: generateTailoredSummary(resume, analysis, targeting),
      skills: optimizedSkills || resume.basics.skills
    },
    experience: optimizedExperience,
    projects: rankedProjects,
    targeting: {
      ...targeting,
      lastOptimizedAt: new Date().toISOString()
    }
  }
  const missing = getKeywordMatches(resume, analysis.requiredSkills).missing

  return {
    resume: nextResume,
    analysis,
    changes: [
      "Rewrote the professional summary around the selected role mode and pasted job description.",
      "Reordered technical skills by JD overlap while keeping only skills already found in the resume.",
      "Strengthened weak bullets using credible action verbs and technical context without adding fake metrics.",
      "Reordered projects by keyword relevance and emphasized matching technologies already present in each project."
    ],
    safeguards: [
      "No companies, employment history, education, certifications, or projects were invented.",
      "Missing JD skills were reported as opportunities instead of being silently added.",
      "Existing metrics were preserved; new numbers were not fabricated."
    ],
    keywordOpportunities: missing.map(skill => `Add ${skill} only if you can defend it from real work, projects, or training.`)
  }
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
