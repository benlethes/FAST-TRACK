"use client";

const GOALS = [12, 14, 16, 18, 20, 24];

interface GoalSelectorProps {
  selected: number;
  onChange: (h: number) => void;
}

export function GoalSelector({ selected, onChange }: GoalSelectorProps) {
  return (
    <div className="flex gap-2 justify-between w-full" role="group" aria-label="Fasting goal">
      {GOALS.map((h) => {
        const active = h === selected;
        return (
          <button
            key={h}
            onClick={() => onChange(h)}
            aria-pressed={active}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              active
                ? "bg-[#ff5c5c] text-white"
                : "bg-white border border-[#e8e8e8] text-[#111111]"
            }`}
          >
            {h}h
          </button>
        );
      })}
    </div>
  );
}
