"use client";

import { authenticate } from "@/lib/actions/auth";
import { useActionState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Sparkles, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Study Companion</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center">Your intelligent workspace for accelerated learning</p>
        </div>

        <Card className="border-slate-200/60 shadow-2xl shadow-blue-900/5 dark:border-slate-800 dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account or create a new one to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={dispatch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  className="bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-white dark:bg-slate-950 font-mono tracking-widest text-lg py-5"
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-6 rounded-xl py-6 shadow-md hover:shadow-lg transition-all"
                aria-disabled={isPending}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Log in / Register
                  </>
                )}
              </Button>

              <div
                className="flex h-8 items-center justify-center space-x-1"
                aria-live="polite"
                aria-atomic="true"
              >
                {errorMessage && (
                  <p className="text-sm font-medium text-destructive bg-destructive/10 px-3 py-1 rounded-md">{errorMessage}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-slate-500 mt-8">
          Prototype build • AI Study Companion
        </p>
      </div>
    </main>
  );
}
