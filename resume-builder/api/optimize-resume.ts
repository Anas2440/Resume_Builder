import type { ResumeState, ResumeTargeting } from "../src/types/resume"
import { optimizeResumeWithGemini } from "../services/geminiService"

interface ApiRequest extends AsyncIterable<Buffer> {
  method?: string
  body?: unknown
}

interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (payload: unknown) => void
  setHeader?: (name: string, value: string) => void
  end?: (payload?: string) => void
}

async function readBody(req: ApiRequest) {
  if (req.body && typeof req.body === "object") {
    return req.body
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body)
  }

  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const raw = Buffer.concat(chunks).toString("utf8")

  return raw ? JSON.parse(raw) : {}
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader?.("Allow", "POST")
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  try {
    const body = (await readBody(req)) as {
      resume?: ResumeState
      targeting?: ResumeTargeting
    }

    if (!body.resume || !body.targeting) {
      res.status(400).json({ error: "Missing resume or targeting payload" })
      return
    }

    const result = await optimizeResumeWithGemini(body.resume, body.targeting)

    res.status(200).json(result)
  } catch (error) {
    console.error("Resume optimization failed", error)
    res.status(500).json({
      error: error instanceof Error ? error.message : "Resume optimization failed"
    })
  }
}
