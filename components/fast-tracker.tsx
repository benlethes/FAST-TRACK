"use client"

import { useFasting } from "@/hooks/use-fasting"
import { formatDuration, formatDurationCompact } from "@/lib/fasting"
import { FastingRing } from "@/components/fasting-ring"
import { LastFastCard } from "@/components/last-fast-card"

export function FastTracker() {
  const { hydrated, activeFast, lastFast, elapsedMs, progress, startFast, endFast } =
    useFasting()

  const isActive = Boolean(activeFast)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-10 pt-12">
      <header className="mb-2 text-center">
        <h1 className="text-lg font-semibold tracking-tight">Fast-Track</h1>
        <p className="text-sm text-muted-foreground">
          {isActive ? "Fasting in progress" : "Ready when you are"}
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <FastingRing progress={progress} dimmed={!isActive}>
          {!hydrated ? null : isActive ? (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                elapsed
              </span>
              <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight">
                {formatDuration(elapsedMs)}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(progress * 100)}% of {formatDurationCompact(activeFast!.goalMs)} goal
              </span>
            </div>
          ) : lastFast ? (
            <LastFastCard fast={lastFast} />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-muted-foreground">
                00:00:00
              </span>
              <span className="text-xs text-muted-foreground">No fasts yet</span>
            </div>
          )}
        </FastingRing>
      </div>

      <button
        type="button"
        onClick={isActive ? endFast : () => startFast()}
        className={`w-full rounded-full px-6 py-4 text-base font-semibold transition-colors ${
          isActive
            ? "bg-muted text-foreground hover:bg-border"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {isActive ? "End Fast" : "Start Fast"}
      </button>
    </main>
  )
}
