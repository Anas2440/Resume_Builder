export interface Experience {
  company: string
  role: string
  location: string
  start: string
  end: string
  bullets: string[]
}

export interface Project {
  name: string
  desc: string
  skills: string
}

export interface Education {
  degree: string
  school: string
  start: string
  end: string
}

export interface Certification {
  name: string
  issuer: string
  date: string
}

export type ResumeModeId = "product-ios" | "startup-execution" | "enterprise-consulting"

export interface ResumeTargeting {
  jobDescription: string
  mode: ResumeModeId
  targetRole: string
  companyType: string
  lastOptimizedAt: string
}

export interface Basics {
  name: string
  phone: string
  email: string
  linkedin: string
  portfolio: string
  location: string
  objective: string
  skills: string
  languages: string
}

export interface ResumeState {
  basics: Basics
  experience: Experience[]
  projects: Project[]
  education: Education[]
  certifications: Certification[]
  targeting: ResumeTargeting
}
