"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { FastSession } from "@/lib/storage";
import { localDateKey } from "@/lib/storage";

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

interface Props {
  sessions: FastSession[];
  goalHours: number;
}

const CHART_FONT = "'Space Mono', monospace";
const GRID_COLOR = "#1a1a1a";
const TICK_COLOR = "#666";
const CARD_BG = "#141414";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="border border-[#2a2a2a] p-3 flex flex-col gap-1"
      style={{ borderRadius: "4px", background: CARD_BG }}
    >
      <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">
        {label}
      </span>
      <span className="font-mono text-2xl font-bold text-white leading-tight">
        {value}
      </span>
      {sub && (
        <span className="font-mono text-[10px] text-[#666] uppercase tracking-wide">
          {sub}
        </span>
      )}
    </div>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <h2
      className="font-mono text-[11px] uppercase tracking-widest text-[#666] mb-3"
      style={{ letterSpacing: "0.15em" }}
    >
      {children}
    </h2>
  );
}

const baseBarOptions = (
  yMin: number,
  yMax: number,
  yLabel?: (v: number) => string
): ChartOptions<"bar"> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1a1a1a",
      titleColor: "#fff",
      bodyColor: "#fff",
      titleFont: { family: CHART_FONT, size: 10 },
      bodyFont: { family: CHART_FONT, size: 10 },
      callbacks: {
        label: (ctx) =>
          yLabel ? yLabel(ctx.parsed.y) : String(ctx.parsed.y),
      },
    },
  },
  scales: {
    x: {
      grid: { color: GRID_COLOR },
      ticks: {
        color: TICK_COLOR,
        font: { family: CHART_FONT, size: 9 },
        maxRotation: 0,
      },
      border: { color: GRID_COLOR },
    },
    y: {
      min: yMin,
      max: yMax,
      grid: { color: GRID_COLOR },
      ticks: {
        color: TICK_COLOR,
        font: { family: CHART_FONT, size: 9 },
        callback: (v) => (yLabel ? yLabel(v as number) : String(v)),
      },
      border: { color: GRID_COLOR },
    },
  },
});

