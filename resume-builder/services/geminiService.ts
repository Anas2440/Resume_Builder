import type { ResumeState, ResumeTargeting } from "../src/types/resume"
import type {
  AiJobDescriptionAnalysis,
  AiResumeAnalysis,
  BulletChange,
  ResumeMatchResult,
  ResumeOptimizationResponse
} from "../src/types/optimization"
import { removeDuplicateBullets } from "../src/utils/removeDuplicateBullets"

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"]
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
const MAX_OUTPUT_TOKENS = 1800
const TEMPERATURE = 0.3
const MAX_RETRIES_PER_MODEL = 2
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])

class GeminiApiError extends Error {
  readonly status?: number
  readonly retryable: boolean

  constructor(message: string, status?: number, retryable = false) {
    super(message)
    this.name = "GeminiApiError"
    this.status = status
    this.retryable = retryable
  }
}

interface GeminiPart {
  text: string
}

interface GeminiContent {
  parts: GeminiPart[]
}

interface GeminiGenerationConfig {
  temperature: number
  maxOutputTokens: number
}

interface GeminiGenerateContentRequest {
  contents: GeminiContent[]
  generationConfig: GeminiGenerationConfig
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[]
    }
    finishReason?: string
  }>
}

interface GeminiErrorResponse {
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

const knownTechnologyTerms = [
  "Swift",
  "UIKit",
  "SwiftUI",
  "Objective-C",
  "Xcode",
  "iOS",
  "MVVM",
  "MVC",
  "Combine",
  "async/await",
  "Core Data",
  "REST APIs",
  "GraphQL",
  "JSON",
  "Firebase",
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
  "CI/CD",
  "Git",
  "Agile",
  "SDLC",
  "API integration",
  "AI",
  "Localization",
  "Performance Optimization",
  "Debugging",
  "Code Reviews"
]

const softSkillTerms = [
  "communication",
  "collaboration",
  "ownership",
  "leadership",
  "problem solving",
  "adaptability",
  "cross-functional",
  "stakeholder"
]

const weakBulletPattern = /^(worked on|responsible for|helped with|involved in|handled|did|made|used)\b/i
const strongBulletPattern =
  /^(built|delivered|integrated|implemented|optimized|developed|launched|improved|designed|owned|led|created|validated|maintained)\b/i

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim()
}

function hasTerm(text: string, term: string) {
  return normalize(text).includes(normalize(term))
}

function cleanLine(value: string) {
  return value.replace(/^[-•*]\s*/, "").replace(/\s+/g, " ").trim()
}

