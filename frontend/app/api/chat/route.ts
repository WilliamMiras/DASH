export const maxDuration = 30;

export async function POST(req: Request) {
  const { query } = await req.json();

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