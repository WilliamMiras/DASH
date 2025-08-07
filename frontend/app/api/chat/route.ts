import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

/**
 * Proxy to AWS Lambda for dataset scouting
 *
 * - Reads Lambda URL from Vercel Environment Variables (server-side only)
 * - Forwards the user's query to Lambda
 * - Returns the Lambda response as JSON directly to the client
 *
 *
 * Optional fallbacks supported:
 *   AWS_LAMBDA_DATASET_URL or NEXT_PUBLIC_LAMBDA_DATASET_URL
 */
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { query } = await req.json().catch(() => ({ query: "" }))

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'query' in request body." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const lambdaUrl =
      process.env.NEXT_PUBLIC_LAMBDA_ENDPOINT ||
      process.env.AWS_LAMBDA_DATASET_URL ||
      process.env.NEXT_PUBLIC_LAMBDA_DATASET_URL

    if (!lambdaUrl) {
      return new Response(JSON.stringify({ error: "Lambda URL not configured. Set LAMBDA_DATASET_URL in Vercel." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Call your Lambda with the expected payload
    const lambdaRes = await fetch(lambdaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Your lambda_handler expects { body: '{"query": "..."}' } when behind API Gateway/Lambda URL,
      // but AWS maps POST body directly to event.body string. Sending JSON here is correct.
      body: JSON.stringify({ query }),
    })

    const text = await lambdaRes.text()

    if (!lambdaRes.ok) {
      // Try to pass through Lambda error details if present
      let errJson: any = null
      try {
        errJson = JSON.parse(text)
      } catch {
        // keep text as-is
      }

      return new Response(
        JSON.stringify({
          error: "Lambda invocation failed",
          status: lambdaRes.status,
          details: errJson || text,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      )
    }

    // Your Lambda returns Content-Type: application/json with a JSON string body
    // which is the structured Pydantic response. Pass it through as JSON.
    // If the body isn't valid JSON for some reason, return it as text/json anyway.
    try {
      JSON.parse(text) // validate
      return new Response(text, { status: 200, headers: { "Content-Type": "application/json" } })
    } catch {
      return new Response(text, { status: 200, headers: { "Content-Type": "application/json" } })
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: "Server error while proxying to Lambda",
        message: error?.message || String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
