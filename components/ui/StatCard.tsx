import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  highlight?: "default" | "blue" | "emerald" | "amber" | "rose";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  trend,
  highlight = "default",
  className,
}: StatCardProps) {
  const highlightStyles = {
    default: "border-slate-200 bg-white",
    blue: "border-blue-200 bg-blue-50/30",
    emerald: "border-emerald-200 bg-emerald-50/30",
    amber: "border-amber-200 bg-amber-50/30",
    rose: "border-rose-200 bg-rose-50/30",
  };

  const iconStyles = {
    default: "bg-slate-100 text-slate-700",
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md",
        highlightStyles[highlight],
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
          {label}
        </span>
        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", iconStyles[highlight])}>
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              trend.isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-500 leading-snug">{subtitle}</p>}
    </div>
  );
}
