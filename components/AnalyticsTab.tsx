"use client";

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

const CHART_FONT = "ui-monospace, 'SF Mono', monospace";
const GRID_COLOR = "#EBEBEB";
const TICK_COLOR = "#8E8E93";
const CARD_BG = "#F5F5F7";
const CARD_RADIUS = "20px";
const CARD_SHADOW = "0 2px 12px rgba(0,0,0,0.06)";

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
      style={{
        background: CARD_BG,
        borderRadius: CARD_RADIUS,
        padding: "16px",
        boxShadow: CARD_SHADOW,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "#8E8E93",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#1C1C1E",
          lineHeight: 1.1,
          fontFamily: "ui-monospace, 'SF Mono', monospace",
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontSize: "11px",
            color: "#8E8E93",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <h2
      style={{
        fontSize: "11px",
        fontWeight: 700,
        color: "#8E8E93",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "10px",
      }}
    >
      {children}
    </h2>
  );
}

function ChartCard({ children, height = 160 }: { children: React.ReactNode; height?: number }) {
  return (
    <div
      style={{
        background: CARD_BG,
        borderRadius: CARD_RADIUS,
        padding: "14px",
        boxShadow: CARD_SHADOW,
        height: `${height}px`,
      }}
    >
      {children}
    </div>
  );
}

function baseBarOptions(
  yMin: number,
  yMax: number,
  yLabel?: (v: number) => string
): ChartOptions<"bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1C1C1E",
        titleColor: "#fff",
        bodyColor: "#fff",
        cornerRadius: 8,
        titleFont: { family: CHART_FONT, size: 10 },
        bodyFont: { family: CHART_FONT, size: 10 },
        callbacks: {
          label: (ctx) => yLabel ? yLabel(ctx.parsed.y) : String(ctx.parsed.y),
        },
      },
    },
    scales: {
      x: {
        grid: { color: GRID_COLOR },
        ticks: {
          color: TICK_COLOR,
          font: { family: CHART_FONT, size: 10 },
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
          font: { family: CHART_FONT, size: 10 },
          callback: (v) => yLabel ? yLabel(v as number) : String(v),
        },
        border: { color: GRID_COLOR },
      },
    },
  };
}

// Goal line plugin for duration chart
const goalLinePlugin = (goalHours: number) => ({
  id: "goalLine",
  afterDraw(chart: Chart) {
    const { ctx, scales, chartArea } = chart;
    if (!scales.y || !chartArea) return;
    const y = scales.y.getPixelForValue(goalHours);
    if (y < chartArea.top || y > chartArea.bottom) return;
    ctx.save();
    ctx.strokeStyle = "#8E8E93";
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(chartArea.left, y);
    ctx.lineTo(chartArea.right, y);
    ctx.stroke();
    ctx.restore();
  },
});

