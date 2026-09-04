"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Cpu,
  UserCheck,
  Eye,
  Terminal,
  Lock,
  Users,
  Radio,
  Menu,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Profile } from "@/types";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  showNav?: boolean;
}

export function Header({ onToggleMobileMenu, showNav = true }: HeaderProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
        if (data.allProfiles) setAllProfiles(data.allProfiles);
      })
      .catch((err) => console.error("Auth fetch error", err));
  }, []);

  const switchUser = async (userId: string) => {
    setIsSwitching(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSwitching(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/examiner", label: "Examiner Operations" },
    { href: "/examiner/live", label: "Live Wall" },
    { href: "/examiner/attack-lab", label: "Attack Lab" },
    { href: "/student/exams", label: "Student Portal" },
    { href: "/privacy", label: "Privacy Center" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Hamburger (mobile) & Brand / Breadcrumbs */}
        <div className="flex items-center gap-4 sm:gap-6">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 shadow-xs transition-transform group-hover:scale-105">
              <Shield className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 font-mono">AEGIS</span>
                <span className="rounded-md bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 border border-blue-200/60 font-mono">
                  INTEGRITY
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block font-sans font-medium">
                Secure Exams. Trusted Results.
              </p>
            </div>
          </Link>

          {/* Desktop Nav if enabled */}
          {showNav && (
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold pl-2">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors",
                      isActive
                        ? "bg-slate-100 text-blue-700 font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: Live Telemetry Pulse & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Live Telemetry Ping */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>LIVE TELEMETRY</span>
          </div>

          {/* Role/User Switcher */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shadow-xs hover:border-slate-300 transition-colors">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400 font-mono leading-none">
                Active Role
              </span>
              <select
                disabled={isSwitching}
                value={currentUser?.id || ""}
                onChange={(e) => switchUser(e.target.value)}
                className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1 leading-tight"
              >
                {allProfiles.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-900 bg-white">
                    {p.full_name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
