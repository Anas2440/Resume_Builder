import { getDocument, GlobalWorkerOptions } from "pdfjs-dist"
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url"
import type { ResumeState, Experience, Project, Education, Certification } from "../types/resume"

GlobalWorkerOptions.workerSrc = workerSrc

interface ParsedSectionMap {
  summary: string[]
  experience: string[]
  projects: string[]
  education: string[]
  skills: string[]
  certifications: string[]
  languages: string[]
  other: string[]
}

const SECTION_TITLES: Array<[keyof ParsedSectionMap, RegExp]> = [
  ["summary", /^(professional summary|summary|profile|objective|about)$/i],
  ["experience", /^(experience|work experience|employment|professional experience)$/i],
  ["projects", /^(projects|project experience|accomplishments|projects & accomplishments)$/i],
  ["education", /^(education|academic background|academic history)$/i],
  ["skills", /^(skills|technical skills|core skills|technologies)$/i],
  ["certifications", /^(certifications|certificates|licenses)$/i],
  ["languages", /^(languages)$/i]
]

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const linkedInPattern = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s|]+/i
const portfolioPattern = /(?:https?:\/\/)?(?:www\.)?(?!linkedin\.com)(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s|]*)?/i
const phonePattern = /(\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?[\d\s-]{7,}\d/
const dateLinePattern =
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s.-]+\d{4}\b.*?(?:present|current|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s.-]+\d{4}\b|\d{4})/i

export interface ImportResult {
  resume: ResumeState
  warnings: string[]
  extractedText: string
}

export async function importResumeFromPdf(file: File, fallback: ResumeState): Promise<ImportResult> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()

    const items = content.items.map(item => ("str" in item ? item.str : ""))
    pages.push(items.join("\n"))
  }

  const extractedText = pages.join("\n")
  const normalizedLines = normalizeLines(extractedText)
  const sections = splitSections(normalizedLines)
  const basics = parseBasics(normalizedLines, sections, fallback)

  const experience = parseExperience(sections.experience)
  const projects = parseProjects(sections.projects)
  const education = parseEducation(sections.education)
  const certifications = parseCertifications(sections.certifications)
  const warnings: string[] = []

  if (!basics.name) warnings.push("Could not confidently detect the candidate name.")
  if (!experience.length) warnings.push("Work experience could not be mapped cleanly. Review imported entries.")
  if (!education.length) warnings.push("Education section was not confidently detected.")

  return {
    extractedText,
    warnings,
    resume: {
      basics,
      experience: experience.length ? experience : fallback.experience,
      projects: projects.length ? projects : fallback.projects,
      education: education.length ? education : fallback.education,
      certifications,
      targeting: fallback.targeting
    }
  }
}

function normalizeLines(text: string) {
  return text
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
}

function splitSections(lines: string[]): ParsedSectionMap {
  const sections: ParsedSectionMap = {
    summary: [],
    experience: [],
    projects: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    other: []
  }

  let current: keyof ParsedSectionMap = "other"

  for (const line of lines) {
    const match = SECTION_TITLES.find(([, pattern]) => pattern.test(line))

    if (match) {
      current = match[0]
      continue
    }

    sections[current].push(line)
  }

  return sections
}

function parseBasics(lines: string[], sections: ParsedSectionMap, fallback: ResumeState) {
  const firstLines = lines.slice(0, 12)
  const headerText = firstLines.join(" | ")
  const contacts = lines.slice(0, 20).join(" | ")

  const name =
    firstLines.find(
      line =>
        !emailPattern.test(line) &&
        !phonePattern.test(line) &&
        !linkedInPattern.test(line) &&
        !SECTION_TITLES.some(([, pattern]) => pattern.test(line)) &&
        line.length > 3 &&
        line.length < 60
    ) ?? ""

  const summary = sections.summary.join(" ").trim()
  const skills = parseSkillLines(sections.skills)
  const languages = sections.languages.join("\n")

  return {
    name,
    email: headerText.match(emailPattern)?.[0] ?? "",
    phone: contacts.match(phonePattern)?.[0]?.trim() ?? "",
    linkedin: headerText.match(linkedInPattern)?.[0] ?? "",
    portfolio: extractPortfolio(headerText),
    location: extractLocation(firstLines, fallback.basics.location),
    objective: summary,
    skills,
    languages
  }
}

