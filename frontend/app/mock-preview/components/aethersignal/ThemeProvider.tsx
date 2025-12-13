"use client";

/**
 * THEME PROVIDER — VISUAL SYSTEM CONTROLLER
 * ----------------------------------------
 * This component is the single source of truth for visual theming
 * across the AetherSignal application.
 *
 * Purpose:
 *  - Control light vs dark mode at the application root
 *  - Ensure consistent visual semantics across all components
 *  - Support analyst preference without affecting data or logic
 *
 * Design Principles:
 *  - Themes are purely presentational
 *  - No business logic depends on theme state
 *  - All styling must flow through semantic tokens
 *
 * This provider is intentionally simple and deterministic:
 *  - No async behavior
 *  - No persistence logic beyond local preference
 *
 * Phase context:
 *  - Phase 1: Visuals complete
 *  - Phase 2: Intent documentation (this file)
 *  - Phase 3: UI → Data Contract
 *  - Phase 4: Backend wiring
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * SYSTEM THEME DETECTION
 * ----------------------
 * Detects the user's system color scheme preference.
 *
 * Falls back to "dark" during SSR to prevent hydration mismatches.
 * Only queries browser APIs after client-side hydration.
 */
function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * ROOT CLASS APPLICATION
 * ----------------------
 * The active theme is applied as a class on the <html> element.
 *
 * Why this approach:
 *  - Enables CSS variable switching at the highest scope
 *  - Allows modals, portals, and overlays to inherit theme correctly
 *  - Avoids prop-drilling theme state into every component
 *
 * The presence of the "dark" class activates dark-mode variables.
 * Absence defaults to light mode.
 *
 * IMPORTANT:
 *  - All components must rely on CSS variables
 *  - Hard-coded colors are explicitly forbidden
 *
 * CSS VARIABLE CONTRACT:
 *  Visual theming is implemented via semantic CSS variables (defined in globals.css).
 *  Examples: --bg, --panel, --text, --border, --accent
 *
 *  This abstraction ensures:
 *  - Light and dark mode parity
 *  - Easy future theming (e.g., high-contrast mode)
 *  - Zero coupling between UI components and color values
 *
 *  Components must never assume a specific color.
 *
 * MODALS & PORTALS:
 *  Components rendered via portals (e.g., modals) still rely on the <html> root class for theming.
 *  This is why modals must use semantic tokens, and overlay backgrounds may remain neutral.
 *  Failure to follow this rule results in light mode inconsistencies and visual fragmentation.
 */
function applyThemeToDOM(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  // Help built-in form controls, scrollbars, etc. theme correctly
  root.style.colorScheme = theme;
}

/**
 * THEME PROVIDER COMPONENT
 *
 * Manages theme state and propagates it to the DOM via CSS class toggling.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  /**
   * THEME STATE
   * -----------
   * Maintains the current visual theme (light or dark).
   *
   * This state:
   *  - Reflects user preference
   *  - Does NOT affect application data
   *  - Does NOT alter analytical outputs
   *
   * Theme state is intentionally kept minimal to:
   *  - Avoid hidden UI logic
   *  - Support inspection-readiness
   *  - Prevent side effects
   */
  const [theme, setThemeState] = useState<Theme>("dark");

  /**
   * INITIALIZATION EFFECT
   * ---------------------
   * Loads theme preference on mount:
   *  1. Check localStorage for saved preference
   *  2. Fall back to system preference if none saved
   *  3. Apply theme to DOM immediately
   *  4. Mark as mounted to prevent hydration mismatches
   *
   * SSR-safe: Only accesses browser APIs after client hydration.
   */
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("theme") : null;
    const initial = (stored === "dark" || stored === "light") ? (stored as Theme) : getSystemTheme();
    setThemeState(initial);
    applyThemeToDOM(initial);
    setMounted(true);
  }, []);

  /**
   * SET THEME FUNCTION
   * ------------------
   * Updates theme state, persists to localStorage, and applies to DOM.
   * Called programmatically when user toggles theme.
   */
  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof window !== "undefined") window.localStorage.setItem("theme", t);
    applyThemeToDOM(t);
  };

  /**
   * TOGGLE THEME FUNCTION
   * ---------------------
   * Convenience function to switch between light and dark modes.
   */
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Always provide context value (prevents SSR context errors)
  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * USE THEME HOOK
 * --------------
 * Hook to access theme state and controls from any component.
 *
 * Usage:
 *  const { theme, setTheme, toggleTheme } = useTheme();
 *
 * OUT OF SCOPE (INTENTIONAL):
 *  This provider does NOT:
 *  - Persist theme to backend
 *  - Sync theme across users or organizations
 *  - Affect analytics, signals, or AI behavior
 *
 *  Any such features would be evaluated separately
 *  and must not contaminate visual concerns.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
