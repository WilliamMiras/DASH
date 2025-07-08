"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, MessageSquare, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatStorage, type ChatSession } from "@/lib/chat-storage"
import { formatDistanceToNow } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  currentSessionId: string | null
  onSessionSelect: (session: ChatSession) => void
  onNewChat: () => void
}

/**
 * Chat Sidebar Component
 *
 * Displays a list of previous chat sessions with the ability to:
 * - View and select previous conversations
 * - Create new chats
 * - Delete existing chats
 * - Show session metadata (title, timestamp, message count)
 */
export default function ChatSidebar({ currentSessionId, onSessionSelect, onNewChat }: ChatSidebarProps) {
  // State to store all chat sessions
  const [sessions, setSessions] = useState<ChatSession[]>([])

  /**
   * Refresh sessions from localStorage
   * Called whenever we need to update the sidebar with latest data
   */
  const refreshSessions = () => {
    setSessions(ChatStorage.getSessions())
  }

  /**
   * Initialize sessions and set up storage listener
   * Keeps sidebar in sync with localStorage changes across tabs
   */
  useEffect(() => {
    refreshSessions()

    // Listen for storage changes to keep sidebar in sync across browser tabs
    const handleStorageChange = () => refreshSessions()
    window.addEventListener("storage", handleStorageChange)

    // Cleanup listener on component unmount
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  /**
   * Refresh sessions when current session changes
   * Ensures sidebar shows updated message counts and timestamps
   */
  useEffect(() => {
    refreshSessions()
  }, [currentSessionId])

  /**
   * Handle deleting a chat session
   * Removes session from storage and starts new chat if current session was deleted
   */
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    // Prevent event bubbling to avoid triggering session selection
    e.stopPropagation()

    // Remove session from storage
    ChatStorage.deleteSession(sessionId)
    refreshSessions()

    // If we're deleting the current session, start a new chat
    if (currentSessionId === sessionId) {
      onNewChat()
    }
  }

  return (
    // Sidebar container - full height with border
    <div className="w-80 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-400">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 theme-text">Chats</h2>
          <Button
            onClick={onNewChat}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-2">
          {sessions.length === 0 ? (
            // Empty state when no chat sessions exist
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2 transition-all duration-300" />
              <p className="text-sm text-slate-500 dark:text-slate-400 theme-text">No previous chats</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 theme-text">
                Start a conversation to see it here
              </p>
            </div>
          ) : (
            // List of chat sessions
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group relative flex items-start p-3 rounded-lg cursor-pointer transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02]",
                    // Highlight current session
                    currentSessionId === session.id &&
                      "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 scale-[1.02]",
                  )}
                  onClick={() => onSessionSelect(session)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate pr-2 theme-text">
                        {session.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-all duration-300 hover:scale-110"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 theme-text">
                      <Clock className="w-3 h-3 mr-1 transition-all duration-300" />
                      <span>{formatDistanceToNow(session.updatedAt, { addSuffix: true })}</span>
                      <span className="mx-2">•</span>
                      <span>{session.messages.length} messages</span>
                    </div>
                    {session.messages.length > 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate theme-text">
                        {session.messages[session.messages.length - 1].content.substring(0, 60)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
