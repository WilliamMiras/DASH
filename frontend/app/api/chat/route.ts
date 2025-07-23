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
    console.log(`🎯 [Chat API] Dataset query detected, invoking DASH backend...`)

    try {
      // 🚀 LAMBDA INTEGRATION POINT #2: DASH Backend Invocation
      // This calls your Vercel-deployed Lambda function
      const lambdaResponse = await LambdaIntegration.scoutDatasets(userQuery)

      if (lambdaResponse.success && lambdaResponse.data) {
        console.log(`✅ [Chat API] DASH backend returned data, formatting response...`)

        // 📤 LAMBDA INTEGRATION POINT #3: DASH Response Processing
        // Your backend returns a DataQuery object with specific structure
        const dashData = lambdaResponse.data
        
        // Format the DASH response for the AI to use
        let formattedDatasetInfo = ""
        
        if (dashData.summary) {
          formattedDatasetInfo += `Dataset Summary: ${dashData.summary}\n\n`
        }
        
        if (dashData.relevancyExplained) {
          formattedDatasetInfo += `Relevancy Explanation: ${dashData.relevancyExplained}\n\n`
        }
        
        if (dashData.sources && dashData.sources.length > 0) {
          formattedDatasetInfo += `Dataset Sources:\n${dashData.sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}\n\n`
        }
        
        if (dashData.tools_used && dashData.tools_used.length > 0) {
          formattedDatasetInfo += `Research Tools Used: ${dashData.tools_used.join(', ')}\n\n`
        }

        // Create an enhanced system prompt with DASH data
        const enhancedSystemPrompt = `You are DASH, a helpful AI Dataset Scout. You help users find the perfect datasets for their projects.

IMPORTANT: You have just received fresh dataset recommendations from your advanced scouting system:

${formattedDatasetInfo}

Use this information to provide a comprehensive and helpful response to the user. Present the datasets in a clear, organized manner with:

1. **Dataset Summary** - Overview of what was found
2. **Why These Datasets Are Relevant** - Explain the relevancy 
3. **Dataset Sources** - List all the sources with proper formatting
4. **Next Steps** - Suggest how the user can access and use these datasets

Format your response in a friendly, professional manner. Use markdown formatting for better readability. Include clickable links where URLs are provided.

Be enthusiastic and helpful, as you've successfully found relevant datasets for the user!`

        // Stream the AI response with DASH data
          return new Response(
          JSON.stringify([
            {
              id: Date.now().toString(),
              role: "assistant",
              summary: dashData.summary,
              relevancyExplained: dashData.relevancyExplained,
              sources: dashData.sources,
              tools_used: dashData.tools_used,
              content: `Summary: ${dashData.summary}\n\nRelevancy: ${dashData.relevancyExplained}\n\nSources:\n${(dashData.sources || []).join('\n')}`,
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      } else {
        console.log(`⚠️ [Chat API] DASH backend returned no data or failed, using fallback message`)

        // 🔄 LAMBDA INTEGRATION POINT #4: DASH Error Handling
        // If DASH fails or returns no data, use the custom error message
        const errorMessage =
          lambdaResponse.message || "I'm sorry I must've tripped while I was scouting. Please refresh and try again."

        // Create a system prompt that includes the error message
        const errorSystemPrompt = `You are DASH, a helpful AI Dataset Scout. Unfortunately, your dataset scouting system encountered an issue.

Respond with this exact message: "${errorMessage}"

Then offer to help the user in other ways, such as:
- Providing general advice about where to find datasets (Kaggle, UCI ML Repository, Data.gov, etc.)
- Asking them to try again with a more specific query
- Suggesting they describe their project in more detail

Be apologetic but helpful, and maintain your friendly DASH personality.`

        const result = streamText({
          model: openai("gpt-4o"),
          system: errorSystemPrompt,
          messages,
        })

        return result.toDataStreamResponse()
      }
    } catch (error) {
      console.error(`❌ [Chat API] DASH backend integration error:`, error)

      // 🚨 LAMBDA INTEGRATION POINT #5: Critical Error Handling
      // If there's a critical error with DASH backend integration, use fallback
      const fallbackSystemPrompt = `You are DASH, a helpful AI Dataset Scout. Your dataset scouting system is currently unavailable.

Respond with this exact message: "I'm sorry I must've tripped while I was scouting. Please refresh and try again."

Then offer to help the user in other ways:
- Suggest popular dataset sources like Kaggle, UCI ML Repository, Data.gov
- Ask them to describe their project needs in more detail
- Provide general guidance about dataset selection

Be apologetic but maintain your helpful DASH personality.`

      const result = streamText({
        model: openai("gpt-4o"),
        system: fallbackSystemPrompt,
        messages,
      })

      return result.toDataStreamResponse()
    }
  }

  // 💬 LAMBDA INTEGRATION POINT #6: Non-Dataset Queries
  // For non-dataset queries, use the standard AI response without DASH backend
  console.log(`💭 [Chat API] Standard query, using AI without DASH backend integration`)

  const result = streamText({
    model: openai("gpt-4o"),
    system: `You are DASH, a helpful and intelligent AI Dataset Scout. You provide thoughtful, accurate, and engaging responses about datasets and data-related topics. 

If users ask about datasets, data sources, or data recommendations, let them know you can help scout for specific datasets if they provide more details about their project needs.

You're friendly but professional, and you adapt your communication style to be helpful for the user's needs. Keep your responses well-structured and easy to read.

For non-dataset queries, you can provide general helpful responses but always remind users that your specialty is helping find datasets for data science and machine learning projects.`,
    messages,
  })

  return result.toDataStreamResponse()
}
