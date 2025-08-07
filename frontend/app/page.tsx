"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, Sparkles } from 'lucide-react'
import { MessageBubble } from "@/components/message-bubble"
import { ChatStorage, type ChatSession } from "@/lib/chat-storage"
import ChatSidebar from "@/components/chat-sidebar"
import ThemeSlider from "@/components/theme-slider"
import ThemeTransitionWrapper from "@/components/theme-transition-wrapper"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

/**
 * Format the Lambda's structured response to a readable assistant message.
 * Lambda returns:
 *  { summary: string, relevancyExplained: string, sources: string[], tools_used: string[] }
 */
function formatLambdaResponse(data: {
  summary?: string
  relevancyExplained?: string
  sources?: string[]
  tools_used?: string[]
}) {
  const parts: string[] = []

  if (data.summary) {
    parts.push(`Summary:\n${data.summary}`)
  }

  if (data.relevancyExplained) {
    parts.push(`Why this is relevant:\n${data.relevancyExplained}`)
  }

  if (Array.isArray(data.sources) && data.sources.length) {
    parts.push(`Sources:\n${data.sources.map((s) => `- ${s}`).join("\n")}`)
  }

  if (Array.isArray(data.tools_used) && data.tools_used.length) {
    parts.push(`Tools used:\n${data.tools_used.map((t) => `- ${t}`).join("\n")}`)
  }

  // Fallback if nothing matched
  if (parts.length === 0) {
    parts.push("I found results, but couldn't format them. Please try again.")
  }

  return parts.join("\n\n")
}

/**
 * Main AI Agent Interface Component
 */
export default function AIAgentInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Persist sessions to localStorage
  useEffect(() => {
    if (!mounted || messages.length === 0) return
    const sessionId = currentSessionId || `session-${Date.now()}`
    if (!currentSessionId) setCurrentSessionId(sessionId)

    const session: ChatSession = {
      id: sessionId,
      title: ChatStorage.generateTitle(messages[0]?.content || "New Chat"),
      messages,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    ChatStorage.saveSession(session)
  }, [messages, currentSessionId, mounted])

  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSessionId(session.id)
    setMessages(session.messages)
  }

  const handleNewChat = () => {
    setCurrentSessionId(null)
    setMessages([])
    setInput("")
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  /**
   * Send message via our server proxy to AWS Lambda.
   * - POST /api/chat with { query }
   * - Expects Lambda JSON body: { summary, relevancyExplained, sources, tools_used }
   */
  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage }),
      })

      const text = await res.text()
      if (!res.ok) {
        // Try to parse and surface error details from the proxy
        let err: any = null
        try {
          err = JSON.parse(text)
        } catch {
          // keep raw text
        }
        throw new Error(
          err?.details?.error ||
            err?.error ||
            `Lambda error. Status ${res.status}. ${typeof text === "string" ? text : ""}`,
        )
      }

      // Parse the Lambda success JSON (structured Pydantic output)
      let data: any = {}
      try {
        data = JSON.parse(text)
      } catch {
        // If parsing fails, treat as plain text
        data = { summary: text }
      }

      const content = formatLambdaResponse(data)
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (error) {
      console.error("Error sending message:", error)

      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry I must've tripped while I was scouting. Please refresh and try again.",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage(input.trim())
    }
  }

  return (
    <ThemeTransitionWrapper>
      <div className="h-screen gradient-bg bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="h-full">
          <ChatSidebar
            currentSessionId={currentSessionId}
            onSessionSelect={handleSessionSelect}
            onNewChat={handleNewChat}
          />
        </div>

        {/* Main Chat */}
        <div className="flex-1 flex flex-col h-full">
          <div className="flex-1 flex flex-col p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-2">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center transition-all duration-300">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 transition-all duration-300"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    DASH
                  </h1>
                  <p className="text-sm text-muted-foreground theme-text">Your AI Dataset Scout</p>
                </div>
              </div>
              <ThemeSlider />
            </div>

            {/* Chat container */}
            <Card className="flex-1 flex flex-col shadow-xl border border-slate-200 dark:border-slate-700 theme-card bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
              <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-300">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 theme-text">
                        Welcome to DASH
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-2 theme-text">
                        Tell me about your project and dataset needs and I'll find the best dataset to help you get
                        started.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}

                    {isLoading && (
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white transition-all duration-300">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="inline-block p-4 rounded-2xl rounded-bl-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-300">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                              <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-4 transition-all duration-400">
                <form onSubmit={handleSubmit} className="flex space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Type your message..."
                      className="pr-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-800 transition-all duration-300"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ThemeTransitionWrapper>
  )
}
