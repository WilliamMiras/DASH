"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteChatDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  chatTitle?: string
  isCurrentChat?: boolean
}

/**
 * Delete Chat Confirmation Dialog
 *
 * A reusable confirmation dialog for deleting chat sessions.
 * Provides clear messaging and prevents accidental deletions.
 */
export function DeleteChatDialog({ isOpen, onClose, onConfirm, chatTitle, isCurrentChat }: DeleteChatDialogProps) {
  /**
   * Handle confirmation of deletion
   * Calls the onConfirm callback and closes the dialog
   */
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="theme-card bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-900 dark:text-slate-100 theme-text">
            {isCurrentChat ? "Delete Current Chat?" : "Delete Chat?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 dark:text-slate-400 theme-text">
            {isCurrentChat ? (
              <>
                Are you sure you want to delete the current chat session? This will permanently remove all messages in
                this conversation.
              </>
            ) : (
              <>
                Are you sure you want to delete "{chatTitle}"? This will permanently remove all messages in this
                conversation.
              </>
            )}
            <br />
            <br />
            <span className="font-medium text-red-600 dark:text-red-400">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 transition-all duration-300"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white transition-all duration-300 hover:scale-105"
          >
            Delete Chat
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
