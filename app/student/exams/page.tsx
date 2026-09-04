"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Exam, Attempt } from "@/types";
import { Shield, Clock, BookOpen, ArrowRight, CheckCircle, AlertCircle, Lock, Calendar } from "lucide-react";
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <Shield className="h-4 w-4 text-blue-600" />
            Student Examination Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Assigned Examinations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official academic assessment sessions configured with on-device proctoring.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 shadow-xs">
          <Lock className="h-3.5 w-3.5 text-blue-600" />
          <span>Local On-Device Vision Active</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Assigned Examinations</h3>
          <p className="text-xs text-slate-500 mt-1">You currently have no pending exam assignments.</p>
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
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                      {exam.duration_minutes} MINUTES
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle className="h-3.5 w-3.5" /> Submitted
                      </span>
                    ) : isInProgress ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 animate-pulse">
                        <AlertCircle className="h-3.5 w-3.5" /> In Progress
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        Ready to Start
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{exam.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                    {exam.description}
                  </p>

                  <div className="text-xs text-slate-500 space-y-1.5 mb-6 border-t border-slate-100 pt-3 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Scheduled Start:</span>
                      <span className="text-slate-700 font-semibold">{formatDate(exam.starts_at)}</span>
                    </div>
                    {isCompleted && typeof existingAttempt?.score === "number" && (
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-400">Final Score:</span>
                        <span className="text-blue-700 font-bold">{existingAttempt.score}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {isCompleted ? (
                    <Link
                      href={`/examiner/report/${existingAttempt?.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-xs"
                    >
                      View Submission & Integrity Summary
                    </Link>
                  ) : (
                    <Link
                      href={`/student/exam/${exam.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      {isInProgress ? "Resume Active Examination" : "Begin Examination"}
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
