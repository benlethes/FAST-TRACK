"use client";

import { useEffect, useState } from "react";
import { loadState, saveState, seedSampleData, calcStreak, type AppState } from "@/lib/storage";
import TimerTab from "@/components/TimerTab";
import AnalyticsTab from "@/components/AnalyticsTab";

type Tab = "timer" | "analytics";

// Timer icon
function TimerIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#FF6B6B" : "#8E8E93"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

// Analytics icon
function AnalyticsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#FF6B6B" : "#8E8E93"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [tab, setTab] = useState<Tab>("timer");

  useEffect(() => {
    let loaded = loadState();
    loaded = seedSampleData(loaded);
    setState(loaded);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const handleChange = (next: AppState) => {
    setState(next);
    saveState(next);
  };

  if (!state) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <span className="text-[#8E8E93] text-sm tracking-wide">Loading...</span>
      </div>
    );
  }

  const streak = calcStreak(state.sessions);

  return (
    <div
      className="flex flex-col bg-white"
      style={{ height: "100dvh", maxWidth: "430px", margin: "0 auto" }}
    >
      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === "timer" ? (
          <TimerTab state={state} onChange={handleChange} streak={streak} />
        ) : (
          <AnalyticsTab sessions={state.sessions} goalHours={state.goalHours} />
        )}
      </div>

      {/* Bottom tab bar */}
      <div
        className="flex items-center px-4 pb-safe"
        style={{
          background: "#FFFFFF",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
          paddingTop: "10px",
        }}
        role="tablist"
        aria-label="App navigation"
      >
        {(["timer", "analytics"] as Tab[]).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t)}
              className="flex-1 flex flex-col items-center gap-1 transition-all"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0" }}
            >
              <div
                style={{
                  padding: "6px 20px",
                  borderRadius: "50px",
                  background: isActive ? "rgba(255,107,107,0.1)" : "transparent",
                  transition: "background 300ms ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                {t === "timer" ? <TimerIcon active={isActive} /> : <AnalyticsIcon active={isActive} />}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: isActive ? "#FF6B6B" : "#8E8E93",
                    letterSpacing: "0.05em",
                    transition: "color 300ms ease",
                  }}
                >
                  {t === "timer" ? "Timer" : "Analytics"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
