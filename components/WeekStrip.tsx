"use client";
import { FastRecord, goalHit } from "@/lib/store";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

interface WeekStripProps {
  records: FastRecord[];
  isActive: boolean;
}

function getWeekDays(): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  // Monday-first: find Monday of this week
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function WeekStrip({ records, isActive }: WeekStripProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = getWeekDays();

  return (
    <div className="flex justify-between w-full" aria-label="Week overview">
      {days.map((day, i) => {
        const isToday = isSameDay(day, today);
        const isFuture = day > today;

        // Find fast record for this day (fast that ended on this calendar day)
        const record = records.find((r) => {
          const endDay = new Date(r.endTime);
          endDay.setHours(0, 0, 0, 0);
          return isSameDay(endDay, day);
        });

        const completed = !!record;
        const hit = record ? goalHit(record) : false;

        let circleClass = "";
        let textClass = "text-[#888888]";

        if (isToday && isActive) {
          // Active fast today: outlined coral
          circleClass = "border-2 border-[#ff5c5c] bg-white";
          textClass = "text-[#ff5c5c]";
        } else if (completed && hit) {
          // Completed + goal hit: filled green
          circleClass = "bg-[#4caf7d]";
          textClass = "text-white";
        } else if (completed && !hit) {
          // Completed + missed: filled coral
          circleClass = "bg-[#ff5c5c]";
          textClass = "text-white";
        } else if (isFuture) {
          // Future: outlined gray
          circleClass = "border border-[#e8e8e8] bg-white";
          textClass = "text-[#888888]";
        } else {
          // Past with no record: outlined gray
          circleClass = "border border-[#e8e8e8] bg-white";
          textClass = "text-[#888888]";
        }

        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-[#888888] font-medium">
              {DAY_LABELS[i]}
            </span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${circleClass}`}
              aria-label={`${day.toLocaleDateString([], { weekday: "long" })}: ${
                completed ? (hit ? "goal hit" : "missed") : isToday && isActive ? "active" : "no fast"
              }`}
            >
              <span className={`text-[10px] font-medium ${textClass}`}>
                {day.getDate()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
