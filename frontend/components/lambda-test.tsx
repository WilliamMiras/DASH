"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LambdaIntegration } from "@/lib/lambda-integration"
import { Loader2, TestTube, CheckCircle, XCircle, Zap } from 'lucide-react'

/**
 * DASH Backend Testing Component
 *
 * This component allows you to test your DASH backend integration directly
 * without going through the chat interface. Useful for development and debugging.
 */
export function LambdaTest() {
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isTestingDataset, setIsTestingDataset] = useState(false)
  const [testQuery, setTestQuery] = useState("Find datasets for machine learning image classification")
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const [datasetResult, setDatasetResult] = useState<any>(null)

  /**
   * Test DASH backend connection health
   */
  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionResult(null)

    try {
      console.log(`🧪 [DASH Test] Testing connection to backend...`)
      const result = await LambdaIntegration.testConnection()
      setConnectionResult(result)
      console.log(`📊 [DASH Test] Connection result:`, result)
    } catch (error) {
      console.error(`❌ [DASH Test] Connection test failed:`, error)
      setConnectionResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "I'm sorry I must've tripped while I was scouting. Please refresh and try again.",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  /**
   * Test DASH dataset scouting functionality
   */
  const testDatasetScouting = async () => {
    if (!testQuery.trim()) return

    setIsTestingDataset(true)
    setDatasetResult(null)

    try {
      console.log(`🔍 [DASH Test] Testing dataset scouting with query: "${testQuery}"`)
      const result = await LambdaIntegration.scoutDatasets(testQuery)
      setDatasetResult(result)
      console.log(`📊 [DASH Test] Dataset scouting result:`, result)
    } catch (error) {
      console.error(`❌ [DASH Test] Dataset scouting test failed:`, error)
      setDatasetResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "I'm sorry I must've tripped while I was scouting. Please refresh and try again.",
      })
    } finally {
      setIsTestingDataset(false)
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🧪 DASH Backend Testing</h2>
        <p className="text-muted-foreground">Test your Vercel-deployed DASH backend integration</p>
      </div>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Backend Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConnection} disabled={isTestingConnection} className="w-full">
            {isTestingConnection ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing DASH Backend...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Test DASH Backend Connection
              </>
            )}
          </Button>

          {connectionResult && (
            <div className="mt-4 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {connectionResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <Badge variant={connectionResult.success ? "default" : "destructive"}>
                  {connectionResult.success ? "Success" : "Failed"}
                </Badge>
              </div>
              <pre className="text-sm bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(connectionResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dataset Scouting Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            DASH Dataset Scouting Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Enter a dataset query to test..."
            className="w-full"
          />

          <Button onClick={testDatasetScouting} disabled={isTestingDataset || !testQuery.trim()} className="w-full">
            {isTestingDataset ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                DASH is Scouting...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Test DASH Dataset Scouting
              </>
            )}
          </Button>

          {datasetResult && (
            <div className="mt-4 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {datasetResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <Badge variant={datasetResult.success ? "default" : "destructive"}>
                  {datasetResult.success ? "Success" : "Failed"}
                </Badge>
              </div>
              
              {/* Display DASH response in a more readable format */}
              {datasetResult.success && datasetResult.data ? (
                <div className="space-y-3">
                  {datasetResult.data.summary && (
                    <div>
                      <h4 className="font-semibold text-sm">Summary:</h4>
                      <p className="text-sm text-muted-foreground">{datasetResult.data.summary}</p>
                    </div>
                  )}
                  
                  {datasetResult.data.relevancyExplained && (
                    <div>
                      <h4 className="font-semibold text-sm">Relevancy:</h4>
                      <p className="text-sm text-muted-foreground">{datasetResult.data.relevancyExplained}</p>
                    </div>
                  )}
                  
                  {datasetResult.data.sources && datasetResult.data.sources.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm">Sources:</h4>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {datasetResult.data.sources.map((source: string, index: number) => (
                          <li key={index}>{source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {datasetResult.data.tools_used && datasetResult.data.tools_used.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm">Tools Used:</h4>
                      <p className="text-sm text-muted-foreground">{datasetResult.data.tools_used.join(', ')}</p>
                    </div>
                  )}
                </div>
              ) : (
                <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-96">
                  {JSON.stringify(datasetResult, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 DASH Backend Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p>
              <strong>1. Environment Variable:</strong>
            </p>
            <code className="block bg-muted p-2 rounded text-xs">
              NEXT_PUBLIC_LAMBDA_ENDPOINT=https://your-vercel-backend.vercel.app
            </code>

            <p>
              <strong>2. Your Backend Structure:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Lambda function expects: <code>{"{ body: { query: 'user query' } }"}</code></li>
              <li>Returns DataQuery object with: summary, relevancyExplained, sources, tools_used</li>
              <li>Uses LangChain with SerpAPI for web search</li>
              <li>Deployed on Vercel with CORS enabled</li>
            </ul>

            <p>
              <strong>3. Expected Response Format:</strong>
            </p>
            <code className="block bg-muted p-2 rounded text-xs">
              {`{
  "summary": "Dataset summary...",
  "relevancyExplained": "Why these datasets are relevant...",
  "sources": ["url1", "url2", "url3"],
  "tools_used": ["serpapi_search"]
}`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