export default function AnalyticsTab({ sessions, goalHours }: Props) {
  const now = Date.now();
  const DAY = 86400000;

  // ── Overview stats ──────────────────────────────────────────────────────────
  const last28 = sessions.filter((s) => s.start >= now - 28 * DAY);
  const completed = last28.filter(
    (s) => s.end && (s.end - s.start) / 3600000 >= s.goal
  );
  const totalFasts = last28.length;
  const avgFastHours =
    last28.length > 0
      ? last28.reduce((acc, s) => acc + (s.end - s.start) / 3600000, 0) /
        last28.length
      : 0;
  const goalHitRate =
    last28.length > 0
      ? Math.round((completed.length / last28.length) * 100)
      : 0;

  function avgTime(sessions: FastSession[], getTs: (s: FastSession) => number): string {
    if (sessions.length === 0) return "--:--";
    const totalMins = sessions.reduce((acc, s) => {
      const d = new Date(getTs(s));
      return acc + d.getHours() * 60 + d.getMinutes();
    }, 0);
    const avg = Math.round(totalMins / sessions.length);
    return `${String(Math.floor(avg / 60)).padStart(2, "0")}:${String(avg % 60).padStart(2, "0")}`;
  }

  const usualStart = avgTime(last28, (s) => s.start);
  const firstMeal = avgTime(
    last28.filter((s) => s.end),
    (s) => s.end
  );

  // ── Duration bar chart (last 14 days) ───────────────────────────────────────
  const last14Labels: string[] = [];
  const last14Durations: number[] = [];
  const last14Colors: string[] = [];

  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now - i * DAY);
    dayStart.setHours(0, 0, 0, 0);
    const dayKey = localDateKey(dayStart.getTime());
    const d = new Date(dayStart);
    last14Labels.push(
      `${d.getDate()}/${d.getMonth() + 1}`
    );
    const daySession = sessions.find(
      (s) => localDateKey(s.start) === dayKey && s.end
    );
    const dur = daySession
      ? Math.round(((daySession.end - daySession.start) / 3600000) * 10) / 10
      : 0;
    last14Durations.push(dur);
    last14Colors.push(dur >= goalHours ? "#00C853" : dur > 0 ? "#FF3B30" : "#1a1a1a");
  }

  const durationData: ChartData<"bar"> = {
    labels: last14Labels,
    datasets: [
      {
        data: last14Durations,
        backgroundColor: last14Colors,
        borderColor: last14Colors,
        borderWidth: 0,
        barPercentage: 0.7,
      },
    ],
  };

  const durationOptions: ChartOptions<"bar"> = {
    ...baseBarOptions(10, 22, (v) => `${v}h`),
    plugins: {
      ...baseBarOptions(10, 22, (v) => `${v}h`).plugins,
      annotation: undefined,
    },
  };

  // Goal line via dataset approach (a thin dataset line as workaround)
  // We'll draw the dashed line manually on the canvas

  // ── Start time distribution ─────────────────────────────────────────────────
  const startHours: Record<number, number> = {};
  for (let h = 17; h <= 23; h++) startHours[h] = 0;
  for (const s of last28) {
    const h = new Date(s.start).getHours();
    if (h >= 17 && h <= 23) startHours[h]++;
  }

  const startDistData: ChartData<"bar"> = {
    labels: Object.keys(startHours).map((h) => `${h}:00`),
    datasets: [
      {
        data: Object.values(startHours),
        backgroundColor: "#FF3B30",
        borderColor: "#FF3B30",
        borderWidth: 0,
        barPercentage: 0.65,
      },
    ],
  };

  // ── First meal distribution ──────────────────────────────────────────────────
  const endHours: Record<number, number> = {};
  for (let h = 10; h <= 16; h++) endHours[h] = 0;
  for (const s of last28.filter((s) => s.end)) {
    const h = new Date(s.end).getHours();
    if (h >= 10 && h <= 16) endHours[h]++;
  }

  const endDistData: ChartData<"bar"> = {
    labels: Object.keys(endHours).map((h) => `${h}:00`),
    datasets: [
      {
        data: Object.values(endHours),
        backgroundColor: "#00C853",
        borderColor: "#00C853",
        borderWidth: 0,
        barPercentage: 0.65,
      },
    ],
  };

  // ── Weekly goal achievement ──────────────────────────────────────────────────
  const weeklyLabels: string[] = [];
  const weeklyPcts: number[] = [];
  const weeklyColors: string[] = [];

  for (let w = 4; w >= 1; w--) {
    weeklyLabels.push(`W-${w}`);
    const weekSessions: FastSession[] = [];
    for (let d = 0; d < 7; d++) {
      const dayStart = new Date(now - (w * 7 - d) * DAY);
      dayStart.setHours(0, 0, 0, 0);
      const dayKey = localDateKey(dayStart.getTime());
      const match = sessions.find((s) => localDateKey(s.start) === dayKey && s.end);
      if (match) weekSessions.push(match);
    }
    const qualifying = weekSessions.filter(
      (s) => (s.end - s.start) / 3600000 >= s.goal
    ).length;
    const pct =
      weekSessions.length > 0
        ? Math.round((qualifying / 7) * 100)
        : 0;
    weeklyPcts.push(pct);
    weeklyColors.push(pct >= 80 ? "#00C853" : pct >= 50 ? "#F57C00" : "#FF3B30");
  }

  const weeklyData: ChartData<"bar"> = {
    labels: weeklyLabels,
    datasets: [
      {
        data: weeklyPcts,
        backgroundColor: weeklyColors,
        borderColor: weeklyColors,
        borderWidth: 0,
        barPercentage: 0.55,
      },
    ],
  };

  const countOptions = baseBarOptions(0, 100, (v) => `${v}%`);
  const distOptions = baseBarOptions(0, Math.max(...Object.values(startHours), 1) + 1, String);
  const endDistOptions = baseBarOptions(0, Math.max(...Object.values(endHours), 1) + 1, String);

  // Duration chart with goal line plugin
  const durationWithGoalOptions: ChartOptions<"bar"> = {
    ...durationOptions,
    plugins: {
      ...durationOptions.plugins,
    },
  };

  // ── Duration chart with goal annotation drawn via afterDraw ─────────────────
  const goalLinePlugin = {
    id: "goalLine",
    afterDraw(chart: Chart) {
      const { ctx, scales, chartArea } = chart;
      if (!scales.y || !chartArea) return;
      const y = scales.y.getPixelForValue(goalHours);
      if (y < chartArea.top || y > chartArea.bottom) return;
      ctx.save();
      ctx.strokeStyle = "#555";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
      ctx.restore();
    },
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 pt-4 pb-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="font-mono text-xl font-bold tracking-widest uppercase text-white"
          style={{ letterSpacing: "0.15em" }}
        >
          FAST//TRACK
        </h1>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">
          ANALYTICS
        </span>
      </div>

      {/* Overview 2x2 grid */}
      <section>
        <SectionHeader>Overview</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Avg Fast"
            value={`${avgFastHours.toFixed(1)}h`}
            sub={`${goalHitRate}% goal hit rate`}
          />
          <StatCard
            label="Total Fasts"
            value={String(totalFasts)}
            sub="last 28 days"
          />
          <StatCard
            label="Usual Start"
            value={usualStart}
            sub="avg start time"
          />
          <StatCard
            label="First Meal"
            value={firstMeal}
            sub="avg end time"
          />
        </div>
      </section>

      {/* Duration chart */}
      <section>
        <SectionHeader>Fasting Duration — Last 14 Days</SectionHeader>
        <div
          className="border border-[#2a2a2a] p-3"
          style={{ borderRadius: "4px", background: CARD_BG, height: "180px" }}
        >
          <Bar
            data={durationData}
            options={durationWithGoalOptions}
            plugins={[goalLinePlugin]}
          />
        </div>
      </section>

      {/* Start time distribution */}
      <section>
        <SectionHeader>Start Time Distribution</SectionHeader>
        <div
          className="border border-[#2a2a2a] p-3"
          style={{ borderRadius: "4px", background: CARD_BG, height: "160px" }}
        >
          <Bar data={startDistData} options={distOptions} />
        </div>
      </section>

      {/* First meal distribution */}
      <section>
        <SectionHeader>First Meal Distribution</SectionHeader>
        <div
          className="border border-[#2a2a2a] p-3"
          style={{ borderRadius: "4px", background: CARD_BG, height: "160px" }}
        >
          <Bar data={endDistData} options={endDistOptions} />
        </div>
      </section>

      {/* Weekly goal achievement */}
      <section>
        <SectionHeader>Weekly Goal Achievement</SectionHeader>
        <div
          className="border border-[#2a2a2a] p-3"
          style={{ borderRadius: "4px", background: CARD_BG, height: "160px" }}
        >
          <Bar data={weeklyData} options={countOptions} />
        </div>
      </section>
    </div>
  );
}
