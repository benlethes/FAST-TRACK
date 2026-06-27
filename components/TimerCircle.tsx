"use client";
import { useEffect, useState } from "react";
import {
  FastRecord,
  fastDurationHours,
  formatDuration,
  formatDate,
  formatHMS,
  goalHit,
} from "@/lib/store";

interface TimerCircleProps {
  isActive: boolean;
  startTime: number | null;
  goalHours: number;
  lastRecord: FastRecord | null;
}

const SIZE = 280;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const CENTER = SIZE / 2;

export function TimerCircle({
  isActive,
  startTime,
  goalHours,
  lastRecord,
}: TimerCircleProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const goalMs = goalHours * 3600 * 1000;
  const elapsedMs = isActive && startTime ? Math.max(0, now - startTime) : 0;
  const progress = Math.min(1, elapsedMs / goalMs);
  const remainingMs = Math.max(0, goalMs - elapsedMs);

  // Color transitions: coral → green as progress approaches 1
  const arcColor =
    progress < 0.5
      ? "#ff5c5c"
      : progress < 0.85
      ? `#${Math.round(0xff + (0x4c - 0xff) * ((progress - 0.5) / 0.35))
          .toString(16)
          .padStart(2, "0")}${Math.round(0x5c + (0xaf - 0x5c) * ((progress - 0.5) / 0.35))
          .toString(16)
          .padStart(2, "0")}${Math.round(0x5c + (0x7d - 0x5c) * ((progress - 0.5) / 0.35))
          .toString(16)
          .padStart(2, "0")}`
      : "#4caf7d";

  const dashOffset = CIRC * (1 - progress);

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
      role="timer"
      aria-label={isActive ? `Elapsed: ${formatHMS(elapsedMs)}` : "No active fast"}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute"
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          fill="none"
          stroke="#e8e8e8"
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          fill="none"
          stroke={isActive ? arcColor : "#e8e8e8"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={isActive ? dashOffset : CIRC}
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease" }}
        />
      </svg>

      {/* Inner content */}
      <div className="relative flex flex-col items-center justify-center gap-1 select-none">
        {isActive ? (
          <>
            <span
              className="font-mono text-4xl font-bold text-[#111111] tabular-nums"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}
            >
              {formatHMS(elapsedMs)}
            </span>
            <span className="text-xs text-[#888888] uppercase tracking-widest">
              elapsed
            </span>
            <span className="text-sm text-[#888888] mt-1">
              {formatHMS(remainingMs)} remaining
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-8 text-center">
            <span className="text-xs text-[#888888] uppercase tracking-widest">
              Last fast
            </span>
            {lastRecord ? (
              <>
                <span className="font-mono text-3xl font-bold text-[#111111]"
                  style={{ fontFamily: "var(--font-mono)" }}>
                  {formatDuration(lastRecord.endTime - lastRecord.startTime)}
                </span>
                <span className="text-xs text-[#888888]">
                  {formatDate(lastRecord.endTime)}
                </span>
                <span
                  className={`text-lg ${
                    goalHit(lastRecord) ? "text-[#4caf7d]" : "text-[#ff5c5c]"
                  }`}
                  aria-label={goalHit(lastRecord) ? "Goal hit" : "Goal missed"}
                >
                  {goalHit(lastRecord) ? "✓" : "✗"}
                </span>
              </>
            ) : (
              <span className="text-sm text-[#888888]">No fasts yet</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
