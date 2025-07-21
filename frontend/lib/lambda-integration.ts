/**
 * AWS Lambda Integration Utility
 *
 * This module handles communication with AWS Lambda functions.
 * It provides a standardized way to invoke Lambda functions and handle responses.
 */

export interface LambdaResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export interface LambdaInvokeOptions {
  functionName?: string
  payload?: any
  region?: string
  timeout?: number
}

/**
 * AWS Lambda Integration Class
 *
 * Handles all Lambda function invocations with proper error handling,
 * timeout management, and response formatting.
 */
export class LambdaIntegration {
  private static readonly DEFAULT_TIMEOUT = 45000 // 45 seconds for dataset scouting
  private static readonly DEFAULT_REGION = "us-east-1"

  /**
   * Invoke your DASH Lambda function
   *
   * @param options - Lambda invocation options
   * @returns Promise<LambdaResponse> - Standardized response format
   */
  static async invokeLambda(options: LambdaInvokeOptions): Promise<LambdaResponse> {
    const { payload = {}, timeout = this.DEFAULT_TIMEOUT } = options

    try {
      // Create AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // 🔗 LAMBDA INTEGRATION: Your Vercel-deployed backend endpoint
      // This should match your Vercel deployment URL
      const lambdaEndpoint = process.env.NEXT_PUBLIC_LAMBDA_ENDPOINT || "https://your-vercel-backend.vercel.app"

      console.log(`🚀 [Lambda Integration] Calling DASH backend at: ${lambdaEndpoint}`)
      console.log(`📦 [Lambda Integration] Payload:`, payload)

      // 📤 LAMBDA INTEGRATION: Send request in format your backend expects
      const response = await fetch(lambdaEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add any required authentication headers here if needed
          ...(process.env.NEXT_PUBLIC_LAMBDA_API_KEY && {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_LAMBDA_API_KEY}`,
          }),
        },
        // 🎯 CRITICAL: Your Lambda expects { body: { query: "..." } }
        body: JSON.stringify({
          body: JSON.stringify(payload), // Double stringify to match your Lambda handler
        }),
        signal: controller.signal,
      })

      // Clear the timeout since request completed
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`DASH backend request failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      console.log(`✅ [Lambda Integration] Success response from DASH:`, result)

      // 📥 LAMBDA INTEGRATION: Handle your backend's response format
      // Your Lambda returns the structured response directly or an error
      if (result.error) {
        return {
          success: false,
          error: result.error,
          message: "I'm sorry I must've tripped while I was scouting. Please refresh and try again.",
        }
      }

      // Your backend returns the DataQuery structure directly
      return {
        success: true,
        data: result,
        message: "Successfully found dataset recommendations!",
      }
    } catch (error: any) {
      console.error(`❌ [Lambda Integration] Error calling DASH backend:`, error)

      // Handle different types of errors
      if (error.name === "AbortError") {
        return {
          success: false,
          error: "Request timed out",
          message: "I'm sorry I must've tripped while I was scouting. Please refresh and try again.",
        }
      }

      if (error.message?.includes("fetch") || error.message?.includes("network")) {
        return {
          success: false,
          error: "Network error",
          message: "I'm sorry I must've tripped while I was scouting. Please refresh and try again.",
        }
      }

      return {
        success: false,
        error: error.message || "Unknown error",
        message: "I'm sorry I must've tripped while I was scouting. Please refresh and try again.",
      }
    }
  }

  /**
   * Invoke Lambda function for dataset scouting
   *
   * This method calls your DASH backend with the user's dataset query.
   *
   * @param query - User's dataset query
   * @returns Promise<LambdaResponse> - Dataset recommendations or error message
   */
  static async scoutDatasets(query: string): Promise<LambdaResponse> {
    console.log(`🔍 [Dataset Scouting] Starting search for: "${query}"`)

    return await this.invokeLambda({
      payload: {
        query, // This matches your backend's expected format: body.query
      },
      timeout: 60000, // Longer timeout for dataset scouting with search
    })
  }

  /**
   * Test Lambda connection
   *
   * Use this method to verify your Lambda integration is working correctly.
   * This will send a simple test query to your backend.
   *
   * @returns Promise<LambdaResponse> - Connection test result
   */
  static async testConnection(): Promise<LambdaResponse> {
    console.log(`🧪 [Lambda Integration] Testing connection to DASH backend...`)

    return await this.invokeLambda({
      payload: {
        query: "test connection", // Simple test query
      },
      timeout: 30000,
    })
  }
}
