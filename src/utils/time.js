

export function formatTime(t) {
  if (!Number.isFinite(t)) return "00:00";
  const total = Math.floor(t);
  const mm = Math.floor(total / 60).toString().padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
