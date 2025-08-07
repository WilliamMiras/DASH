"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, Sparkles } from "lucide-react"
import { MessageBubble } from "@/components/message-bubble"
import { ChatStorage, type ChatSession } from "@/lib/chat-storage"
import ChatSidebar from "@/components/chat-sidebar"
import ThemeSlider from "@/components/theme-slider"
import ThemeTransitionWrapper from "@/components/theme-transition-wrapper"

// Define message type
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

/**
 * Main AI Agent Interface Component
 *
 * This is the primary component that renders the entire chat interface.
 * It manages chat state, message history, and coordinates between the sidebar and main chat area.
 */
export default function AIAgentInterface() {
  // Local state for chat functionality
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // State for tracking the current active chat session
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // State to track if component has mounted (prevents hydration issues)
  const [mounted, setMounted] = useState(false)

  // Reference to the scroll area for auto-scrolling to new messages
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  /**
   * Set mounted state to true after component mounts
   * This prevents hydration mismatches with localStorage
   */
  useEffect(() => {
    setMounted(true)
  }, [])

  /**
   * Save messages to chat history whenever messages change
   * Creates a new session if one doesn't exist, or updates existing session
   */
  useEffect(() => {
    // Don't save if component hasn't mounted or no messages exist
    if (!mounted || messages.length === 0) return

    // Generate session ID if this is a new chat
    const sessionId = currentSessionId || `session-${Date.now()}`
    if (!currentSessionId) {
      setCurrentSessionId(sessionId)
    }

    // Create session object with current messages
    const session: ChatSession = {
      id: sessionId,
      title: ChatStorage.generateTitle(messages[0]?.content || "New Chat"),
      messages: messages,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Save session to localStorage
    ChatStorage.saveSession(session)
  }, [messages, currentSessionId, mounted])

  /**
   * Handle selecting a chat session from the sidebar
   * Loads the selected session's messages into the current chat
   */
  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSessionId(session.id)
    setMessages(session.messages)
  }

  /**
   * Handle creating a new chat
   * Clears current session and messages to start fresh
   */
  const handleNewChat = () => {
    setCurrentSessionId(null)
    setMessages([])
    setInput("")
  }

  /**
   * Auto-scroll to bottom when new messages are added
   * Ensures user always sees the latest message
   */
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  /**
   * Handle input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  /**
   * Send message to AI and handle response
   */
  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return

    // Create user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      createdAt: new Date(),
    }

    // Add user message to chat
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      // Send request to our API route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      // Create assistant message
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      }

      // Add empty assistant message that we'll update
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMsg.id ? { ...msg, content: assistantMsg.content } : msg)),
      )

      // Read the stream
      const decoder = new TextDecoder()
      let assistantContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const data = JSON.parse(line.slice(2))
              if (data.type === "text-delta" && data.textDelta) {
                assistantContent += data.textDelta
                // Update the assistant message content
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === assistantMsg.id ? { ...msg, content: assistantContent } : msg)),
                )
              }
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)

      // Add error message
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

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage(input.trim())
    }
  }

  return (
    <ThemeTransitionWrapper>
      {/* Main container with gradient background that changes with theme */}
      <div className="h-screen gradient-bg bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex overflow-hidden">
        {/* Left Sidebar - Chat History */}
        <div className="h-full">
          <ChatSidebar
            currentSessionId={currentSessionId}
            onSessionSelect={handleSessionSelect}
            onNewChat={handleNewChat}
          />
        </div>

        {/* Main Chat Area - Right Side */}
        <div className="flex-1 flex flex-col h-full">
          <div className="flex-1 flex flex-col p-4">
            {/* Header with branding and theme slider */}
            <div className="flex items-center justify-between mb-6 pt-2">
              <div className="flex items-center space-x-3">
                {/* App logo/icon */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center transition-all duration-300">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  {/* Online status indicator */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 transition-all duration-300"></div>
                </div>

                {/* App title and description */}
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    DASH
                  </h1>
                  <p className="text-sm text-muted-foreground theme-text">Your AI Dataset Scout</p>
                </div>
              </div>

              {/* Theme toggle slider */}
              <ThemeSlider />
            </div>

            {/* Main chat container */}
            <Card className="flex-1 flex flex-col shadow-xl border border-slate-200 dark:border-slate-700 theme-card bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
              {/* Messages area */}
              <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                  /* Empty state - shown when no messages exist */
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
                  /* Messages list - shown when messages exist */
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}

                    {/* Loading indicator while AI is responding */}
                    {isLoading && (
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white transition-all duration-300">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="inline-block p-4 rounded-2xl rounded-bl-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-300">
                            {/* Animated typing dots */}
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input form for sending messages */}
              <div className="border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-4 transition-all duration-400">
                <form onSubmit={handleSubmit} className="flex space-x-3">
                  {/* Text input field */}
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Type your message..."
                      className="pr-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-800 transition-all duration-300"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Send button */}
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