export default function AnalyticsTab({ sessions, goalHours }: Props) {
  const now = Date.now();
  const DAY = 86400000;

  // ── Overview stats ──────────────────────────────────────────────────────────
  const last28 = sessions.filter((s) => s.start >= now - 28 * DAY);
  const completed = last28.filter((s) => s.end && (s.end - s.start) / 3600000 >= s.goal);
  const totalFasts = last28.length;
  const avgFastHours =
    last28.length > 0
      ? last28.reduce((acc, s) => acc + (s.end - s.start) / 3600000, 0) / last28.length
      : 0;
  const goalHitRate = last28.length > 0 ? Math.round((completed.length / last28.length) * 100) : 0;

  function avgTime(arr: FastSession[], getTs: (s: FastSession) => number): string {
    if (arr.length === 0) return "—";
    const totalMins = arr.reduce((acc, s) => {
      const d = new Date(getTs(s));
      return acc + d.getHours() * 60 + d.getMinutes();
    }, 0);
    const avg = Math.round(totalMins / arr.length);
    return `${String(Math.floor(avg / 60)).padStart(2, "0")}:${String(avg % 60).padStart(2, "0")}`;
  }

  const usualStart = avgTime(last28, (s) => s.start);
  const firstMeal = avgTime(last28.filter((s) => s.end), (s) => s.end);

  // ── Duration chart (last 14 days) ────────────────────────────────────────────
  const last14Labels: string[] = [];
  const last14Durations: number[] = [];
  const last14Colors: string[] = [];

  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now - i * DAY);
    dayStart.setHours(0, 0, 0, 0);
    const dayKey = localDateKey(dayStart.getTime());
    const d = new Date(dayStart);
    last14Labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
    const daySession = sessions.find((s) => localDateKey(s.start) === dayKey && s.end);
    const dur = daySession
      ? Math.round(((daySession.end - daySession.start) / 3600000) * 10) / 10
      : 0;
    last14Durations.push(dur);
    last14Colors.push(dur >= goalHours ? "#34C759" : dur > 0 ? "#FF6B6B" : "#E5E5EA");
  }

  const durationData: ChartData<"bar"> = {
    labels: last14Labels,
    datasets: [
      {
        data: last14Durations,
        backgroundColor: last14Colors,
        borderColor: last14Colors,
        borderWidth: 0,
        borderRadius: 6,
        barPercentage: 0.72,
      },
    ],
  };

  // ── Start time distribution ─────────────────────────────────────────────────
  const startHours: Record<number, number> = {};
  for (let h = 17; h <= 23; h++) startHours[h] = 0;
  for (const s of last28) {
    const h = new Date(s.start).getHours();
    if (h >= 17 && h <= 23) startHours[h]++;
  }
  const maxStart = Math.max(...Object.values(startHours), 1);

  const startDistData: ChartData<"bar"> = {
    labels: Object.keys(startHours).map((h) => `${h}:00`),
    datasets: [
      {
        data: Object.values(startHours),
        backgroundColor: "#FF6B6B",
        borderColor: "#FF6B6B",
        borderWidth: 0,
        borderRadius: 6,
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
  const maxEnd = Math.max(...Object.values(endHours), 1);

  const endDistData: ChartData<"bar"> = {
    labels: Object.keys(endHours).map((h) => `${h}:00`),
    datasets: [
      {
        data: Object.values(endHours),
        backgroundColor: "#34C759",
        borderColor: "#34C759",
        borderWidth: 0,
        borderRadius: 6,
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
    for (let dd = 0; dd < 7; dd++) {
      const dayStart = new Date(now - (w * 7 - dd) * DAY);
      dayStart.setHours(0, 0, 0, 0);
      const dayKey = localDateKey(dayStart.getTime());
      const match = sessions.find((s) => localDateKey(s.start) === dayKey && s.end);
      if (match) weekSessions.push(match);
    }
    const qualifying = weekSessions.filter(
      (s) => (s.end - s.start) / 3600000 >= s.goal
    ).length;
    const pct = Math.round((qualifying / 7) * 100);
    weeklyPcts.push(pct);
    weeklyColors.push(pct >= 80 ? "#34C759" : pct >= 50 ? "#F59E0B" : "#FF6B6B");
  }

  const weeklyData: ChartData<"bar"> = {
    labels: weeklyLabels,
    datasets: [
      {
        data: weeklyPcts,
        backgroundColor: weeklyColors,
        borderColor: weeklyColors,
        borderWidth: 0,
        borderRadius: 6,
        barPercentage: 0.55,
      },
    ],
  };

  const durationOptions = baseBarOptions(10, 22, (v) => `${v}h`);
  const distOptions = baseBarOptions(0, maxStart + 1, String);
  const endDistOptions = baseBarOptions(0, maxEnd + 1, String);
  const weeklyOptions = baseBarOptions(0, 100, (v) => `${v}%`);

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: "#FFFFFF" }}
    >
      <div className="flex flex-col px-5 pt-5 pb-8 gap-6">

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
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#8E8E93",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Analytics
          </span>
        </div>

        {/* Overview */}
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
              sub="avg break-fast"
            />
          </div>
        </section>

        {/* Duration chart */}
        <section>
          <SectionHeader>Fasting Duration — Last 14 Days</SectionHeader>
          <ChartCard height={180}>
            <Bar
              data={durationData}
              options={durationOptions}
              plugins={[goalLinePlugin(goalHours)]}
            />
          </ChartCard>
        </section>

        {/* Start time distribution */}
        <section>
          <SectionHeader>Start Time Distribution</SectionHeader>
          <ChartCard height={160}>
            <Bar data={startDistData} options={distOptions} />
          </ChartCard>
        </section>

        {/* First meal distribution */}
        <section>
          <SectionHeader>First Meal Distribution</SectionHeader>
          <ChartCard height={160}>
            <Bar data={endDistData} options={endDistOptions} />
          </ChartCard>
        </section>

        {/* Weekly goal achievement */}
        <section>
          <SectionHeader>Weekly Goal Achievement</SectionHeader>
          <ChartCard height={160}>
            <Bar data={weeklyData} options={weeklyOptions} />
          </ChartCard>
        </section>

      </div>
    </div>
  );
}
