import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AutoApplyDashboardClient } from "@/components/autoapply/autoapply-dashboard-client";
import { AutoApplyNav } from "@/components/autoapply/autoapply-nav";
import { FadeIn } from "@/components/fade-in";
import { Button } from "@/components/ui/button";
import { pageTitle } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageTitle("AutoApply · Dashboard"),
  description: "Track LinkedIn EasyApply attempts synced from the AutoApply Chrome extension.",
};

export default function AutoApplyDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <FadeIn>
        <Button asChild variant="ghost" className="mb-6 gap-2 px-0 text-primary">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            AutoApply
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <AutoApplyNav />
        <AutoApplyDashboardClient />
      </FadeIn>
    </div>
  );
}
