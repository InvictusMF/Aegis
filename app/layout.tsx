import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

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
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-blue-100 selection:text-blue-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
