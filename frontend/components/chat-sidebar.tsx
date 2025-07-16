"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, MessageSquare, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatStorage, type ChatSession } from "@/lib/chat-storage"
import { formatDistanceToNow } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { DeleteChatDialog } from "@/components/delete-chat-dialog"

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
 * - Delete existing chats with confirmation
 * - Show session metadata (title, timestamp, message count)
 */
export default function ChatSidebar({ currentSessionId, onSessionSelect, onNewChat }: ChatSidebarProps) {
  // State to store all chat sessions
  const [sessions, setSessions] = useState<ChatSession[]>([])

  // State for delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    sessionId: string | null
    sessionTitle: string
    isCurrentChat: boolean
  }>({
    isOpen: false,
    sessionId: null,
    sessionTitle: "",
    isCurrentChat: false,
  })

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
   * Show delete confirmation dialog for a specific session
   */
  const showDeleteDialog = (sessionId: string, sessionTitle: string, isCurrentChat = false) => {
    setDeleteDialog({
      isOpen: true,
      sessionId,
      sessionTitle,
      isCurrentChat,
    })
  }

  /**
   * Close delete confirmation dialog
   */
  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      sessionId: null,
      sessionTitle: "",
      isCurrentChat: false,
    })
  }

  /**
   * Handle confirmed deletion of a chat session
   * Removes session from storage and starts new chat if current session was deleted
   */
  const handleConfirmDelete = () => {
    if (deleteDialog.sessionId) {
      // Remove session from storage
      ChatStorage.deleteSession(deleteDialog.sessionId)
      refreshSessions()

      // If we're deleting the current session, start a new chat
      if (deleteDialog.sessionId === currentSessionId) {
        onNewChat()
      }
    }
  }

  /**
   * Handle delete button click for individual sessions
   * Shows confirmation dialog instead of immediately deleting
   */
  const handleDeleteSession = (sessionId: string, sessionTitle: string, e: React.MouseEvent) => {
    // Prevent event bubbling to avoid triggering session selection
    e.stopPropagation()

    // Show confirmation dialog
    showDeleteDialog(sessionId, sessionTitle, sessionId === currentSessionId)
  }

  /**
   * Handle deleting the current active chat
   * Shows confirmation dialog for the currently open conversation
   */
  const handleDeleteCurrentChat = () => {
    if (currentSessionId) {
      const currentSession = sessions.find((s) => s.id === currentSessionId)
      const sessionTitle = currentSession?.title || "Current Chat"
      showDeleteDialog(currentSessionId, sessionTitle, true)
    }
  }

  return (
    <>
      {/* Sidebar container - full height with border */}
      <div className="w-80 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-400">
        {/* Header with title and action buttons */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 theme-text">Chats</h2>

            {/* Action buttons container */}
            <div className="flex items-center space-x-2">
              {/* Delete current chat button - only show if there's an active chat */}
              {currentSessionId && (
                <Button
                  onClick={handleDeleteCurrentChat}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 transition-all duration-300 hover:scale-105 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}

              {/* New chat button */}
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
        </div>

        {/* Chat sessions list */}
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
                        {/* Session title */}
                        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate pr-2 theme-text">
                          {session.title}
                        </h3>

                        {/* Individual delete button for each session */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-all duration-300 hover:scale-110"
                          onClick={(e) => handleDeleteSession(session.id, session.title, e)}
                          title="Delete this chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Session metadata */}
                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 theme-text">
                        <Clock className="w-3 h-3 mr-1 transition-all duration-300" />
                        <span>{formatDistanceToNow(session.updatedAt, { addSuffix: true })}</span>
                        <span className="mx-2">•</span>
                        <span>{session.messages.length} messages</span>
                      </div>

                      {/* Preview of last message */}
                      {session.messages.length > 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate theme-text">
                          {session.messages[session.messages.length - 1]?.content.substring(0, 60)}...
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

      {/* Delete confirmation dialog */}
      <DeleteChatDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        chatTitle={deleteDialog.sessionTitle}
        isCurrentChat={deleteDialog.isCurrentChat}
      />
    </>
  )
}
