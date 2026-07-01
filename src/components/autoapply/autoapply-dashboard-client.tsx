"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";

import { autoapplyFetch, autoapplyInputClass } from "@/components/autoapply/autoapply-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/autoapply/schemas";
import { cn } from "@/lib/utils";

type Application = {
  id: string;
  source: string;
  externalJobId: string | null;
  jobTitle: string;
  company: string;
  location: string | null;
  jobUrl: string | null;
  status: ApplicationStatus;
  errorMessage: string | null;
  appliedAt: string | null;
  createdAt: string;
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  queued: "Queued",
  applied: "Applied",
  failed: "Failed",
  needs_review: "Needs review",
  skipped: "Skipped",
};

const statusVariant = (
  status: ApplicationStatus,
): "default" | "secondary" | "outline" | "muted" => {
  switch (status) {
    case "applied":
      return "default";
    case "failed":
      return "muted";
    case "needs_review":
      return "secondary";
    default:
      return "outline";
  }
};

export function AutoApplyDashboardClient() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (statusFilter) params.set("status", statusFilter);
    if (q.trim()) params.set("q", q.trim());

    (async () => {
      try {
        const res = await autoapplyFetch(
          `/api/applications?${params.toString()}`,
        );
        const json = (await res.json()) as {
          ok: boolean;
          applications?: Application[];
          total?: number;
          hasMore?: boolean;
          error?: string;
        };
        if (cancelled) return;
        if (!json.ok) {
          setError(json.error ?? "Failed to load applications");
          setApplications([]);
          return;
        }
        setApplications(json.applications ?? []);
        setTotal(json.total ?? 0);
        setHasMore(json.hasMore ?? false);
        setError(null);
      } catch {
        if (!cancelled) setError("Network error loading applications");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, q, reloadKey]);

  function reload() {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Synced from the Chrome extension when you apply (or skip) on LinkedIn EasyApply.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium">
              Search company or title
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  className={cn(autoapplyInputClass, "pl-9")}
                  placeholder="e.g. Acme Corp"
                />
              </div>
            </label>
            <label className="text-sm font-medium sm:w-48">
              Status
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={autoapplyInputClass + " mt-1"}
              >
                <option value="">All</option>
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" variant="secondary" onClick={reload}>
              Refresh
            </Button>
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-sm font-medium text-foreground">No applications yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Install the extension, paste your API token from Settings, and apply on LinkedIn.
                Results appear here automatically.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {total} total · page {page}
              </p>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {applications.map((app) => (
                  <li key={app.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{app.jobTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {app.company}
                        {app.location ? ` · ${app.location}` : ""}
                      </p>
                      {app.errorMessage ? (
                        <p className="mt-1 text-xs text-destructive">{app.errorMessage}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(app.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={statusVariant(app.status)}>
                        {STATUS_LABELS[app.status]}
                      </Badge>
                      {app.jobUrl ? (
                        <Button asChild variant="ghost" size="sm">
                          <a href={app.jobUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
