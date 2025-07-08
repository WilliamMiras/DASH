"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User } from "lucide-react"

interface MessageBubbleProps {
  message: {
    id: string
    role: "user" | "assistant"
    content: string
  }
}

/**
 * Message Bubble Component
 *
 * Renders individual chat messages with different styling for user vs AI messages.
 * Features:
 * - Different alignment and colors for user vs AI messages
 * - Avatar icons to distinguish message senders
 * - Hover effects and smooth transitions
 * - Timestamp display
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  // Determine if this is a user message (vs AI assistant message)
  const isUser = message.role === "user"

  return (
    // Message container with conditional alignment
    <div
      className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""} transition-all duration-300 hover:scale-[1.01]`}
    >
      <Avatar className="w-8 h-8 flex-shrink-0 transition-all duration-300">
        <AvatarFallback
          className={
            isUser
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all duration-300" // User avatar - blue gradient
              : "bg-gradient-to-r from-purple-500 to-pink-500 text-white transition-all duration-300" // AI avatar - purple gradient
          }
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={`flex-1 max-w-[80%] ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block p-4 rounded-2xl transition-all duration-300 hover:shadow-lg ${
            isUser
              ? // User message styling - blue gradient background
                "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md shadow-lg hover:from-blue-600 hover:to-blue-700"
              : // AI message styling - light background with border
                "bg-slate-100 hover:bg-slate-150 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-slate-100 rounded-bl-md border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 px-2 theme-text">
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  )
}
