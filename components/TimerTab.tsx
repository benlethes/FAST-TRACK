"use client";

import { useEffect, useRef, useState } from "react";
import { AppState, FastSession, localDateKey } from "@/lib/storage";

interface Props {
  state: AppState;
  onChange: (next: AppState) => void;
  streak: number;
}

function formatHMS(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTime(ts: number | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface PhaseInfo {
  label: string;
  bg: string;
  color: string;
}

function getPhase(ratio: number): PhaseInfo {
  if (ratio >= 1) return { label: "Goal reached", bg: "rgba(52,199,89,0.12)", color: "#34C759" };
  if (ratio >= 0.75) return { label: "Fat burning", bg: "rgba(255,107,107,0.12)", color: "#FF6B6B" };
  if (ratio >= 0.5) return { label: "Ketosis", bg: "rgba(245,158,11,0.12)", color: "#D97706" };
  return { label: "Early fast", bg: "rgba(142,142,147,0.12)", color: "#8E8E93" };
}

function getWeekDays(): Date[] {
  const now = new Date();
  const dow = now.getDay();
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
const GOAL_OPTIONS = [12, 14, 16, 18, 20, 24];

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
  const ringColor = ratio >= 1 ? "#34C759" : "#FF6B6B";
  const phase = state.fasting ? getPhase(ratio) : null;

  // SVG ring geometry
  const CX = 140;
  const CY = 140;
  const R = 112;
  const STROKE = 12;
  const circumference = 2 * Math.PI * R;
  const lap1 = Math.min(ratio, 1);
  const lap1Dash = lap1 * circumference;

  const R2 = 96;
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
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "#FFFFFF" }}>
      <div className="flex flex-col px-5 pt-5 pb-6 gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "#1C1C1E",
              letterSpacing: "-0.02em",
              fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
            }}
          >
            FAST//TRACK
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(255,107,107,0.1)",
              borderRadius: "50px",
              padding: "5px 12px",
            }}
          >
            <span style={{ fontSize: "14px" }}>🔥</span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#FF6B6B",
                fontFamily: "-apple-system, sans-serif",
              }}
            >
              {streak} days
            </span>
          </div>
        </div>

        {/* Goal selector pills */}
        <div
          style={{
            background: "#F5F5F7",
            borderRadius: "20px",
            padding: "14px 16px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "12px",
              color: "#8E8E93",
              fontWeight: 500,
              marginBottom: "10px",
            }}
          >
            fasting goal
          </span>
          <div className="flex gap-2 flex-wrap">
            {GOAL_OPTIONS.map((h) => {
              const selected = state.goalHours === h;
              return (
                <button
                  key={h}
                  onClick={() => onChange({ ...state, goalHours: h })}
                  style={{
                    flex: 1,
                    minWidth: "44px",
                    height: "40px",
                    borderRadius: "50px",
                    border: selected ? "none" : "1.5px solid #D1D1D6",
                    background: selected ? "#FF6B6B" : "transparent",
                    color: selected ? "#FFFFFF" : "#1C1C1E",
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "-apple-system, sans-serif",
                    cursor: "pointer",
                    transition: "all 200ms ease",
                  }}
                  aria-pressed={selected}
                  aria-label={`${h} hour fasting goal`}
                >
                  {h}h
                </button>
              );
            })}
          </div>
        </div>

        {/* Week row */}
        <div className="flex justify-between items-center px-1">
          {weekDays.map((d, i) => {
            const key = localDateKey(d.getTime());
            const isToday = key === todayKey;
            const isQualified = qualifiedDays.has(key);
            const isFastingToday = isToday && state.fasting;

            let dotBg = "transparent";
            let dotBorder = "1.5px solid #E5E5EA";
            let dotContent = null;

            if (isQualified) {
              dotBg = "#34C759";
              dotBorder = "none";
              dotContent = (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              );
            } else if (isFastingToday) {
              dotBorder = "2px solid #FF6B6B";
            } else if (isToday) {
              dotBorder = "2px solid #FF6B6B";
              dotBg = "rgba(255,107,107,0.08)";
            }

            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span style={{ fontSize: "11px", color: "#8E8E93", fontWeight: 500 }}>
                  {DAY_LABELS[i]}
                </span>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: dotBg,
                    border: dotBorder,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 300ms ease",
                  }}
                >
                  {dotContent}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ring timer */}
        <div className="flex justify-center">
          <svg width="280" height="280" viewBox="0 0 280 280">
            {/* Track */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F5F5F7" strokeWidth={STROKE} />
            {/* Progress lap 1 — only render when there's progress to avoid a dot at 0% */}
            {lap1 > 0 && (
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke={ringColor}
                strokeWidth={STROKE}
                strokeDasharray={`${lap1Dash} ${circumference}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: "stroke-dasharray 0.5s linear, stroke 0.5s ease" }}
              />
            )}
            {/* Lap 2 track */}
            {ratio > 1 && (
              <circle cx={CX} cy={CY} r={R2} fill="none" stroke="#F5F5F7" strokeWidth={STROKE - 3} />
            )}
            {/* Progress lap 2 */}
            {lap2 > 0 && (
              <circle
                cx={CX}
                cy={CY}
                r={R2}
                fill="none"
                stroke={ringColor}
                strokeWidth={STROKE - 3}
                strokeDasharray={`${lap2Dash} ${C2}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: "stroke-dasharray 0.5s linear" }}
              />
            )}
            {/* Elapsed time */}
            <text
              x={CX}
              y={CY - 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#1C1C1E"
              fontSize="30"
              fontFamily="ui-monospace, 'SF Mono', monospace"
              fontWeight="700"
            >
              {state.fasting ? formatHMS(elapsed) : "00:00:00"}
            </text>
            {/* "elapsed" label */}
            <text
              x={CX}
              y={CY + 18}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#8E8E93"
              fontSize="11"
              fontFamily="-apple-system, sans-serif"
              letterSpacing="1"
            >
              elapsed
            </text>
          </svg>

          {/* Phase chip — positioned below the ring */}
        </div>

        {/* Phase chip */}
        {phase && (
          <div className="flex justify-center -mt-8">
            <div
              style={{
                background: phase.bg,
                borderRadius: "50px",
                padding: "5px 16px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: phase.color,
                  fontFamily: "-apple-system, sans-serif",
                }}
              >
                {phase.label}
              </span>
            </div>
          </div>
        )}
        {!phase && <div style={{ height: "28px" }} />}

        {/* Info row */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Started", value: state.fasting ? formatTime(state.startTime) : "—" },
            { label: "Goal at", value: state.fasting ? formatTime(goalAt) : "—" },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "#F5F5F7",
                borderRadius: "20px",
                padding: "14px 16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#8E8E93", fontWeight: 500 }}>
                {label}
              </span>
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#1C1C1E",
                  fontFamily: "ui-monospace, 'SF Mono', monospace",
                  lineHeight: 1.1,
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={state.fasting ? endFast : startFast}
          style={{
            width: "100%",
            height: "56px",
            borderRadius: "50px",
            border: state.fasting ? "2px solid #FF6B6B" : "none",
            background: state.fasting ? "transparent" : "#FF6B6B",
            color: state.fasting ? "#FF6B6B" : "#FFFFFF",
            fontSize: "16px",
            fontWeight: 700,
            fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
            cursor: "pointer",
            transition: "all 300ms ease",
            letterSpacing: "-0.01em",
          }}
        >
          {state.fasting ? "End fast" : "Start fast"}
        </button>

      </div>
    </div>
  );
}
