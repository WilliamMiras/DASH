"use client"

import { useEffect, useState } from "react"
import { History, Clock, Trash2, Plus } from "lucide-react"

import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ChatStorage, type ChatSession } from "@/lib/chat-storage"
import { formatDistanceToNow } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface ChatHistoryProps {
  currentSessionId: string | null
  onSessionSelect: (session: ChatSession) => void
  onNewChat: () => void
}

export default function ChatHistory({ currentSessionId, onSessionSelect, onNewChat }: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])

  const refresh = () => setSessions(ChatStorage.getSessions())

  /* Load sessions once and keep in sync with localStorage changes */
  useEffect(() => {
    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [])

  const handleDelete = (id: string) => {
    ChatStorage.deleteSession(id)
    refresh()
    if (currentSessionId === id) onNewChat()
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="w-10 h-10">
          <History className="w-4 h-4" />
          <span className="sr-only">Open history</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 sm:w-80">
        <SheetHeader>
          <SheetTitle>Chat History</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-2 overflow-y-auto h-[calc(100%-8rem)]">
          {sessions.length === 0 && <p className="text-sm text-muted-foreground">No previous chats</p>}

          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex items-center justify-between rounded-md px-3 py-2 cursor-pointer hover:bg-accent",
                currentSessionId === session.id && "bg-accent",
              )}
              onClick={() => onSessionSelect(session)}
            >
              <div>
                <p className="text-sm font-medium leading-none">{session.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(session.updatedAt, { addSuffix: true })}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(session.id)
                }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
                <span className="sr-only">Delete chat</span>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <Button onClick={onNewChat} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> New Chat
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
