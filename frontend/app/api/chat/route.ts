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

  // If the backend response has a stringified body, parse it and return only the parsed object
  if (typeof data.body === "string") {
    try {
      const parsed = JSON.parse(data.body);
      return new Response(JSON.stringify(parsed), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // fallback: keep as is
    }
  }

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}