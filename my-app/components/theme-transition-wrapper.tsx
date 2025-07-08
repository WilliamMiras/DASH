"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

interface ThemeTransitionWrapperProps {
  children: React.ReactNode
}

/**
 * Theme Transition Wrapper Component
 *
 * Provides smooth fade transitions when switching between themes.
 * Manages the transition state and prevents flash of unstyled content.
 */
export default function ThemeTransitionWrapper({ children }: ThemeTransitionWrapperProps) {
  const { theme } = useTheme()

  // State to track if theme is currently transitioning
  const [isTransitioning, setIsTransitioning] = useState(false)

  // State to track if component has mounted
  const [mounted, setMounted] = useState(false)

  /**
   * Set mounted state after component mounts
   * Remove preload class to enable transitions
   */
  useEffect(() => {
    setMounted(true)
    // Remove preload class after component mounts to enable smooth transitions
    document.body.classList.remove("preload")
  }, [])

  /**
   * Handle theme changes with transition effects
   * Creates a brief transition state for smooth theme switching
   */
  useEffect(() => {
    if (!mounted) return

    // Start transition
    setIsTransitioning(true)

    // End transition after animation completes
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 500) // Match the CSS transition duration

    return () => clearTimeout(timer)
  }, [theme, mounted])

  /**
   * Add preload class on initial render to prevent flash
   * This prevents transitions from running before the component is ready
   */
  useEffect(() => {
    document.body.classList.add("preload")
  }, [])

  return (
    <div className={`transition-all duration-500 ease-in-out ${isTransitioning ? "opacity-95" : "opacity-100"}`}>
      {children}
    </div>
  )
}