function unique(values: string[]) {
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

function splitSkills(value: string) {
  return value
    .split(/[,|•·\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function buildResumeText(resume: ResumeState) {
  const lines: string[] = []

  lines.push(resume.basics.name)
  lines.push([resume.basics.email, resume.basics.phone, resume.basics.location].filter(Boolean).join(" | "))
  lines.push([resume.basics.linkedin, resume.basics.portfolio].filter(Boolean).join(" | "))

  if (resume.basics.objective.trim()) {
    lines.push("", "SUMMARY", resume.basics.objective)
  }

  lines.push("", "EXPERIENCE")
  resume.experience.forEach(item => {
    if (!item.company && !item.role) {
      return
    }

    lines.push(item.company)
    lines.push([item.role, item.location, [item.start, item.end].filter(Boolean).join(" - ")].filter(Boolean).join(" | "))
    item.bullets.map(cleanLine).filter(Boolean).forEach(bullet => lines.push(`- ${bullet}`))
    lines.push("")
  })

  lines.push("PROJECTS")
  resume.projects.forEach(item => {
    if (!item.name) {
      return
    }

    lines.push(item.name)
    if (item.desc) lines.push(item.desc)
    if (item.skills) lines.push(`Skills: ${item.skills}`)
    lines.push("")
  })

  if (resume.basics.skills.trim()) {
    lines.push("SKILLS", resume.basics.skills, "")
  }

  if (resume.education.some(item => item.degree || item.school)) {
    lines.push("EDUCATION")
    resume.education.forEach(item => {
      if (item.degree || item.school) {
        lines.push([item.degree, item.school, [item.start, item.end].filter(Boolean).join(" - ")].filter(Boolean).join(" | "))
      }
    })
    lines.push("")
  }

  if (resume.certifications.some(item => item.name)) {
    lines.push("CERTIFICATIONS")
    resume.certifications.forEach(item => {
      if (item.name) {
        lines.push([item.name, item.issuer, item.date].filter(Boolean).join(" | "))
      }
    })
  }

  return lines.filter(line => line !== undefined).join("\n").trim()
}

function buildPrompt(resumeText: string, jobDescription: string) {
  return `You are a professional ATS resume optimizer.

Rules:

* Never invent experience
* Never create fake skills
* Preserve truthfulness
* Preserve similar bullet count where possible
* Improve wording
* Match relevant job keywords
* Keep concise and impactful
* Return only the improved resume content

Input:

Resume:
${resumeText}

Job Description:
${jobDescription}`
}

function parseErrorPayload(value: string): GeminiErrorResponse {
  try {
    return JSON.parse(value) as GeminiErrorResponse
  } catch {
    return {}
  }
}

export class GeminiService {
  private readonly apiKey: string

  constructor(apiKey = process.env.GEMINI_API_KEY ?? "") {
    this.apiKey = apiKey
  }

  async generateResumeSuggestions(resume: string, jobDescription: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured")
    }

    const prompt = buildPrompt(resume, jobDescription)
    let lastError: unknown

    for (const model of GEMINI_MODELS) {
      for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt += 1) {
        try {
          return await this.generateContent(model, prompt)
        } catch (error) {
          lastError = error

          if (!this.shouldRetry(error) || attempt === MAX_RETRIES_PER_MODEL) {
            break
          }

          await this.waitBeforeRetry(attempt)
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Gemini request failed")
  }

  private async generateContent(model: string, prompt: string) {
    const requestBody: GeminiGenerateContentRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_OUTPUT_TOKENS
      }
    }
    const endpoint = `${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`

    let response: Response

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      })
    } catch (error) {
      throw new GeminiApiError(
        `Network error while contacting Gemini: ${error instanceof Error ? error.message : "Unknown network error"}`,
        undefined,
        true
      )
    }

    const responseText = await response.text()

    if (!response.ok) {
      const errorPayload = parseErrorPayload(responseText)
      const message = errorPayload.error?.message || responseText || "Unknown Gemini API error"
      throw new GeminiApiError(
        `Gemini API error ${response.status}: ${message}`,
        response.status,
        RETRYABLE_STATUS_CODES.has(response.status)
      )
    }

    let payload: GeminiGenerateContentResponse

    try {
      payload = JSON.parse(responseText) as GeminiGenerateContentResponse
    } catch {
      throw new Error("Invalid response from Gemini")
    }

    const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text).join("").trim() ?? ""

    if (!text) {
      throw new Error("Gemini returned an empty AI response")
    }

    return text
  }

  private shouldRetry(error: unknown) {
    return error instanceof GeminiApiError && error.retryable
  }

  private waitBeforeRetry(attempt: number) {
    const delayMs = 600 * 2 ** attempt

    return new Promise(resolve => {
      setTimeout(resolve, delayMs)
    })
  }
}

function analyzeJobDescription(jobDescription: string): AiJobDescriptionAnalysis {
  const skills = knownTechnologyTerms.filter(term => hasTerm(jobDescription, term))
  const frameworks = skills.filter(skill => /UIKit|SwiftUI|Firebase|Combine|Core Data|Mapbox|Socket\.IO/i.test(skill))
  const softSkills = softSkillTerms.filter(term => hasTerm(jobDescription, term))
  const responsibilities = unique(
    jobDescription
      .split(/\n|\.|;/)
      .map(line => line.trim())
      .filter(line => /develop|build|integrat|collaborat|optimi|test|maintain|design|ship|own/i.test(line))
  ).slice(0, 10)
  const experienceLevel = /principal|staff|lead/i.test(jobDescription)
    ? "Lead or staff-level"
    : /senior|sr\./i.test(jobDescription)
      ? "Senior-level"
      : /junior|entry|associate|intern/i.test(jobDescription)
        ? "Junior or associate-level"
        : "Mid-level or flexible"

  return {
    skills,
    frameworks,
    keywords: unique([...skills, ...softSkills, ...responsibilities.flatMap(line => line.split(/\s+/).slice(0, 4))]).slice(0, 24),
    responsibilities,
    experienceLevel,
    softSkills
  }
}

function analyzeResume(resume: ResumeState): AiResumeAnalysis {
  return {
    experience: resume.experience
      .flatMap(item => [item.company, item.role, ...item.bullets])
      .map(cleanLine)
      .filter(Boolean),
    projects: resume.projects.flatMap(item => [item.name, item.desc, item.skills]).map(cleanLine).filter(Boolean),
    skills: unique([
      ...splitSkills(resume.basics.skills),
      ...resume.projects.flatMap(project => splitSkills(project.skills))
    ]),
    achievements: resume.experience
      .flatMap(item => item.bullets)
      .map(cleanLine)
      .filter(bullet => /\d|%|\+|users|downloads|latency|load time|revenue|performance/i.test(bullet))
  }
}

