import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(isoString?: string | null): string {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs > 0 ? `${secs}s` : ""}`;
}

export function getRiskColor(band: string) {
  switch (band) {
    case "CRITICAL":
      return { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" };
    case "HIGH":
      return { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" };
    case "MODERATE":
      return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" };
    case "LOW":
    default:
      return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
  }
}

export function getConfidenceBadge(confidence: string) {
  switch (confidence) {
    case "HIGH":
      return { label: "High Confidence", text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" };
    case "MODERATE":
      return { label: "Moderate Confidence", text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" };
    case "LOW":
    default:
      return { label: "Low Confidence", text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30" };
  }
}
