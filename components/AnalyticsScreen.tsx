"use client";
import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from "recharts";
import { useFastStore } from "@/lib/store";
import {
  DateRange, filterByDays, avgFastHours, goalHitRate,
  currentStreak, longestStreak,
  buildDurationChartData, buildRollingAvg,
  buildStartTimeData, buildFirstMealData,
  buildWeeklyData, generateInsight,
} from "@/lib/analytics";
import { Wordmark } from "./Wordmark";

const RANGES: DateRange[] = [7, 14, 30, 90];

function StatTile({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl p-4">
      <p className="text-2xl font-bold text-[#111111] leading-none">{value}</p>
      <p className="text-xs text-[#888888] mt-1 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-[#888888] mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl p-4">
      {title && <p className="text-sm font-semibold text-[#111111] mb-3">{title}</p>}
      {children}
    </div>
  );
}

export function AnalyticsScreen() {
  const { state } = useFastStore();
  const { records, goalHours } = state;

  const [range, setRange] = useState<DateRange>(14);
  const [chartMode, setChartMode] = useState<"bar" | "line">("bar");

  const filtered = filterByDays(records, range);
  const allRecords = records; // for streaks (all-time)

  const avg = avgFastHours(filtered);
  const hitRate = goalHitRate(filtered);
  const streak = currentStreak(allRecords);
  const longest = longestStreak(allRecords);
  const insight = generateInsight(filtered);

  const durationData = buildDurationChartData(filtered, range, goalHours);
  const rollingAvg = buildRollingAvg(durationData);
  const lineData = durationData.map((d, i) => ({ ...d, avg: rollingAvg[i] }));

  const startTimeData = buildStartTimeData(filtered);
  const maxStart = Math.max(...startTimeData.map((d) => d.count), 1);

  const firstMealData = buildFirstMealData(filtered);
  const maxMeal = Math.max(...firstMealData.map((d) => d.count), 1);

  const weeklyData = buildWeeklyData(allRecords);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <Wordmark />
        <span className="text-sm text-[#888888] font-medium">Analytics</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
        {/* Date range selector */}
        <div className="flex bg-[#f7f7f7] border border-[#e8e8e8] rounded-full p-1 gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                range === r
                  ? "bg-[#111111] text-white"
                  : "text-[#888888]"
              }`}
              aria-pressed={range === r}
            >
              {r}d
            </button>
          ))}
        </div>

        {/* Stat tiles 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            value={avg > 0 ? `${avg.toFixed(1)}h` : "–"}
            label="Avg Fast"
          />
          <StatTile
            value={String(filtered.length)}
            label="Total Fasts"
            sub={`last ${range} days`}
          />
          <StatTile
            value={filtered.length > 0 ? `${Math.round(hitRate)}%` : "–"}
            label="Goal Hit Rate"
          />
          <StatTile
            value={`${streak} day`}
            label="Current Streak"
            sub="🔥"
          />
        </div>

        {/* Streak card */}
        <SectionCard title="">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-[#111111]">
                Current streak: {streak} {streak === 1 ? "day" : "days"} 🔥
              </p>
              <p className="text-xs text-[#888888] mt-0.5">
                Longest streak: {longest} {longest === 1 ? "day" : "days"}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Fasting Duration chart */}
        <SectionCard title="Fasting Duration">
          <div className="flex justify-end mb-2">
            <div className="flex bg-white border border-[#e8e8e8] rounded-full overflow-hidden text-[11px]">
              {(["bar", "line"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className={`px-3 py-1 font-medium transition-colors capitalize ${
                    chartMode === mode
                      ? "bg-[#111111] text-white"
                      : "text-[#888888]"
                  }`}
                  aria-pressed={chartMode === mode}
                >
                  {mode === "bar" ? "Bar" : "Line"}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            {chartMode === "bar" ? (
              <BarChart data={durationData} barSize={Math.max(4, Math.floor(280 / range))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#888888" }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(range / 7)}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#888888" }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, Math.max(goalHours + 4, 24)]}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e8e8e8",
                    fontSize: 11,
                    backgroundColor: "#fff",
                  }}
                  formatter={(v: number) => [`${v}h`, "Duration"]}
                  labelStyle={{ color: "#888888" }}
                />
                <ReferenceLine
                  y={goalHours}
                  stroke="#111111"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Bar dataKey="durationH" radius={[3, 3, 0, 0]}>
                  {durationData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.durationH === 0 ? "#e8e8e8" : entry.hit ? "#4caf7d" : "#ff5c5c"}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#888888" }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(range / 7)}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#888888" }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, Math.max(goalHours + 4, 24)]}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e8e8e8",
                    fontSize: 11,
                    backgroundColor: "#fff",
                  }}
                  formatter={(v: number, name: string) => [
                    `${v}h`,
                    name === "durationH" ? "Duration" : "7-day avg",
                  ]}
                  labelStyle={{ color: "#888888" }}
                />
                <ReferenceLine
                  y={goalHours}
                  stroke="#111111"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Line
                  type="monotone"
                  dataKey="durationH"
                  stroke="#ff5c5c"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#ff5c5c" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#888888"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </SectionCard>

        {/* Start Time Distribution */}
        <SectionCard title="Start Time Distribution">
          <div className="flex flex-col gap-2">
            {startTimeData.map((d) => (
              <div key={d.time} className="flex items-center gap-2">
                <span className="text-[10px] text-[#888888] w-10 shrink-0">{d.time}</span>
                <div className="flex-1 bg-[#e8e8e8] rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-[#ff5c5c] rounded-full transition-all duration-500"
                    style={{ width: `${(d.count / maxStart) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#888888] w-4 text-right shrink-0">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* First Meal Distribution */}
        <SectionCard title="First Meal Distribution">
          <div className="flex flex-col gap-2">
            {firstMealData.map((d) => (
              <div key={d.time} className="flex items-center gap-2">
                <span className="text-[10px] text-[#888888] w-10 shrink-0">{d.time}</span>
                <div className="flex-1 bg-[#e8e8e8] rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-[#4caf7d] rounded-full transition-all duration-500"
                    style={{ width: `${(d.count / maxMeal) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#888888] w-4 text-right shrink-0">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Weekly Goal Achievement */}
        <SectionCard title="Weekly Goal Achievement">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weeklyData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#888888" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#888888" }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e8e8e8",
                  fontSize: 11,
                  backgroundColor: "#fff",
                }}
                formatter={(v: number) => [`${v}%`, "Goal rate"]}
                labelStyle={{ color: "#888888" }}
              />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {weeklyData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Insight card */}
        <div className="bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl px-4 py-3">
          <p className="text-sm text-[#888888] leading-relaxed">{insight}</p>
        </div>
      </div>
    </div>
  );
}
