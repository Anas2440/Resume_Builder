import type { ResumeState } from "./resume"

export interface AiJobDescriptionAnalysis {
  skills: string[]
  frameworks: string[]
  keywords: string[]
  responsibilities: string[]
  experienceLevel: string
  softSkills: string[]
}

export interface AiResumeAnalysis {
  experience: string[]
  projects: string[]
  skills: string[]
  achievements: string[]
}

export interface ResumeMatchResult {
  matchedSkills: string[]
  missingSkills: string[]
  weakBullets: string[]
  strongBullets: string[]
}

export type OptimizationStage = "idle" | "analyzing-jd" | "matching-resume" | "optimizing-content"

export interface BulletChange {
  experienceIndex: number
  company: string
  role: string
  action: "rewrite" | "remove" | "merge"
  original: string
  suggested: string
  reason: string
}

export interface ResumeOptimizationResponse {
  originalResume: ResumeState
  suggestedResume: ResumeState
  jobAnalysis: AiJobDescriptionAnalysis
  resumeAnalysis: AiResumeAnalysis
  match: ResumeMatchResult
  matchScore: number
  missingSkills: string[]
  suggestedImprovements: string[]
  changes: BulletChange[]
  safeguards: string[]
}
