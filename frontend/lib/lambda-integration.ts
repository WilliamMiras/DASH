/**
 * AWS Lambda Integration Utility
 *
 * This module handles communication with AWS Lambda functions.
 * It provides a standardized way to invoke Lambda functions and handle responses.
 * Environment variables are pulled from Vercel's Environment Variable settings.
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
 * Pulls configuration from Vercel Environment Variables.
 */
export class LambdaIntegration {
  private static readonly DEFAULT_TIMEOUT = 45000 // 45 seconds for dataset scouting
  private static readonly DEFAULT_REGION = "us-east-1"

  /**
   * Get the Lambda endpoint from Vercel Environment Variables
   * This pulls from your Vercel project's Environment Variable settings
   */
  private static getLambdaEndpoint(): string {
    const endpoint = process.env.NEXT_PUBLIC_LAMBDA_ENDPOINT

    if (!endpoint) {
      console.error(`❌ [Lambda Integration] NEXT_PUBLIC_LAMBDA_ENDPOINT not found in Vercel Environment Variables`)
      throw new Error(
        "Lambda endpoint not configured. Please set NEXT_PUBLIC_LAMBDA_ENDPOINT in your Vercel project settings.",
      )
    }

    console.log(`🔗 [Lambda Integration] Using endpoint from Vercel Environment Variables: ${endpoint}`)
    return endpoint
  }

  /**
   * Get optional API key from Vercel Environment Variables
   * This is optional and only used if you have authentication enabled
   */
  private static getApiKey(): string | null {
    const apiKey = process.env.NEXT_PUBLIC_LAMBDA_API_KEY

    if (apiKey) {
      console.log(`🔑 [Lambda Integration] API key found in Vercel Environment Variables`)
      return apiKey
    }

    console.log(`🔓 [Lambda Integration] No API key configured (this is optional)`)
    return null
  }

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

      // 🔗 LAMBDA INTEGRATION: Get endpoint from Vercel Environment Variables
      const lambdaEndpoint = this.getLambdaEndpoint()
      const apiKey = this.getApiKey()

      console.log(`🚀 [Lambda Integration] Calling DASH backend at: ${lambdaEndpoint}`)
      console.log(`📦 [Lambda Integration] Payload:`, payload)

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      // Add API key if available from Vercel Environment Variables
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`
        console.log(`🔑 [Lambda Integration] Added API key to request headers`)
      }

      // 📤 LAMBDA INTEGRATION: Send request in format your backend expects
      const response = await fetch(lambdaEndpoint, {
        method: "POST",
        headers,
        // 🎯 CRITICAL: Your Lambda expects { body: { query: "..." } }
        body: JSON.stringify({
          body: JSON.stringify(payload), // Double stringify to match your Lambda handler
        }),
        signal: controller.signal,
      })

      // Clear the timeout since request completed
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [Lambda Integration] HTTP Error ${response.status}: ${errorText}`)
        throw new Error(`DASH backend request failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      console.log(`✅ [Lambda Integration] Success response from DASH:`, result)

      // 📥 LAMBDA INTEGRATION: Handle your backend's response format
      // Your Lambda returns the structured response directly or an error
      if (result.error) {
        console.warn(`⚠️ [Lambda Integration] Backend returned error:`, result.error)
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

      // Handle different types of errors with specific messaging
      if (error.message?.includes("Lambda endpoint not configured")) {
        return {
          success: false,
          error: "Configuration error",
          message: "Backend configuration missing. Please check Vercel Environment Variables.",
        }
      }

      if (error.name === "AbortError") {
        return {
          success: false,
          error: "Request timed out",
          message: "I'm sorry I must've tripped while I was scouting. Please refresh and try again.",
        }
      }

      if (
        error.message?.includes("fetch") ||
        error.message?.includes("network") ||
        error.message?.includes("Failed to fetch")
      ) {
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
   * Uses endpoint configured in Vercel Environment Variables.
   *
   * @param query - User's dataset query
   * @returns Promise<LambdaResponse> - Dataset recommendations or error message
   */
  static async scoutDatasets(query: string): Promise<LambdaResponse> {
    console.log(`🔍 [Dataset Scouting] Starting search for: "${query}"`)

    // Validate query before sending
    if (!query || query.trim().length === 0) {
      console.warn(`⚠️ [Dataset Scouting] Empty query provided`)
      return {
        success: false,
        error: "Empty query",
        message: "Please provide a dataset query to search for.",
      }
    }

    return await this.invokeLambda({
      payload: {
        query: query.trim(), // This matches your backend's expected format: body.query
      },
      timeout: 60000, // Longer timeout for dataset scouting with search
    })
  }

  /**
   * Test Lambda connection
   *
   * Use this method to verify your Lambda integration is working correctly.
   * This will send a simple test query to your backend using Vercel Environment Variables.
   *
   * @returns Promise<LambdaResponse> - Connection test result
   */
  static async testConnection(): Promise<LambdaResponse> {
    console.log(`🧪 [Lambda Integration] Testing connection to DASH backend...`)

    try {
      // First, verify the endpoint is configured
      const endpoint = this.getLambdaEndpoint()
      console.log(`✅ [Lambda Integration] Endpoint configured: ${endpoint}`)

      // Send a simple test query
      return await this.invokeLambda({
        payload: {
          query: "test connection - find sample datasets", // Simple test query
        },
        timeout: 30000,
      })
    } catch (error: any) {
      console.error(`❌ [Lambda Integration] Connection test failed:`, error)
      return {
        success: false,
        error: error.message,
        message: error.message?.includes("Lambda endpoint not configured")
          ? "Please configure NEXT_PUBLIC_LAMBDA_ENDPOINT in your Vercel project settings."
          : "I'm sorry I must've tripped while I was scouting. Please refresh and try again.",
      }
    }
  }

  /**
   * Get current configuration status
   * Useful for debugging and setup verification
   */
  static getConfigurationStatus(): {
    endpointConfigured: boolean
    apiKeyConfigured: boolean
    endpoint?: string
  } {
    const endpoint = process.env.NEXT_PUBLIC_LAMBDA_ENDPOINT
    const apiKey = process.env.NEXT_PUBLIC_LAMBDA_API_KEY

    return {
      endpointConfigured: !!endpoint,
      apiKeyConfigured: !!apiKey,
      endpoint: endpoint || undefined,
    }
  }
}