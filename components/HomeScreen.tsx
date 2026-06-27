"use client";
import { useFastStore, formatTime } from "@/lib/store";
import { Wordmark } from "./Wordmark";
import { GoalSelector } from "./GoalSelector";
import { WeekStrip } from "./WeekStrip";
import { TimerCircle } from "./TimerCircle";

function computeStreak(records: ReturnType<typeof useFastStore>["state"]["records"]): number {
  if (records.length === 0) return 0;
  const sorted = [...records].sort((a, b) => b.endTime - a.endTime);
  const oneDay = 24 * 60 * 60 * 1000;
  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  for (const r of sorted) {
    const endDay = new Date(r.endTime);
    endDay.setHours(0, 0, 0, 0);
    const diff = (checkDate.getTime() - endDay.getTime()) / oneDay;
    if (diff <= 1) {
      streak++;
      checkDate = new Date(endDay.getTime() - oneDay);
    } else {
      break;
    }
  }
  return streak;
}

export function HomeScreen() {
  const { state, setGoal, startFast, endFast } = useFastStore();
  const { isActive, startTime, goalHours, records } = state;

  const streak = computeStreak(records);
  const sortedRecords = [...records].sort((a, b) => b.endTime - a.endTime);
  const lastRecord = sortedRecords[0] ?? null;

  const goalMs = goalHours * 3600 * 1000;
  const startedAt = isActive && startTime ? formatTime(startTime) : "–";
  const goalAt =
    isActive && startTime ? formatTime(startTime + goalMs) : "–";

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <Wordmark />
        <div
          className="flex items-center gap-1 text-sm font-medium text-[#111111]"
          aria-label={`${streak} day streak`}
        >
          <span>🔥</span>
          <span>{streak} days</span>
        </div>
      </div>

      {/* Goal selector */}
      <div className="px-5 pb-4">
        <GoalSelector selected={goalHours} onChange={setGoal} />
      </div>

      {/* Week strip */}
      <div className="px-5 pb-4">
        <WeekStrip records={records} isActive={isActive} />
      </div>

      {/* Timer circle — centered */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 relative">
        <TimerCircle
          isActive={isActive}
          startTime={startTime}
          goalHours={goalHours}
          lastRecord={lastRecord}
        />
      </div>

      {/* Stat tiles */}
      <div className="px-5 pb-3">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl p-3">
            <p className="text-xs text-[#888888] mb-1">Started</p>
            <p className="text-base font-semibold text-[#111111] font-mono tabular-nums">
              {startedAt}
            </p>
          </div>
          <div className="bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl p-3">
            <p className="text-xs text-[#888888] mb-1">Goal at</p>
            <p className="text-base font-semibold text-[#111111] font-mono tabular-nums">
              {goalAt}
            </p>
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={isActive ? endFast : startFast}
          className={`w-full py-4 rounded-full text-white text-base font-semibold transition-colors ${
            isActive
              ? "bg-[#4caf7d] active:bg-[#3d9c6e]"
              : "bg-[#ff5c5c] active:bg-[#e84f4f]"
          }`}
          aria-label={isActive ? "End current fast" : "Start a new fast"}
        >
          {isActive ? "End Fast" : "Start Fast"}
        </button>
      </div>
    </div>
  );
}
