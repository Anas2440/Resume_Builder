import type { ResumeState, ResumeTargeting } from "../../src/types/resume"
import { optimizeResumeWithGemini } from "../../services/geminiService"

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    const body = (await request.json()) as {
      resume?: ResumeState
      targeting?: ResumeTargeting
    }

    if (!body.resume || !body.targeting) {
      return Response.json({ error: "Missing resume or targeting payload" }, { status: 400 })
    }

    const result = await optimizeResumeWithGemini(body.resume, body.targeting)

    return Response.json(result)
  } catch (error) {
    console.error("Resume optimization failed", error)

    return Response.json(
      { error: error instanceof Error ? error.message : "Resume optimization failed" },
      { status: 500 }
    )
  }
}