function extractPortfolio(text: string) {
  const matches = Array.from(text.matchAll(new RegExp(portfolioPattern.source, "ig"))).map(
    match => match[0]
  )
  return matches.find(match => !linkedInPattern.test(match)) ?? ""
}

function extractLocation(lines: string[], fallback: string) {
  const locationLine = lines.find(
    line =>
      !emailPattern.test(line) &&
      !phonePattern.test(line) &&
      !linkedInPattern.test(line) &&
      /,/.test(line) &&
      !dateLinePattern.test(line)
  )

  return locationLine ?? fallback
}

function parseSkillLines(lines: string[]) {
  const cleaned = lines
    .flatMap(line => line.split(/[|,•]/))
    .map(item => item.trim())
    .filter(item => item.length > 1)

  return Array.from(new Set(cleaned)).join(", ")
}

function parseExperience(lines: string[]): Experience[] {
  const blocks = splitBlocks(lines)

  return blocks
    .map(block => {
      const bullets = block.filter(line => /^[•\-–]/.test(line)).map(cleanBullet)
      const nonBullets = block.filter(line => !/^[•\-–]/.test(line))
      const dateLine = nonBullets.find(line => dateLinePattern.test(line)) ?? ""
      const headerLines = nonBullets.filter(line => line !== dateLine)

      const [firstHeader = "", secondHeader = "", thirdHeader = ""] = headerLines
      const [start = "", end = ""] = extractDates(dateLine)
      const companyFirst = !looksLikeRole(firstHeader)

      return {
        company: companyFirst ? firstHeader : secondHeader,
        role: companyFirst ? secondHeader : firstHeader,
        location: thirdHeader && !/^[•\-–]/.test(thirdHeader) ? thirdHeader : "",
        start,
        end,
        bullets: bullets.length ? bullets : nonBullets.slice(2).map(cleanBullet)
      }
    })
    .filter(item => item.company || item.role)
}

function parseProjects(lines: string[]): Project[] {
  return splitBlocks(lines)
    .map(block => {
      const [name = "", ...rest] = block
      const skillsLine = rest.find(line => /^skills[:\s]/i.test(line))
      const desc = rest.filter(line => line !== skillsLine).join(" ")

      return {
        name,
        desc,
        skills: skillsLine?.replace(/^skills[:\s]*/i, "") ?? ""
      }
    })
    .filter(item => item.name)
}

function parseEducation(lines: string[]): Education[] {
  return splitBlocks(lines)
    .map(block => {
      const dateLine = block.find(line => dateLinePattern.test(line)) ?? ""
      const header = block.filter(line => line !== dateLine)
      const [degree = "", school = ""] = header
      const [start = "", end = ""] = extractDates(dateLine)

      return { degree, school, start, end }
    })
    .filter(item => item.degree || item.school)
}

function parseCertifications(lines: string[]): Certification[] {
  return splitBlocks(lines)
    .map(block => {
      const [name = "", issuer = "", date = ""] = block
      return { name, issuer, date }
    })
    .filter(item => item.name)
}

function splitBlocks(lines: string[]) {
  const blocks: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    const startsNewBlock =
      current.length > 0 &&
      !/^[•\-–]/.test(line) &&
      (dateLinePattern.test(line) ||
        /^[A-Z][A-Za-z0-9&.,'()/+\s-]{2,}$/.test(line))

    if (startsNewBlock && current.some(entry => /^[•\-–]/.test(entry) || dateLinePattern.test(entry))) {
      blocks.push(current)
      current = [line]
      continue
    }

    current.push(line)
  }

  if (current.length) {
    blocks.push(current)
  }

  return blocks
}

function extractDates(line: string) {
  const matches =
    line.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}\b|\bPresent\b|\bCurrent\b|\b\d{4}\b/gi) ?? []

  return [matches[0] ?? "", matches[1] ?? ""]
}

function looksLikeRole(value: string) {
  return /(developer|engineer|designer|manager|lead|intern|consultant|specialist|analyst|founder)/i.test(
    value
  )
}

function cleanBullet(value: string) {
  return value.replace(/^[•\-–]\s*/, "").trim()
}
