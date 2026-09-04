"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Exam, Question, Attempt, AttemptAnswer } from "@/types";
import { AegisVisionMonitor, VisionSignal } from "@/lib/vision/mediapipe";
import { formatTime } from "@/lib/utils";
import {
  Shield,
  Clock,
  Camera,
  CameraOff,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Save,
  Lock,
  Eye,
} from "lucide-react";

export default function ActiveExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<string>("All changes saved");
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Pre-exam consent state
  const [cameraApproved, setCameraApproved] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasStartedSession, setHasStartedSession] = useState<boolean>(false);

  // Vision telemetry state
  const [visionStatus, setVisionStatus] = useState<{
    type: string;
    description: string;
    facesCount: number;
  }>({
    type: "INITIALIZING",
    description: "Camera ready",
    facesCount: 1,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const visionMonitorRef = useRef<AegisVisionMonitor | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Ingest security event helper
  const sendSecurityEvent = useCallback(
    async (
      eventType: string,
      severity: string = "LOW",
      source: string = "BROWSER",
      durationMs: number = 0,
      metadata: any = {}
    ) => {
      if (!attempt) return;
      try {
        await fetch(`/api/attempts/${attempt.id}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: eventType,
            severity,
            source,
            duration_ms: durationMs,
            metadata: {
              ...metadata,
              question_id: questions[currentIdx]?.id,
            },
          }),
        });
      } catch (err) {
        console.error("Failed to post telemetry event", err);
      }
    },
    [attempt, questions, currentIdx]
  );

  // 2. Fetch Exam & Initialize Attempt
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch exam
        const examRes = await fetch(`/api/exams/${examId}`);
        const examData = await examRes.json();
        if (examData.exam) {
          setExam(examData.exam);
          setQuestions(examData.exam.questions || []);
        }

        // Start or resume attempt
        const attemptRes = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exam_id: examId }),
        });
        const attemptData = await attemptRes.json();
        if (attemptData.attempt) {
          setAttempt(attemptData.attempt);

          // Calculate server-authoritative timer countdown
          const startedAt = new Date(attemptData.attempt.started_at).getTime();
          const durationSec = (examData.exam?.duration_minutes || 60) * 60;
          const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
          const rem = Math.max(0, durationSec - elapsedSec);
          setRemainingSeconds(rem);

          // Fetch pre-existing answers
          const ansRes = await fetch(`/api/attempts/${attemptData.attempt.id}/answers`);
          const ansData = await ansRes.json();
          if (ansData.answers) {
            const map: Record<string, string> = {};
            ansData.answers.forEach((a: AttemptAnswer) => {
              map[a.question_id] = a.answer_value;
            });
            setAnswers(map);
          }
        }
      } catch (e) {
        console.error("Initialization error", e);
      }
    }
    loadData();
  }, [examId]);

  // 3. Server-authoritative timer countdown tick
  useEffect(() => {
    if (!hasStartedSession || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStartedSession, remainingSeconds]);

  // 4. Browser Security Event Listeners
  useEffect(() => {
    if (!hasStartedSession) return;

    let blurStart = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendSecurityEvent("TAB_SWITCH", "HIGH", "BROWSER", 0, { document_hidden: true });
      }
    };

    const handleBlur = () => {
      blurStart = Date.now();
      sendSecurityEvent("WINDOW_BLUR", "MEDIUM", "BROWSER", 0, { target: "window" });
    };

    const handleFocus = () => {
      const duration = blurStart > 0 ? Date.now() - blurStart : 0;
      sendSecurityEvent("WINDOW_FOCUS", "LOW", "BROWSER", duration, { restored: true });
    };

    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) {
        sendSecurityEvent("FULLSCREEN_EXIT", "HIGH", "BROWSER", 0, { fullscreen: false });
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      sendSecurityEvent("COPY_ATTEMPT", "MEDIUM", "BROWSER", 0, { action: "copy" });
    };

    const handlePaste = (e: ClipboardEvent) => {
      sendSecurityEvent("PASTE_ATTEMPT", "HIGH", "BROWSER", 0, { action: "paste" });
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      sendSecurityEvent("CONTEXT_MENU_ATTEMPT", "LOW", "BROWSER", 0, { action: "contextmenu" });
    };

    // Inactivity listener
    const resetInactivity = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        sendSecurityEvent("LONG_INACTIVITY", "LOW", "BROWSER", 45000, { idle_seconds: 45 });
      }, 45000);
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("paste", handlePaste);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("mousemove", resetInactivity);
    window.addEventListener("keydown", resetInactivity);

    resetInactivity();

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("mousemove", resetInactivity);
      window.removeEventListener("keydown", resetInactivity);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [hasStartedSession, sendSecurityEvent]);

  // 5. Initialize Computer Vision (MediaPipe) on Camera Approval
  const handleStartExamSession = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (e) {
      // Fullscreen prompt optional
    }

    if (videoRef.current) {
      const monitor = new AegisVisionMonitor();
      const ok = await monitor.initialize(videoRef.current, (signal: VisionSignal) => {
        setVisionStatus({
          type: signal.type,
          description: signal.metadata.description,
          facesCount: signal.metadata.facesCount,
        });

        // Dispatch camera telemetry to backend
        if (signal.type !== "FACE_DETECTED") {
          sendSecurityEvent(signal.type, signal.type === "MULTIPLE_FACES" ? "HIGH" : "MEDIUM", "COMPUTER_VISION", 0, signal.metadata);
        }
      });

      if (ok) {
        monitor.start();
        visionMonitorRef.current = monitor;
        setCameraApproved(true);
      }
    }

    setHasStartedSession(true);
    questionStartTimeRef.current = Date.now();
  };

  // Cleanup vision on unmount
  useEffect(() => {
    return () => {
      if (visionMonitorRef.current) {
        visionMonitorRef.current.stop();
      }
    };
  }, []);

  // 6. Autosave Answer Handler
  const handleAnswerChange = (val: string) => {
    const q = questions[currentIdx];
    if (!q || !attempt) return;

    setAnswers((prev) => ({ ...prev, [q.id]: val }));
    setSavingStatus("Saving changes...");

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

    autosaveTimeoutRef.current = setTimeout(async () => {
      const timeSpentDelta = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
      questionStartTimeRef.current = Date.now();

      try {
        await fetch(`/api/attempts/${attempt.id}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: q.id,
            answer_value: val,
            time_spent_delta: timeSpentDelta,
          }),
        });
        setSavingStatus(`Saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`);
      } catch (e) {
        setSavingStatus("Offline; retrying...");
      }
    }, 600);
  };

  // 7. Question Navigation
  const handleNavQuestion = (newIdx: number) => {
    // Record time delta for current question
    const q = questions[currentIdx];
    if (q && attempt) {
      const timeSpentDelta = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
      fetch(`/api/attempts/${attempt.id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: q.id,
          answer_value: answers[q.id] || "",
          time_spent_delta: timeSpentDelta,
        }),
      });
    }

    questionStartTimeRef.current = Date.now();
    setCurrentIdx(newIdx);
  };

  // 8. Submit Exam
  const handleSubmitExam = async () => {
    if (!attempt) return;
    try {
      const res = await fetch(`/api/attempts/${attempt.id}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (visionMonitorRef.current) {
        visionMonitorRef.current.stop();
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      router.push(`/examiner/report/${attempt.id}`);
    } catch (e) {
      alert("Error submitting exam. Please check connection.");
    }
  };

  const currentQ = questions[currentIdx];

  // Pre-Exam Permission & Privacy Screen
  if (!hasStartedSession) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{exam?.title || "Examination Setup"}</h1>
              <p className="text-xs text-slate-400">Privacy-Preserving Telemetry & Integrity Protocol</p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-slate-300">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-cyan-400" />
                Privacy & Telemetry Disclosure
              </h3>
              <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
                <li><strong className="text-slate-200">Local Computer Vision:</strong> Face tracking executes entirely inside your browser via MediaPipe. Raw webcam video is never recorded or streamed to servers.</li>
                <li><strong className="text-slate-200">Browser Sandboxing:</strong> Window focus, tab switches, and fullscreen state are observed for academic integrity.</li>
                <li><strong className="text-slate-200">Human Review Mandate:</strong> Automated signals and AI never determine academic verdicts autonomously; all flags are evaluated by human examiners.</li>
                <li><strong className="text-slate-200">Accommodations:</strong> Authorized accessibility settings are respected without score penalties.</li>
              </ul>
            </div>

            {/* Webcam Preview Box */}
            <div className="flex flex-col items-center justify-center bg-black/40 border border-slate-800 rounded-2xl p-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-72 h-52 object-cover rounded-xl border border-slate-700 bg-slate-950 mb-3"
              />
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                Live Camera Feed (Processed locally in browser)
              </p>
            </div>

            <button
              onClick={handleStartExamSession}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              Accept Protocol & Enter Fullscreen Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Exam Interface
  return (
    <div className="min-h-screen bg-[#070b12] flex flex-col">
      {/* Active Exam Sticky Top Bar */}
      <div className="sticky top-16 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-500 block uppercase">Exam Session</span>
              <h2 className="text-sm font-bold text-white truncate max-w-[260px] sm:max-w-md">{exam?.title}</h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-4">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{savingStatus}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Server-authoritative timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border ${
                remainingSeconds < 300
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse"
                  : "bg-slate-900 text-cyan-300 border-slate-800"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            <button
              onClick={handleSubmitExam}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20"
            >
              <Send className="h-3.5 w-3.5" />
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Questions Drawer & Video Monitor */}
        <div className="space-y-6 lg:order-1 order-2">
          {/* Question Grid Navigator */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">Questions Progress</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id]?.trim();
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={q.id}
                    onClick={() => handleNavQuestion(idx)}
                    className={`h-9 rounded-lg font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-cyan-500 text-slate-950 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950"
                        : isAnswered
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Answered ({Object.keys(answers).length}/{questions.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-600" /> Pending
              </span>
            </div>
          </div>

          {/* Privacy-Preserving Vision Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400">LOCAL CV MONITOR</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black/40">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-32 object-cover" />
              <div className="absolute bottom-1.5 left-1.5 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400">
                {visionStatus.type === "FACE_MISSING" ? (
                  <span className="text-rose-400">FACE ABSENT</span>
                ) : visionStatus.type === "MULTIPLE_FACES" ? (
                  <span className="text-amber-400">MULTIPLE FACES</span>
                ) : (
                  <span>ACTIVE / TRACKED</span>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Processed entirely client-side. No video frames are transmitted to Aegis servers.
            </p>
          </div>
        </div>

        {/* Right Column: Question Content & Answer Input */}
        <div className="lg:col-span-3 space-y-6 lg:order-2 order-1">
          {currentQ ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
              {/* Question Metadata Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/20">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-xs">
                    {currentQ.question_type.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>Points: {currentQ.points}</span>
                  <span>•</span>
                  <span
                    className={
                      currentQ.difficulty === "HARD"
                        ? "text-rose-400"
                        : currentQ.difficulty === "MEDIUM"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }
                  >
                    {currentQ.difficulty}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed mb-8">
                {currentQ.question_text}
              </div>

              {/* Answer Input Renderers */}
              <div className="space-y-4 mb-8">
                {currentQ.question_type === "MULTIPLE_CHOICE" || currentQ.question_type === "TRUE_FALSE" ? (
                  <div className="space-y-2.5">
                    {currentQ.options?.map((opt) => {
                      const isSelected = answers[currentQ.id] === opt.id;
                      return (
                        <label
                          key={opt.id}
                          onClick={() => handleAnswerChange(opt.id)}
                          className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-cyan-500/10 border-cyan-500 text-white shadow-md shadow-cyan-500/10"
                              : "bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQ.id}`}
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1 h-4 w-4 text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-400 cursor-pointer"
                          />
                          <span className="text-sm leading-relaxed">{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-2">Your Answer:</label>
                    <textarea
                      rows={5}
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-5">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => handleNavQuestion(currentIdx - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold transition-all"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => handleNavQuestion(currentIdx + 1)}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                  >
                    Next Question <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                  >
                    Submit Exam &rarr;
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500">Loading questions...</div>
          )}
        </div>
      </div>
    </div>
  );
}
