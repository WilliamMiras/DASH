import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai("gpt-4o"),
    system: `You are a helpful and intelligent AI assistant. You provide thoughtful, accurate, and engaging responses. You're friendly but professional, and you adapt your communication style to be helpful for the user's needs. Keep your responses well-structured and easy to read.`,
    messages,
  })

  return result.toDataStreamResponse()
}
