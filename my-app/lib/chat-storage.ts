export interface ChatSession {
  id: string // Unique identifier for the session
  title: string // Display title generated from first message
  messages: Array<{
    id: string
    role: "user" | "assistant"
    content: string
    createdAt: Date
  }>
  createdAt: Date // When the session was first created
  updatedAt: Date // When the session was last modified
}

/**
 * Chat Storage Utility Class
 *
 * Handles all localStorage operations for chat sessions including:
 * - Saving and retrieving chat sessions
 * - Managing session limits
 * - Generating session titles
 * - Deleting sessions
 */
export class ChatStorage {
  // localStorage key for storing chat sessions
  private static readonly STORAGE_KEY = "ai-chat-history"

  // Maximum number of sessions to keep (prevents localStorage bloat)
  private static readonly MAX_SESSIONS = 50

  /**
   * Retrieve all chat sessions from localStorage
   * Handles JSON parsing and date conversion
   * Returns empty array if no sessions exist or on error
   */
  static getSessions(): ChatSession[] {
    // Return empty array on server-side rendering
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const sessions = JSON.parse(stored)

      // Convert date strings back to Date objects
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
        })),
      }))
    } catch (error) {
      console.error("Error loading chat sessions:", error)
      return []
    }
  }

  /**
   * Save a chat session to localStorage
   * Updates existing session or creates new one
   * Maintains session limit by removing oldest sessions
   */
  static saveSession(session: ChatSession): void {
    // Skip on server-side rendering
    if (typeof window === "undefined") return

    try {
      const sessions = this.getSessions()
      const existingIndex = sessions.findIndex((s) => s.id === session.id)

      if (existingIndex >= 0) {
        // Update existing session
        sessions[existingIndex] = session
      } else {
        // Add new session to beginning of array (most recent first)
        sessions.unshift(session)
      }

      // Keep only the most recent sessions to prevent localStorage bloat
      const trimmedSessions = sessions.slice(0, this.MAX_SESSIONS)

      // Save back to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedSessions))
    } catch (error) {
      console.error("Error saving chat session:", error)
    }
  }

  /**
   * Delete a specific chat session
   * Removes session from localStorage by ID
   */
  static deleteSession(sessionId: string): void {
    // Skip on server-side rendering
    if (typeof window === "undefined") return

    try {
      const sessions = this.getSessions()

      // Filter out the session to delete
      const filteredSessions = sessions.filter((s) => s.id !== sessionId)

      // Save updated sessions back to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSessions))
    } catch (error) {
      console.error("Error deleting chat session:", error)
    }
  }

  /**
   * Generate a display title from the first message
   * Takes first 6 words and adds ellipsis if longer
   */
  static generateTitle(firstMessage: string): string {
    const words = firstMessage.split(" ").slice(0, 6)
    return words.join(" ") + (firstMessage.split(" ").length > 6 ? "..." : "")
  }
}
