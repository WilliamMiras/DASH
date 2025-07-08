"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * Theme Slider Component
 *
 * A custom toggle slider that allows users to switch between light and dark themes.
 * Features smooth animations and visual feedback with sun/moon icons.
 */
export default function ThemeSlider() {
  // Next-themes hook for managing theme state
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Track if component has mounted to prevent hydration issues
  const [mounted, setMounted] = useState(false)

  /**
   * Set mounted state after component mounts
   * This prevents hydration mismatches between server and client
   */
  useEffect(() => {
    setMounted(true)
  }, [])

  /**
   * Show loading state while component is mounting
   * Prevents flash of incorrect theme state
   */
  if (!mounted) {
    return (
      <div className="flex items-center space-x-2 bg-slate-200 rounded-full p-1 w-20 h-10">
        <div className="w-4 h-4" />
      </div>
    )
  }

  // Determine if current theme is dark mode
  const isDark = resolvedTheme === "dark"

  /**
   * Handle theme toggle
   * Switches between light and dark themes
   */
  const handleToggle = () => {
    const newTheme = isDark ? "light" : "dark"
    setTheme(newTheme)
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Slider container */}
      <div
        className="relative bg-slate-200 dark:bg-slate-700 rounded-full p-1 w-20 h-10 cursor-pointer transition-all duration-300 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95"
        onClick={handleToggle}
      >
        {/* Animated track background - changes color based on theme */}
        <div
          className={`absolute inset-1 rounded-full transition-all duration-500 ${
            isDark ? "bg-gradient-to-r from-indigo-500 to-purple-600" : "bg-gradient-to-r from-amber-400 to-orange-500"
          }`}
        />

        {/* Sliding button with icon - moves left/right based on theme */}
        <div
          className={`relative w-8 h-8 bg-white rounded-full shadow-lg transition-all duration-500 flex items-center justify-center transform ${
            isDark ? "translate-x-10" : "translate-x-0"
          }`}
        >
          {/* Theme-appropriate icon */}
          {isDark ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-600" />}
        </div>
      </div>
    </div>
  )
}
