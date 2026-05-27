import type { ResumeState, ResumeTargeting } from "../src/types/resume"
import type {
  AiJobDescriptionAnalysis,
  AiResumeAnalysis,
  BulletChange,
  ResumeMatchResult,
  ResumeOptimizationResponse
} from "../src/types/optimization"
import { removeDuplicateBullets } from "../src/utils/removeDuplicateBullets"

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const MODEL = "google/gemini-2.5-flash"

type ChatMessage = {
  role: "system" | "user"
  content: string
}

interface RewritePlan {
  experienceSuggestions: Array<{
    experienceIndex: number
    bullets: Array<{
      original: string
      suggested: string
      action: "preserve" | "rewrite" | "remove"
      reason: string
    }>
  }>
  suggestedImprovements: string[]
  matchScore: number
}

const emptyJobAnalysis: AiJobDescriptionAnalysis = {
  skills: [],
  frameworks: [],
  keywords: [],
  responsibilities: [],
  experienceLevel: "",
  softSkills: []
}

const emptyResumeAnalysis: AiResumeAnalysis = {
  experience: [],
  projects: [],
  skills: [],
  achievements: []
}

function siteUrl() {
  const raw =
    process.env.OPENROUTER_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:5173"

  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}

function stripCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

function parseJsonObject<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(stripCodeFence(value)) as T
  } catch {
    const start = value.indexOf("{")
    const end = value.lastIndexOf("}")

    if (start >= 0 && end > start) {
      try {
        return JSON.parse(value.slice(start, end + 1)) as T
      } catch {
        return fallback
      }
    }

    return fallback
  }
}

async function callOpenRouter<T>(messages: ChatMessage[], fallback: T) {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured")
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": siteUrl(),
      "X-OpenRouter-Title": "Resume Builder"
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages
    })
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`OpenRouter request failed: ${response.status} ${detail}`)
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = payload.choices?.[0]?.message?.content ?? ""

  return parseJsonObject<T>(content, fallback)
}

function resumePayload(resume: ResumeState) {
  return {
    basics: resume.basics,
    experience: resume.experience,
    projects: resume.projects,
    education: resume.education,
    certifications: resume.certifications
  }
}

export async function analyzeJobDescriptionWithAi(jobDescription: string) {
  return callOpenRouter<AiJobDescriptionAnalysis>(
    [
      {
        role: "system",
        content:
          "You are a senior ATS resume editor. Extract structured job-description requirements only. Return strict JSON with keys: skills, frameworks, keywords, responsibilities, experienceLevel, softSkills."
      },
      {
        role: "user",
        content: JSON.stringify({ jobDescription })
      }
    ],
    emptyJobAnalysis
  )
}

export async function analyzeResumeWithAi(resume: ResumeState) {
  return callOpenRouter<AiResumeAnalysis>(
    [
      {
        role: "system",
        content:
          "You are a senior ATS resume editor. Extract facts from the resume only. Do not infer or invent. Return strict JSON with keys: experience, projects, skills, achievements."
      },
      {
        role: "user",
        content: JSON.stringify({ resume: resumePayload(resume) })
      }
    ],
    emptyResumeAnalysis
  )
}

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim()

