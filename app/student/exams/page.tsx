"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Exam, Attempt } from "@/types";
import { Shield, Clock, BookOpen, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/exams").then((r) => r.json()),
      fetch("/api/attempts").then((r) => r.json()),
    ])
      .then(([examsData, attemptsData]) => {
        if (examsData.exams) setExams(examsData.exams);
        if (attemptsData.attempts) setAttempts(attemptsData.attempts);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 mb-1">
            <Shield className="h-3.5 w-3.5" />
            STUDENT EXAMINATION PORTAL
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Assigned Examinations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Active and upcoming proctored examination sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
          <span>Active Session:</span>
          <span className="text-cyan-300 font-bold">Privacy-Preserving Telemetry Enabled</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
          <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No Assigned Exams</h3>
          <p className="text-sm text-slate-400 mt-1">You currently have no pending exam assignments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => {
            const existingAttempt = attempts.find((a) => a.exam_id === exam.id);
            const isCompleted = existingAttempt?.status === "SUBMITTED";
            const isInProgress = existingAttempt?.status === "IN_PROGRESS";

            return (
              <div
                key={exam.id}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                      {exam.duration_minutes} MINUTES
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle className="h-3 w-3" /> Submitted
                      </span>
                    ) : isInProgress ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                        <AlertCircle className="h-3 w-3" /> In Progress
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                        Ready to Start
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{exam.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-2">
                    {exam.description}
                  </p>

                  <div className="text-xs text-slate-500 space-y-1 mb-6 border-t border-slate-800/60 pt-3">
                    <div className="flex items-center justify-between">
                      <span>Window Start:</span>
                      <span className="font-mono text-slate-400">{formatDate(exam.starts_at)}</span>
                    </div>
                    {isCompleted && typeof existingAttempt?.score === "number" && (
                      <div className="flex items-center justify-between font-semibold text-slate-300">
                        <span>Recorded Score:</span>
                        <span className="font-mono text-cyan-400">{existingAttempt.score}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {isCompleted ? (
                    <Link
                      href={`/examiner/report/${existingAttempt?.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-all"
                    >
                      View Submission & Integrity Summary
                    </Link>
                  ) : (
                    <Link
                      href={`/student/exam/${exam.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold transition-all shadow-md shadow-cyan-500/20"
                    >
                      {isInProgress ? "Resume Active Exam" : "Start Examination"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
