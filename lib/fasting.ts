export const DEFAULT_GOAL_MS = 16 * 60 * 60 * 1000 // 16h

export type ActiveFast = {
  startedAt: number
  goalMs: number
}

export type CompletedFast = {
  startedAt: number
  endedAt: number
  durationMs: number
  goalMs: number
  hitGoal: boolean
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function formatDurationCompact(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatFastDate(startedAt: number, endedAt: number): string {
  const start = new Date(startedAt)
  const end = new Date(endedAt)
  const sameDay = start.toDateString() === end.toDateString()
  const dateOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  const timeOpts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" }
  if (sameDay) {
    return `${start.toLocaleDateString(undefined, dateOpts)} · ${start.toLocaleTimeString(
      undefined,
      timeOpts,
    )} – ${end.toLocaleTimeString(undefined, timeOpts)}`
  }
  return `${start.toLocaleDateString(undefined, dateOpts)} – ${end.toLocaleDateString(
    undefined,
    dateOpts,
  )}`
}
