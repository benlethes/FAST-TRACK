"use client"

import { useCallback, useEffect, useState } from "react"
import {
  type ActiveFast,
  type CompletedFast,
  DEFAULT_GOAL_MS,
} from "@/lib/fasting"

const ACTIVE_KEY = "fast-track:active"
const LAST_KEY = "fast-track:last"

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function useFasting() {
  const [hydrated, setHydrated] = useState(false)
  const [activeFast, setActiveFast] = useState<ActiveFast | null>(null)
  const [lastFast, setLastFast] = useState<CompletedFast | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // Hydrate from storage on mount.
  useEffect(() => {
    setActiveFast(readJSON<ActiveFast>(ACTIVE_KEY))
    setLastFast(readJSON<CompletedFast>(LAST_KEY))
    setHydrated(true)
  }, [])

  // Tick every second while a fast is active.
  useEffect(() => {
    if (!activeFast) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeFast])

  const startFast = useCallback((goalMs: number = DEFAULT_GOAL_MS) => {
    const fast: ActiveFast = { startedAt: Date.now(), goalMs }
    setActiveFast(fast)
    window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(fast))
  }, [])

  const endFast = useCallback(() => {
    setActiveFast((current) => {
      if (!current) return null
      const endedAt = Date.now()
      const durationMs = endedAt - current.startedAt
      const completed: CompletedFast = {
        startedAt: current.startedAt,
        endedAt,
        durationMs,
        goalMs: current.goalMs,
        hitGoal: durationMs >= current.goalMs,
      }
      setLastFast(completed)
      window.localStorage.setItem(LAST_KEY, JSON.stringify(completed))
      window.localStorage.removeItem(ACTIVE_KEY)
      return null
    })
  }, [])

  const elapsedMs = activeFast ? Math.max(0, now - activeFast.startedAt) : 0
  const progress = activeFast
    ? Math.min(1, elapsedMs / activeFast.goalMs)
    : 0

  return {
    hydrated,
    activeFast,
    lastFast,
    elapsedMs,
    progress,
    startFast,
    endFast,
  }
}
