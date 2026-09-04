"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { Shield } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExaminer = pathname.startsWith("/examiner");
  const isActiveExam = pathname.startsWith("/student/exam/");

  if (isExaminer) {
    // Examiner shell handles its own layout with Sidebar + Header
    return <>{children}</>;
  }

  if (isActiveExam) {
    // Active exam is distraction-free proctored sandbox
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="font-mono font-bold text-slate-700">AEGIS</span>
            <span className="text-slate-400">—</span>
            <span className="text-slate-600">Enterprise Examination Integrity & Human Review</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy Architecture
            </Link>
            <span>•</span>
            <Link href="/examiner" className="hover:text-slate-900 transition-colors">
              Examiner SOC
            </Link>
            <span>•</span>
            <Link href="/examiner/attack-lab" className="hover:text-slate-900 transition-colors">
              Attack Lab
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
