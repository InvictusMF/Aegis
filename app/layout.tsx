import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Aegis — Secure Exams. Trusted Results.",
  description:
    "Aegis is an AI + Machine Learning powered examination integrity platform that correlates behavioral, browser-security, question-level, and privacy-preserving computer-vision signals into explainable suspicious episodes for human examiner review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070b12] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-900 bg-[#06090f] py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-mono font-bold text-slate-400">AEGIS</span> — Examination Integrity Intelligence & Human Review
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <span>Privacy-First Computer Vision</span>
              <span>•</span>
              <span>Explainable ML Risk</span>
              <span>•</span>
              <span>Gemini Structured Assistant</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
