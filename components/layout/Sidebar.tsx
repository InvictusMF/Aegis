"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Eye,
  Search,
  FileCheck2,
  Terminal,
  Lock,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const navGroups = [
    {
      title: "OVERVIEW",
      items: [
        {
          href: "/examiner",
          label: "Operations Dashboard",
          icon: LayoutDashboard,
          badge: null,
        },
      ],
    },
    {
      title: "MONITOR",
      items: [
        {
          href: "/examiner/live",
          label: "Live Monitoring Wall",
          icon: Eye,
          badge: "REALTIME",
        },
      ],
    },
    {
      title: "INVESTIGATE",
      items: [
        {
          href: "/examiner/investigate/at000000-0000-0000-0000-000000000002",
          label: "Alex Mercer (Flagship)",
          icon: Search,
          badge: "HIGH RISK",
        },
      ],
    },
    {
      title: "REPORTS",
      items: [
        {
          href: "/examiner/report/at000000-0000-0000-0000-000000000002",
          label: "Official Evidence Dossier",
          icon: FileCheck2,
          badge: "PRINTABLE",
        },
      ],
    },
    {
      title: "TOOLS & LAB",
      items: [
        {
          href: "/examiner/attack-lab",
          label: "Attack Simulation Lab",
          icon: Terminal,
          badge: "SANDBOX",
        },
      ],
    },
    {
      title: "SYSTEM & ACCESS",
      items: [
        {
          href: "/privacy",
          label: "Privacy & Ethics Center",
          icon: Lock,
          badge: null,
        },
        {
          href: "/student/exams",
          label: "Student Portal Preview",
          icon: UserCheck,
          badge: null,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand logo & collapse button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/80">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105">
              <Shield className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-slate-900 tracking-tight text-lg">AEGIS</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60 font-mono">
                    SOC
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium tracking-tight">Security & Integrity Ops</p>
              </div>
            )}
          </Link>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Navigation items grouped */}
        <div className="p-3 space-y-6 flex-1">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 font-mono uppercase mb-1">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/examiner" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative group",
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
                      )}
                    />
                    {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider",
                          item.badge === "REALTIME"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.badge === "HIGH RISK"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Human Oversight & Ethics Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
          <div className="rounded-xl p-3 bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold font-mono text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              HUMAN OVERSIGHT
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              AI & ML predictions serve exclusively as advisory telemetry for authorized human examiners.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 transition-all duration-200 sticky top-0 h-screen z-30",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
