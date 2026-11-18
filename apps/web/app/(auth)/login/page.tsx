"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, ShieldCheck, Sparkles } from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("engineer@briefbench.ai");
  const [password, setPassword] = useState("••••••••••••");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-foreground">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center shadow-glow">
            <span className="font-bold text-white text-lg">B</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">BriefBench</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-white">Sign in to your evaluation workspace</h2>
        <p className="text-xs text-muted-foreground">
          Enter credentials or launch the instant demo workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border border-border py-8 px-6 shadow-xl rounded-2xl sm:px-10 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-foreground mb-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-card px-2 text-muted-foreground">or instant access</span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="w-full py-2.5 px-4 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium rounded-lg text-xs flex items-center justify-center space-x-2 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Launch Pre-Seeded Demo Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
