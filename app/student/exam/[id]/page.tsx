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
  Check,
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
        const examRes = await fetch(`/api/exams/${examId}`);
        const examData = await examRes.json();
        if (examData.exam) {
          setExam(examData.exam);
          setQuestions(examData.exam.questions || []);
        }

        const attRes = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exam_id: examId }),
        });
        const attData = await attRes.json();
        if (attData.attempt) {
          setAttempt(attData.attempt);

          if (attData.attempt.answers) {
            const initialAnswers: Record<string, string> = {};
            attData.attempt.answers.forEach((ans: AttemptAnswer) => {
              initialAnswers[ans.question_id] = ans.answer_value;
            });
            setAnswers(initialAnswers);
          }

          if (attData.attempt.remaining_seconds !== undefined) {
            setRemainingSeconds(attData.attempt.remaining_seconds);
          } else if (examData.exam) {
            setRemainingSeconds(examData.exam.duration_minutes * 60);
          }
        }
      } catch (err) {
        console.error("Initialization error", err);
      }
    }

    loadData();
  }, [examId]);

  // 3. Server-Authoritative Exam Countdown Timer
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

        if (signal.type !== "FACE_DETECTED") {
          sendSecurityEvent(
            signal.type,
            signal.type === "MULTIPLE_FACES" ? "HIGH" : "MEDIUM",
            "COMPUTER_VISION",
            0,
            signal.metadata
          );
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

  // Pre-Exam Permission & Privacy Screen (Calm, Reassuring)
  if (!hasStartedSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-md space-y-6">
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
            <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold shadow-xs">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{exam?.title || "Examination Setup"}</h1>
              <p className="text-xs text-slate-500 font-medium">
                Privacy-Preserving On-Device Verification Protocol
              </p>
            </div>
          </div>

          <div className="space-y-5 text-xs text-slate-600 leading-relaxed">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm font-sans">
                <Lock className="h-4 w-4 text-blue-600" />
                Student Privacy Commitment
              </h3>
              <ul className="space-y-2 list-disc list-inside text-slate-600">
                <li>
                  <strong className="text-slate-800">On-Device Processing:</strong> Webcam vision executes entirely inside your browser via MediaPipe. No video recording is ever uploaded or stored.
                </li>
                <li>
                  <strong className="text-slate-800">Sandbox Environment:</strong> Window blur, tab changes, and fullscreen transitions are recorded to preserve exam integrity.
                </li>
                <li>
                  <strong className="text-slate-800">Human Examiner Primacy:</strong> Automated algorithms never determine academic violations autonomously; all reviews are conducted by authorized examiners.
                </li>
              </ul>
            </div>

            {/* Webcam Preview */}
            <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-72 h-52 object-cover rounded-xl border border-slate-200 bg-black/5 mb-3"
              />
              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Eye className="h-3.5 w-3.5 text-blue-600" />
                Live Camera Check (Processed locally in browser memory)
              </p>
            </div>

            <button
              onClick={handleStartExamSession}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              Accept Protocol & Begin Examination
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Exam Interface (Distraction-Free Light Environment)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Active Exam Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                Active Assessment
              </span>
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-[240px] sm:max-w-md">
                {exam?.title}
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-4 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>{savingStatus}</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Server-authoritative timer */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
                remainingSeconds < 300
                  ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                  : "bg-slate-50 text-slate-800 border-slate-200"
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            <button
              onClick={handleSubmitExam}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs"
            >
              <Send className="h-3 w-3" />
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Questions Navigator & Local Camera Preview */}
        <div className="space-y-6 lg:order-1 order-2">
          {/* Question Grid Navigator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
              Questions Navigation
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id]?.trim();
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={q.id}
                    onClick={() => handleNavQuestion(idx)}
                    className={`h-9 rounded-xl font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-blue-600 text-white ring-2 ring-blue-500/30 shadow-xs"
                        : isAnswered
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-600" /> Answered (
                {Object.keys(answers).length}/{questions.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-300" /> Pending
              </span>
            </div>
          </div>

          {/* Local Privacy Camera Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-slate-600 uppercase">Local Vision Check</span>
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            </div>
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-32 object-cover" />
              <div className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-slate-800 font-bold border border-slate-200 shadow-2xs">
                {visionStatus.type === "FACE_MISSING" ? (
                  <span className="text-rose-700">FACE ABSENT</span>
                ) : visionStatus.type === "MULTIPLE_FACES" ? (
                  <span className="text-amber-800">MULTIPLE FACES</span>
                ) : (
                  <span className="text-emerald-700">PROCTORING ACTIVE</span>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-tight">
              Processed entirely client-side. No video frames are transmitted to Aegis servers.
            </p>
          </div>
        </div>

        {/* Right Column: Question Content & Options */}
        <div className="lg:col-span-3 space-y-6 lg:order-2 order-1">
          {currentQ ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              {/* Question Metadata Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-xs">
                    {currentQ.question_type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span>Points: {currentQ.points}</span>
                  <span>•</span>
                  <span
                    className={
                      currentQ.difficulty === "HARD"
                        ? "text-rose-700 font-bold"
                        : currentQ.difficulty === "MEDIUM"
                        ? "text-amber-800 font-bold"
                        : "text-emerald-700 font-bold"
                    }
                  >
                    {currentQ.difficulty}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg text-slate-900 font-medium leading-relaxed mb-8">
                {currentQ.question_text}
              </div>

              {/* Answer Input Choices */}
              <div className="space-y-3 mb-8">
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
                              ? "bg-blue-50/80 border-blue-500 text-blue-950 shadow-xs ring-1 ring-blue-500/20"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQ.id}`}
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1 h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm leading-relaxed font-medium">{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-2 uppercase font-bold">
                      Your Response:
                    </label>
                    <textarea
                      rows={5}
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed font-mono transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => handleNavQuestion(currentIdx - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition-all"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => handleNavQuestion(currentIdx + 1)}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Next Question <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Submit Exam &rarr;
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">Loading exam questions...</div>
          )}
        </div>
      </div>
    </div>
  );
}