function includesTerm(text: string, term: string) {
  return normalize(text).includes(normalize(term))
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

function buildMatch(jobAnalysis: AiJobDescriptionAnalysis, resumeAnalysis: AiResumeAnalysis, resume: ResumeState): ResumeMatchResult {
  const resumeText = JSON.stringify(resumePayload(resume))
  const resumeSkills = [...resumeAnalysis.skills, resume.basics.skills]
  const desiredSkills = unique([...jobAnalysis.skills, ...jobAnalysis.frameworks, ...jobAnalysis.keywords])
  const matchedSkills = desiredSkills.filter(skill =>
    resumeSkills.some(resumeSkill => includesTerm(resumeSkill, skill) || includesTerm(skill, resumeSkill)) ||
    includesTerm(resumeText, skill)
  )
  const weakBullets = resume.experience
    .flatMap(item => item.bullets)
    .map(bullet => bullet.trim())
    .filter(
      bullet =>
        bullet &&
        (/^(worked on|responsible for|helped with|involved in|handled|did|made|used)\b/i.test(bullet) ||
          bullet.length < 70)
    )
  const strongBullets = resume.experience
    .flatMap(item => item.bullets)
    .map(bullet => bullet.trim())
    .filter(
      bullet =>
        bullet &&
        /^(built|delivered|integrated|implemented|optimized|developed|launched|improved|designed|owned|led|created|validated)\b/i.test(bullet) &&
        (/\d|%|\+|users|downloads|latency|load time|performance/i.test(bullet) || bullet.length >= 95)
    )

  return {
    matchedSkills,
    missingSkills: desiredSkills.filter(skill => !matchedSkills.includes(skill)),
    weakBullets,
    strongBullets
  }
}

async function selectiveRewrite(resume: ResumeState, targeting: ResumeTargeting, jobAnalysis: AiJobDescriptionAnalysis, resumeAnalysis: AiResumeAnalysis, match: ResumeMatchResult) {
  return callOpenRouter<RewritePlan>(
    [
      {
        role: "system",
        content:
          "You are a senior ATS resume editor, not a resume generator. Rewrite only weak bullets. Preserve the summary, strong bullets, achievements, truthful metrics, employers, titles, dates, projects, education, certifications, and authenticity. Never invent fake experience. Avoid keyword stuffing. Every bullet must have unique value. Keep ATS-friendly natural human writing. Return strict JSON with keys: experienceSuggestions, suggestedImprovements, matchScore."
      },
      {
        role: "user",
        content: JSON.stringify({
          rules: [
            "Do not rewrite the entire resume.",
            "Do not add skills unless they already exist in the resume.",
            "Maximum 4-6 bullets per experience.",
            "If two bullets have the same meaning, remove or merge the weaker one.",
            "For each original bullet, action must be preserve, rewrite, or remove."
          ],
          targeting,
          jobAnalysis,
          resumeAnalysis,
          match,
          resume: resumePayload(resume)
        })
      }
    ],
    {
      experienceSuggestions: [],
      suggestedImprovements: [],
      matchScore: 0
    }
  )
}

function buildSuggestedResume(resume: ResumeState, plan: RewritePlan) {
  const changes: BulletChange[] = []
  const suggestedResume: ResumeState = {
    ...resume,
    basics: {
      ...resume.basics
    },
    experience: resume.experience.map((item, experienceIndex) => {
      const suggestion = plan.experienceSuggestions.find(entry => entry.experienceIndex === experienceIndex)

      if (!suggestion) {
        return {
          ...item,
          bullets: removeDuplicateBullets(item.bullets)
        }
      }

      const nextBullets = item.bullets.flatMap(originalBullet => {
        const candidate = suggestion.bullets.find(entry => normalize(entry.original) === normalize(originalBullet))

        if (!candidate || candidate.action === "preserve") {
          return [originalBullet]
        }

        if (candidate.action === "remove") {
          changes.push({
            experienceIndex,
            company: item.company,
            role: item.role,
            action: "remove",
            original: originalBullet,
            suggested: "",
            reason: candidate.reason
          })

          return []
        }

        const suggested = candidate.suggested.trim()

        if (suggested && normalize(suggested) !== normalize(originalBullet)) {
          changes.push({
            experienceIndex,
            company: item.company,
            role: item.role,
            action: "rewrite",
            original: originalBullet,
            suggested,
            reason: candidate.reason
          })

          return [suggested]
        }

        return [originalBullet]
      })

      const deduped = removeDuplicateBullets(nextBullets)

      return {
        ...item,
        bullets: deduped
      }
    })
  }

  suggestedResume.experience.forEach((item, experienceIndex) => {
    const originalBullets = resume.experience[experienceIndex]?.bullets ?? []

    originalBullets.forEach(original => {
      if (!item.bullets.some(next => normalize(next) === normalize(original))) {
        const alreadyTracked = changes.some(
          change => change.experienceIndex === experienceIndex && normalize(change.original) === normalize(original)
        )

        if (!alreadyTracked) {
          changes.push({
            experienceIndex,
            company: item.company,
            role: item.role,
            action: "merge",
            original,
            suggested: item.bullets.join(" | "),
            reason: "Removed or merged by the duplicate detection layer."
          })
        }
      }
    })
  })

  return { suggestedResume, changes }
}

export async function optimizeResumeWithOpenRouter(
  resume: ResumeState,
  targeting: ResumeTargeting
): Promise<ResumeOptimizationResponse> {
  const [jobAnalysis, resumeAnalysis] = await Promise.all([
    analyzeJobDescriptionWithAi(targeting.jobDescription),
    analyzeResumeWithAi(resume)
  ])
  const match = buildMatch(jobAnalysis, resumeAnalysis, resume)
  const plan = await selectiveRewrite(resume, targeting, jobAnalysis, resumeAnalysis, match)
  const { suggestedResume, changes } = buildSuggestedResume(resume, plan)

  suggestedResume.targeting = {
    ...targeting,
    lastOptimizedAt: new Date().toISOString()
  }

  return {
    originalResume: resume,
    suggestedResume,
    jobAnalysis,
    resumeAnalysis,
    match,
    matchScore: Math.max(0, Math.min(100, Math.round(plan.matchScore || (match.matchedSkills.length / Math.max(1, match.matchedSkills.length + match.missingSkills.length)) * 100))),
    missingSkills: match.missingSkills,
    suggestedImprovements: plan.suggestedImprovements ?? [],
    changes,
    safeguards: [
      "Strong bullets and existing achievements are preserved unless duplicated.",
      "Missing JD skills are reported instead of silently added.",
      "Duplicate detection removes or merges bullets with greater than 85% semantic similarity.",
      "No employers, projects, education, certifications, or fake metrics are invented."
    ]
  }
}
