import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Chrome, LayoutDashboard, LogIn } from "lucide-react";

import { FadeIn } from "@/components/fade-in";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionUser } from "@/lib/autoapply/auth";
import { pageTitle } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageTitle("AutoApply"),
  description:
    "LinkedIn EasyApply assist via a Chrome extension, a Supabase-auth dashboard, and a REST API for application tracking.",
};

const PORTFOLIO_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "#";

export default async function AutoApplyLandingPage() {
  const user = await getSessionUser().catch(() => null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <FadeIn>
        <Button asChild variant="ghost" className="mb-6 gap-2 px-0 text-primary">
          <Link href={PORTFOLIO_URL}>
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </Link>
        </Button>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Lab · AutoApply
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          AutoApply
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-base text-muted-foreground">
          Apply faster on LinkedIn EasyApply while staying in control. The Chrome extension
          pre-fills forms using your saved profile in your own logged-in session — you click
          Submit on LinkedIn. Every attempt syncs to your dashboard here.
        </p>
      </FadeIn>

      <FadeIn className="mt-10 grid gap-6 sm:grid-cols-2" delay={0.06}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Chrome className="h-5 w-5 text-primary" />
              Chrome extension
            </CardTitle>
            <CardDescription>
              Separate repo. Uses your LinkedIn login — no server-side scraping.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See the{" "}
              <code className="rounded bg-muted px-1 text-xs">
                Extension REST API contract
              </code>{" "}
              section of the README for how the extension talks to this backend.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Dashboard
            </CardTitle>
            <CardDescription>
              Track applied, failed, queued, and skipped jobs. Manage profile and API tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <Button asChild className="gap-2">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              </Button>
            )}
            {user ? (
              <Button asChild variant="outline">
                <Link href="/settings">Settings</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn className="mt-8 rounded-lg border border-border/80 bg-card/40 p-6 text-sm text-muted-foreground" delay={0.1}>
        <p className="font-medium text-foreground">How it works</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Sign in and complete your profile (resume, screening answers).</li>
          <li>Issue an API token and paste it into the extension.</li>
          <li>Browse LinkedIn jobs; the extension fills EasyApply — you submit manually.</li>
          <li>Status updates appear on the dashboard automatically.</li>
        </ol>
      </FadeIn>
    </div>
  );
}
