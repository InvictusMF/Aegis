import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  animate?: boolean;
}

export function StatusBadge({ status, className, animate = false }: StatusBadgeProps) {
  let style = "bg-slate-100 text-slate-700 border-slate-200";
  let dot = "bg-slate-400";
  let label = status.replace(/_/g, " ");

  switch (status) {
    case "IN_PROGRESS":
      style = "bg-blue-50 text-blue-700 border-blue-200";
      dot = "bg-blue-600";
      label = "In Progress";
      break;
    case "SUBMITTED":
    case "RESOLVED":
      style = "bg-emerald-50 text-emerald-700 border-emerald-200";
      dot = "bg-emerald-600";
      label = status === "RESOLVED" ? "Resolved" : "Submitted";
      break;
    case "REVIEW_RECOMMENDED":
    case "UNDER_REVIEW":
      style = "bg-amber-50 text-amber-800 border-amber-200";
      dot = "bg-amber-600";
      label = status === "REVIEW_RECOMMENDED" ? "Review Recommended" : "Under Review";
      break;
    case "CRITICAL":
    case "POLICY_VIOLATION":
      style = "bg-rose-50 text-rose-700 border-rose-200";
      dot = "bg-rose-600";
      label = status === "POLICY_VIOLATION" ? "Policy Violation" : "Critical";
      break;
    case "NORMAL":
    case "NO_ACTION":
    case "DISMISSED":
      style = "bg-slate-100 text-slate-700 border-slate-200";
      dot = "bg-slate-500";
      label = status === "NO_ACTION" ? "No Action" : status === "DISMISSED" ? "Dismissed" : "Normal";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-tight",
        style,
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", dot, animate && status === "IN_PROGRESS" && "animate-pulse")}
      />
      {label}
    </span>
  );
}
