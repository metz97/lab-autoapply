import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { AutoApplyLoginClient } from "@/components/autoapply/autoapply-login-client";
import { FadeIn } from "@/components/fade-in";
import { Button } from "@/components/ui/button";
import { pageTitle } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageTitle("AutoApply · Sign in"),
  description: "Sign in to the AutoApply dashboard and manage extension API tokens.",
};

export default function AutoApplyLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:py-16">
      <FadeIn>
        <Button asChild variant="ghost" className="mb-6 gap-2 px-0 text-primary">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            AutoApply
          </Link>
        </Button>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <AutoApplyLoginClient />
        </Suspense>
      </FadeIn>
    </div>
  );
}
