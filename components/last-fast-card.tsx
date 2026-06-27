"use client"

import { Check, X } from "lucide-react"
import {
  type CompletedFast,
  formatDurationCompact,
  formatFastDate,
} from "@/lib/fasting"

export function LastFastCard({ fast }: { fast: CompletedFast }) {
  return (
    <div className="flex w-[210px] flex-col items-center gap-3 text-center">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        last fast
      </span>

      <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <span className="font-mono text-3xl font-semibold tracking-tight text-card-foreground">
          {formatDurationCompact(fast.durationMs)}
        </span>

        <span className="text-xs leading-relaxed text-muted-foreground text-balance">
          {formatFastDate(fast.startedAt, fast.endedAt)}
        </span>

        <span
          className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            fast.hitGoal
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {fast.hitGoal ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Goal reached
            </>
          ) : (
            <>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDurationCompact(fast.goalMs)} goal missed
            </>
          )}
        </span>
      </div>
    </div>
  )
}
