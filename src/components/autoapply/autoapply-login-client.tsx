"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

import { autoapplyInputClass } from "@/components/autoapply/autoapply-shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseAuthConfigured } from "@/lib/autoapply/config";
import { createSupabaseBrowserClient } from "@/lib/autoapply/supabase-browser";

export function AutoApplyLoginClient() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    errorParam === "auth_not_configured"
      ? "Supabase Auth is not configured on this deployment."
      : errorParam === "auth_callback_failed"
        ? "Sign-in failed. Try again."
        : null,
  );

  if (!isSupabaseAuthConfigured()) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        Supabase Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
        NEXT_PUBLIC_SUPABASE_ANON_KEY.
      </p>
    );
  }

  const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}${next}`;

  async function signInWithGoogle() {
    setLoading("google");
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (authError) setError(authError.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
      setLoading(null);
    }
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (authError) {
        setError(authError.message);
      } else {
        setMessage("Check your email for the magic link to sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email sign-in failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to AutoApply</CardTitle>
        <CardDescription>
          Use the same account for the dashboard and Chrome extension API tokens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
            {message}
          </p>
        ) : null}

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled={loading !== null}
          onClick={() => void signInWithGoogle()}
        >
          {loading === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Continue with Google
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <span className="relative mx-auto block w-fit bg-card px-2 text-xs text-muted-foreground">
            or email magic link
          </span>
        </div>

        <form onSubmit={(e) => void signInWithEmail(e)} className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className={autoapplyInputClass + " mt-1"}
              placeholder="you@example.com"
            />
          </label>
          <Button type="submit" className="w-full gap-2" disabled={loading !== null}>
            {loading === "email" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Send magic link
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
