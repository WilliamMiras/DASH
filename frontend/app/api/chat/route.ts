export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const query = body.query || body.input || (body.messages && body.messages[body.messages.length - 1]?.content) || "";

  const response = await fetch(process.env.NEXT_PUBLIC_DASH_BACK_API!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  let data = await response.json();

  // If the backend response has a stringified body, parse it and map to the expected format for chat UIs
  if (typeof data.body === "string") {
    try {
      const parsed = JSON.parse(data.body);
      // Return as a chat message array for useChat or similar hooks
      return new Response(
        JSON.stringify([
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Summary: ${parsed.summary}\nRelevancy: ${parsed.relevancyExplained}\nSources: ${(parsed.sources || []).join(", ")}`,
            summary: parsed.summary,
            relevancyExplained: parsed.relevancyExplained,
            sources: parsed.sources,
          },
        ]),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch {
      // fallback: keep as is
    }
  }

  // If already parsed, map to the expected format
  if (data.summary && data.relevancyExplained && data.sources) {
    return new Response(
      JSON.stringify([
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Summary: ${data.summary}\nRelevancy: ${data.relevancyExplained}\nSources: ${(data.sources || []).join(", ")}`,
          summary: data.summary,
          relevancyExplained: data.relevancyExplained,
          sources: data.sources,
        },
      ]),
      {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}