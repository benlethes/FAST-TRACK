"use client";

import { useEffect, useState } from "react";
import { loadState, saveState, seedSampleData, calcStreak, type AppState } from "@/lib/storage";
import TimerTab from "@/components/TimerTab";
import AnalyticsTab from "@/components/AnalyticsTab";

type Tab = "timer" | "analytics";

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [tab, setTab] = useState<Tab>("timer");

  // Load from localStorage on mount
  useEffect(() => {
    let loaded = loadState();
    loaded = seedSampleData(loaded);
    setState(loaded);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed silently
      });
    }
  }, []);

  const handleChange = (next: AppState) => {
    setState(next);
    saveState(next);
  };

  if (!state) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
        <span className="font-mono text-[#666] text-xs uppercase tracking-widest">
          Loading...
        </span>
      </div>
    );
  }

  const streak = calcStreak(state.sessions);

  return (
    <div
      className="flex flex-col bg-[#0a0a0a] text-white"
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
        className="flex border-t border-[#2a2a2a]"
        style={{ background: "#0a0a0a" }}
        role="tablist"
        aria-label="App navigation"
      >
        {(["timer", "analytics"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={[
              "flex-1 py-4 font-mono text-[10px] uppercase tracking-widest transition-colors",
              tab === t
                ? "text-white border-t-2 border-white -mt-px"
                : "text-[#444] hover:text-[#888]",
            ].join(" ")}
            style={{ borderRadius: 0 }}
          >
            {t === "timer" ? "TIMER" : "ANALYTICS"}
          </button>
        ))}
      </div>
    </div>
  );
}
