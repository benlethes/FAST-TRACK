"use client";

import { useEffect, useRef, useState } from "react";
import { AppState, FastSession, localDateKey } from "@/lib/storage";

interface Props {
  state: AppState;
  onChange: (next: AppState) => void;
  streak: number;
}

const GOALS = [12, 16, 18, 20] as const;

function formatHMS(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTime(ts: number | null): string {
  if (!ts) return "--:--";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getPhase(ratio: number): string {
  if (ratio >= 1) return "GOAL MET";
  if (ratio >= 0.75) return "FAT BURN";
  if (ratio >= 0.5) return "KETOSIS";
  return "EARLY FAST";
}

/** Get the 7 days of the current week Mon–Sun */
function getWeekDays(): Date[] {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + mondayOffset + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function TimerTab({ state, onChange, streak }: Props) {
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const elapsed = state.fasting && state.startTime ? now - state.startTime : 0;
  const goalMs = state.goalHours * 3600000;
  const ratio = goalMs > 0 ? elapsed / goalMs : 0;
  const goalColor = ratio >= 1 ? "#00C853" : "#FF3B30";
  const phase = state.fasting ? getPhase(ratio) : null;

  // SVG ring
  const R = 110;
  const STROKE = 10;
  const CX = 140;
  const CY = 140;
  const circumference = 2 * Math.PI * R;

  // First lap (0–100%)
  const lap1 = Math.min(ratio, 1);
  const lap1Dash = lap1 * circumference;

  // Second lap (100%+), ring slightly smaller
  const R2 = 94;
  const C2 = 2 * Math.PI * R2;
  const lap2 = ratio > 1 ? Math.min(ratio - 1, 1) : 0;
  const lap2Dash = lap2 * C2;

  // Week dots
  const weekDays = getWeekDays();
  const todayKey = localDateKey(now);
  const qualifiedDays = new Set<string>();
  for (const s of state.sessions) {
    const dur = (s.end - s.start) / 3600000;
    if (dur >= s.goal) qualifiedDays.add(localDateKey(s.start));
  }

  const startFast = () => {
    onChange({ ...state, fasting: true, startTime: Date.now() });
  };

  const endFast = () => {
    if (!state.startTime) return;
    const session: FastSession = {
      start: state.startTime,
      end: Date.now(),
      goal: state.goalHours,
    };
    onChange({
      ...state,
      fasting: false,
      startTime: null,
      sessions: [...state.sessions, session],
    });
  };

  const goalAt = state.fasting && state.startTime
    ? state.startTime + goalMs
    : null;

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="font-mono text-xl font-bold tracking-widest uppercase text-white"
          style={{ letterSpacing: "0.15em" }}
        >
          FAST//TRACK
        </h1>
        <div
          className="flex items-center gap-1 px-3 py-1 border border-[#2a2a2a] text-xs font-mono uppercase tracking-widest"
          style={{ borderRadius: "2px" }}
        >
          <span>🔥</span>
          <span className="text-white">{streak} DAY STREAK</span>
        </div>
      </div>

      {/* Goal selector */}
      <div className="flex w-full border-2 border-[#2a2a2a] mb-5" style={{ borderRadius: 0 }}>
        {GOALS.map((g, i) => (
          <button
            key={g}
            onClick={() => onChange({ ...state, goalHours: g })}
            className={[
              "flex-1 py-3 font-mono text-sm font-bold uppercase tracking-widest transition-colors",
              i > 0 ? "border-l-2 border-[#2a2a2a]" : "",
              state.goalHours === g
                ? "bg-white text-black"
                : "bg-transparent text-white hover:bg-[#1a1a1a]",
            ].join(" ")}
            style={{ borderRadius: 0 }}
          >
            {g}H
          </button>
        ))}
      </div>

      {/* Week dots */}
      <div className="flex justify-between items-center mb-6 px-1">
        {weekDays.map((d, i) => {
          const key = localDateKey(d.getTime());
          const isToday = key === todayKey;
          const isQualified = qualifiedDays.has(key);
          const isFastingToday = isToday && state.fasting;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">
                {DAY_LABELS[i]}
              </span>
              <div
                className={[
                  "w-7 h-7 rounded-full flex items-center justify-center",
                  isQualified
                    ? "bg-[#00C853]"
                    : isFastingToday
                    ? "bg-transparent border-2 border-[#FF3B30]"
                    : isToday
                    ? "bg-transparent border-2 border-[#FF3B30] opacity-50"
                    : "bg-transparent border border-[#2a2a2a]",
                ].join(" ")}
              >
                {isQualified && (
                  <span className="text-black text-[10px] font-bold">✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ring timer */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <svg width="280" height="280" viewBox="0 0 280 280">
            {/* Track ring */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth={STROKE}
            />
            {/* Progress ring lap 1 */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={goalColor}
              strokeWidth={STROKE}
              strokeDasharray={`${lap1Dash} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="butt"
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ transition: "stroke-dasharray 0.5s linear, stroke 0.5s ease" }}
            />
            {/* Second lap track */}
            {ratio > 1 && (
              <circle
                cx={CX}
                cy={CY}
                r={R2}
                fill="none"
                stroke="#1a1a1a"
                strokeWidth={STROKE - 2}
              />
            )}
            {/* Progress ring lap 2 */}
            {lap2 > 0 && (
              <circle
                cx={CX}
                cy={CY}
                r={R2}
                fill="none"
                stroke={goalColor}
                strokeWidth={STROKE - 2}
                strokeDasharray={`${lap2Dash} ${C2}`}
                strokeDashoffset={0}
                strokeLinecap="butt"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: "stroke-dasharray 0.5s linear" }}
              />
            )}

            {/* Center text */}
            <text
              x={CX}
              y={CY - 14}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="32"
              fontFamily="'Space Mono', monospace"
              fontWeight="700"
            >
              {state.fasting ? formatHMS(elapsed) : "00:00:00"}
            </text>
            <text
              x={CX}
              y={CY + 16}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#666"
              fontSize="10"
              fontFamily="'Space Mono', monospace"
              letterSpacing="2"
            >
              ELAPSED
            </text>
            {phase && (
              <text
                x={CX}
                y={CY + 36}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={goalColor}
                fontSize="10"
                fontFamily="'Space Mono', monospace"
                fontWeight="700"
                letterSpacing="2"
              >
                {phase}
              </text>
            )}
          </svg>
        </div>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: "STARTED", value: state.fasting ? formatTime(state.startTime) : "--:--" },
          { label: "GOAL AT", value: state.fasting ? formatTime(goalAt) : "--:--" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="border border-[#2a2a2a] p-3 flex flex-col gap-1"
            style={{ borderRadius: "4px", background: "#141414" }}
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">
              {label}
            </span>
            <span className="font-mono text-xl font-bold text-white">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Action button */}
      {!state.fasting ? (
        <button
          onClick={startFast}
          className="w-full py-4 font-mono text-sm font-bold uppercase tracking-widest bg-white text-black transition-colors hover:bg-gray-100"
          style={{ borderRadius: 0, border: "2px solid white" }}
        >
          START FAST
        </button>
      ) : (
        <button
          onClick={endFast}
          className="w-full py-4 font-mono text-sm font-bold uppercase tracking-widest bg-transparent text-[#FF3B30] transition-colors hover:bg-[#FF3B30] hover:text-white"
          style={{ borderRadius: 0, border: "2px solid #FF3B30" }}
        >
          END FAST
        </button>
      )}
    </div>
  );
}
