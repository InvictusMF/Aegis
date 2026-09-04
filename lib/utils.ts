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
      return { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-600" };
    case "HIGH":
      return { text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500" };
    case "MODERATE":
      return { text: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" };
    case "LOW":
    default:
      return { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-600" };
  }
}

export function getConfidenceBadge(confidence: string) {
  switch (confidence) {
    case "VERY_HIGH":
    case "HIGH":
      return { label: "High Confidence", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-600" };
    case "MODERATE":
      return { label: "Moderate Confidence", text: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", dot: "bg-indigo-500" };
    case "LOW":
    default:
      return { label: "Low Confidence", text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", dot: "bg-slate-400" };
  }
}
