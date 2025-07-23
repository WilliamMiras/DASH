import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { LambdaIntegration } from "@/lib/lambda-integration"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get the latest user message to check if we need Lambda integration
  const latestMessage = messages[messages.length - 1]
  const userQuery = latestMessage?.content || ""

  console.log(`💬 [Chat API] Processing message: "${userQuery.substring(0, 100)}..."`)

  // 🔗 LAMBDA INTEGRATION POINT #1: Dataset Scouting Detection
  // Check if the user is asking for dataset recommendations
  const isDatasetQuery = /dataset|data|find.*data|recommend.*data|scout|search.*data|machine learning|ML|AI|analysis|csv|json|database/i.test(userQuery)

    if (isDatasetQuery) {
    console.log(`🎯 [Chat API] Dataset query detected, invoking DASH backend...`);
  
    try {
      // 🚀 LAMBDA INTEGRATION POINT #2: DASH Backend Invocation
      const lambdaResponse = await LambdaIntegration.scoutDatasets(userQuery);
      if (lambdaResponse.success && lambdaResponse.data) {
        console.log(`✅ [Chat API] DASH backend returned data, streaming to frontend...`);
        const dashData = lambdaResponse.data;
        // Use streamText to stream the response as expected by the AI SDK, with specificationVersion
        return streamText({
          specificationVersion: "v1",
          text: dashData.summary || "See details below.",
          id: Date.now().toString(),
          role: "assistant",
          data: {
            summary: dashData.summary,
            relevancyExplained: dashData.relevancyExplained,
            sources: dashData.sources,
            tools_used: dashData.tools_used,
          }
        });
      } else {
        console.log(`⚠️ [Chat API] DASH backend returned no data or failed, using fallback message`);
        const errorMessage =
          lambdaResponse.message || "I'm sorry I must've tripped while I was scouting. Please refresh and try again.";
        return new Response(
          JSON.stringify({ error: errorMessage }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (error) {
      console.error(`❌ [Chat API] DASH backend integration error:`, error);
      return new Response(
        JSON.stringify({ error: "DASH backend integration error. Please try again later." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}