function buildMatch(jobAnalysis: AiJobDescriptionAnalysis, resumeAnalysis: AiResumeAnalysis, resume: ResumeState): ResumeMatchResult {
  const resumeText = buildResumeText(resume)
  const desiredSkills = unique([...jobAnalysis.skills, ...jobAnalysis.frameworks])
  const matchedSkills = desiredSkills.filter(skill =>
    resumeAnalysis.skills.some(resumeSkill => hasTerm(resumeSkill, skill) || hasTerm(skill, resumeSkill)) || hasTerm(resumeText, skill)
  )
  const weakBullets = resume.experience
    .flatMap(item => item.bullets)
    .map(cleanLine)
    .filter(bullet => bullet && (weakBulletPattern.test(bullet) || bullet.length < 70 || !strongBulletPattern.test(bullet)))
  const strongBullets = resume.experience
    .flatMap(item => item.bullets)
    .map(cleanLine)
    .filter(bullet => bullet && strongBulletPattern.test(bullet) && (bullet.length >= 90 || /\d|%|\+/.test(bullet)))

  return {
    matchedSkills,
    missingSkills: desiredSkills.filter(skill => !matchedSkills.includes(skill)),
    weakBullets,
    strongBullets
  }
}

function extractSuggestedBullets(improvedResumeContent: string) {
  return improvedResumeContent
    .split("\n")
    .map(line => line.trim())
    .filter(line => /^[-•*]\s+/.test(line))
    .map(cleanLine)
    .filter(Boolean)
}

function shouldRewriteBullet(bullet: string) {
  const cleaned = cleanLine(bullet)

  return weakBulletPattern.test(cleaned) || cleaned.length < 70 || !strongBulletPattern.test(cleaned)
}

function buildSuggestedResume(resume: ResumeState, improvedResumeContent: string) {
  const suggestedBullets = extractSuggestedBullets(improvedResumeContent)
  let suggestedBulletIndex = 0
  const changes: BulletChange[] = []
  const suggestedResume: ResumeState = {
    ...resume,
    basics: {
      ...resume.basics
    },
    experience: resume.experience.map((item, experienceIndex) => {
      const nextBullets = item.bullets.map(originalBullet => {
        const candidate = suggestedBullets[suggestedBulletIndex]
        suggestedBulletIndex += 1

        if (!candidate || !shouldRewriteBullet(originalBullet)) {
          return originalBullet
        }

        if (normalize(candidate) === normalize(originalBullet)) {
          return originalBullet
        }

        changes.push({
          experienceIndex,
          company: item.company,
          role: item.role,
          action: "rewrite",
          original: originalBullet,
          suggested: candidate,
          reason: "Gemini suggested clearer ATS wording for a weak bullet while preserving the original claim."
        })

        return candidate
      })
      const deduped = removeDuplicateBullets(nextBullets)

      item.bullets.forEach(originalBullet => {
        if (!deduped.some(nextBullet => normalize(nextBullet) === normalize(originalBullet))) {
          const alreadyTracked = changes.some(
            change => change.experienceIndex === experienceIndex && normalize(change.original) === normalize(originalBullet)
          )

          if (!alreadyTracked) {
            changes.push({
              experienceIndex,
              company: item.company,
              role: item.role,
              action: "merge",
              original: originalBullet,
              suggested: deduped.join(" | "),
              reason: "Removed or merged by the duplicate detection layer."
            })
          }
        }
      })

      return {
        ...item,
        bullets: deduped
      }
    })
  }

  return { suggestedResume, changes }
}

export async function optimizeResumeWithGemini(
  resume: ResumeState,
  targeting: ResumeTargeting,
  service = new GeminiService()
): Promise<ResumeOptimizationResponse> {
  const resumeText = buildResumeText(resume)
  const improvedResumeContent = await service.generateResumeSuggestions(resumeText, targeting.jobDescription)
  const jobAnalysis = analyzeJobDescription(targeting.jobDescription)
  const resumeAnalysis = analyzeResume(resume)
  const match = buildMatch(jobAnalysis, resumeAnalysis, resume)
  const { suggestedResume, changes } = buildSuggestedResume(resume, improvedResumeContent)

  suggestedResume.targeting = {
    ...targeting,
    lastOptimizedAt: new Date().toISOString()
  }

  const matchScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (match.matchedSkills.length / Math.max(1, match.matchedSkills.length + match.missingSkills.length)) * 70 +
          (match.weakBullets.length ? 15 : 30)
      )
    )
  )

  return {
    originalResume: resume,
    suggestedResume,
    jobAnalysis,
    resumeAnalysis,
    match,
    matchScore,
    missingSkills: match.missingSkills,
    suggestedImprovements: [
      "Review Gemini's suggested wording before accepting changes.",
      ...match.missingSkills.slice(0, 6).map(skill => `Add ${skill} only if it reflects real experience.`)
    ],
    changes,
    safeguards: [
      "Only resume text, job description, and the optimizer prompt were sent to Gemini.",
      "Strong bullets and existing achievements are preserved unless duplicated.",
      "Missing JD skills are reported instead of silently added.",
      "Duplicate detection removes or merges bullets with greater than 85% semantic similarity."
    ]
  }
}
