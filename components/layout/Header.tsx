"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, ShieldAlert, Cpu, UserCheck, Eye, Terminal, FileText, Lock, Users, Sparkles } from "lucide-react";
import { Profile } from "@/types";

export function Header() {
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
    { href: "/", label: "Overview", icon: Shield },
    { href: "/examiner", label: "Examiner Operations", icon: Cpu },
    { href: "/examiner/live", label: "Live Monitoring", icon: Eye },
    { href: "/examiner/attack-lab", label: "Attack Lab", icon: Terminal },
    { href: "/student/exams", label: "Student Portal", icon: UserCheck },
    { href: "/privacy", label: "Privacy Center", icon: Lock },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Shield className="h-5 w-5" />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">AEGIS</span>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                  INTEGRITY OPS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block font-sans">Secure Exams. Trusted Results.</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Switcher / Role Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-lg p-1.5">
            <Users className="h-3.5 w-3.5 text-slate-400 ml-1" />
            <select
              disabled={isSwitching}
              value={currentUser?.id || ""}
              onChange={(e) => switchUser(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-2 font-medium"
            >
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.full_name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE TELEMETRY
          </div>
        </div>
      </div>
    </header>
  );
}
