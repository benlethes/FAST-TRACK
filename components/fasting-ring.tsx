"use client"

type FastingRingProps = {
  progress: number // 0..1
  dimmed?: boolean
  children: React.ReactNode
}

const SIZE = 300
const STROKE = 10
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function FastingRing({ progress, dimmed = false, children }: FastingRingProps) {
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)))

  return (
    <div className="relative aspect-square w-full max-w-[300px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-ring-track)"
          strokeWidth={STROKE}
          className={dimmed ? "opacity-40" : "opacity-100"}
        />
        {/* Progress */}
        {!dimmed && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  )
}
