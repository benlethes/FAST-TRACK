export function Wordmark() {
  return (
    <span
      className="text-sm font-medium tracking-[0.1em] text-foreground"
      style={{ fontFamily: "var(--font-sans)" }}
      aria-label="FAST//TRACK"
    >
      FAST
      <span style={{ color: "#ff5c5c" }}>//</span>
      TRACK
    </span>
  );
}
