export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  // Try to extract the user input from different possible keys
  const query = body.query || body.input || (body.messages && body.messages[body.messages.length - 1]?.content) || "";

  console.log("Received in route.ts:", body, "Extracted query:", query);

  const response = await fetch(process.env.NEXT_PUBLIC_DASH_BACK_API!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}