import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "BriefBench — AI Agent Benchmarking & Evidence-First Research Platform",
  description:
    "Benchmark the Agent. Trust the Brief. An evidence-first platform comparing AI agents on identical tasks and frozen SHA-256 evidence snapshots using Bifrost LLM Gateway and Tavily.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans bg-background text-foreground antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
