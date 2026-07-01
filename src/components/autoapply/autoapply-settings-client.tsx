"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";

import { autoapplyFetch, autoapplyInputClass } from "@/components/autoapply/autoapply-shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Profile = {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  currentTitle: string | null;
  yearsExperience: number | null;
  resumeUrl: string | null;
  defaultAnswers: Record<string, string>;
};

type TokenItem = {
  id: string;
  name: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  active: boolean;
};

type Tab = "profile" | "tokens";

export function AutoApplySettingsClient() {
  const [tab, setTab] = useState<Tab>("profile");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [defaultAnswersJson, setDefaultAnswersJson] = useState("{}");

  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [newTokenName, setNewTokenName] = useState("Chrome extension");
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [tokenBusy, setTokenBusy] = useState(false);

  async function loadTokens() {
    setTokensLoading(true);
    try {
      const res = await autoapplyFetch("/api/tokens");
      const json = (await res.json()) as { ok: boolean; tokens?: TokenItem[] };
      if (json.ok) setTokens(json.tokens ?? []);
    } finally {
      setTokensLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await autoapplyFetch("/api/profile");
        const json = (await res.json()) as {
          ok: boolean;
          profile?: Profile | null;
        };
        if (cancelled) return;
        if (json.ok && json.profile) {
          setProfile(json.profile);
          setDefaultAnswersJson(
            JSON.stringify(json.profile.defaultAnswers ?? {}, null, 2),
          );
        } else {
          setProfile({
            fullName: null,
            email: null,
            phone: null,
            location: null,
            linkedinUrl: null,
            currentTitle: null,
            yearsExperience: null,
            resumeUrl: null,
            defaultAnswers: {},
          });
          setDefaultAnswersJson("{}");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tab !== "tokens") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await autoapplyFetch("/api/tokens");
        const json = (await res.json()) as { ok: boolean; tokens?: TokenItem[] };
        if (!cancelled && json.ok) setTokens(json.tokens ?? []);
      } finally {
        if (!cancelled) setTokensLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileMessage(null);

    let defaultAnswers: Record<string, string> = {};
    try {
      const parsed = JSON.parse(defaultAnswersJson) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        defaultAnswers = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [
            k,
            String(v),
          ]),
        );
      } else {
        throw new Error("defaultAnswers must be a JSON object");
      }
    } catch {
      setProfileError("Default answers must be valid JSON object (key → answer).");
      setProfileSaving(false);
      return;
    }

    try {
      const res = await autoapplyFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          linkedinUrl: profile.linkedinUrl,
          currentTitle: profile.currentTitle,
          yearsExperience: profile.yearsExperience,
          resumeUrl: profile.resumeUrl,
          defaultAnswers,
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; profile?: Profile };
      if (!json.ok) {
        setProfileError(json.error ?? "Save failed");
        return;
      }
      if (json.profile) setProfile(json.profile);
      setProfileMessage("Profile saved.");
    } catch {
      setProfileError("Network error saving profile");
    } finally {
      setProfileSaving(false);
    }
  }

  async function issueToken() {
    setTokenBusy(true);
    setIssuedToken(null);
    try {
      const res = await autoapplyFetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTokenName.trim() || "Extension" }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        token?: string;
        error?: string;
      };
      if (!json.ok) {
        setProfileError(json.error ?? "Failed to issue token");
        return;
      }
      setIssuedToken(json.token ?? null);
      void loadTokens();
    } finally {
      setTokenBusy(false);
    }
  }

  async function revokeToken(id: string) {
    setTokenBusy(true);
    try {
      await autoapplyFetch(`/api/tokens?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      void loadTokens();
    } finally {
      setTokenBusy(false);
    }
  }

  function updateProfile<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  if (profileLoading && tab === "profile") {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          type="button"
          variant={tab === "profile" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("profile")}
        >
          Profile
        </Button>
        <Button
          type="button"
          variant={tab === "tokens" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("tokens")}
        >
          API tokens
        </Button>
      </div>

      {tab === "profile" && profile ? (
        <Card>
          <CardHeader>
            <CardTitle>Application profile</CardTitle>
            <CardDescription>
              Used by the extension to pre-fill LinkedIn EasyApply. You still submit each
              application yourself.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void saveProfile(e)} className="space-y-4">
              {profileError ? (
                <p className="text-sm text-destructive">{profileError}</p>
              ) : null}
              {profileMessage ? (
                <p className="text-sm text-primary">{profileMessage}</p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["fullName", "Full name", "text"],
                    ["email", "Email", "email"],
                    ["phone", "Phone", "tel"],
                    ["location", "Location", "text"],
                    ["linkedinUrl", "LinkedIn profile URL", "url"],
                    ["currentTitle", "Current title", "text"],
                  ] as const
                ).map(([key, label, type]) => (
                  <label key={key} className="text-sm font-medium">
                    {label}
                    <input
                      type={type}
                      value={profile[key] ?? ""}
                      onChange={(e) =>
                        updateProfile(key, e.target.value || null)
                      }
                      className={autoapplyInputClass + " mt-1"}
                    />
                  </label>
                ))}
                <label className="text-sm font-medium">
                  Years of experience
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={profile.yearsExperience ?? ""}
                    onChange={(e) =>
                      updateProfile(
                        "yearsExperience",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    className={autoapplyInputClass + " mt-1"}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium">
                Resume URL (PDF)
                <input
                  type="url"
                  value={profile.resumeUrl ?? ""}
                  onChange={(e) => updateProfile("resumeUrl", e.target.value || null)}
                  className={autoapplyInputClass + " mt-1"}
                  placeholder="https://…/resume.pdf"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Paste a public link to your resume (e.g. a Supabase Storage or
                  Google Drive URL).
                </span>
              </label>

              <label className="block text-sm font-medium">
                Default screening answers (JSON)
                <textarea
                  value={defaultAnswersJson}
                  onChange={(e) => setDefaultAnswersJson(e.target.value)}
                  rows={8}
                  className={cn(autoapplyInputClass, "mt-1 font-mono text-xs")}
                  placeholder='{"work_authorization": "Yes", "years_react": "5"}'
                />
              </label>

              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {tab === "tokens" ? (
        <Card>
          <CardHeader>
            <CardTitle>Extension API tokens</CardTitle>
            <CardDescription>
              Paste a token into the Chrome extension. Revoke anytime. Tokens are shown only
              once when created.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {issuedToken ? (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                <p className="text-sm font-medium text-foreground">Copy your token now</p>
                <code className="mt-2 block break-all text-xs">{issuedToken}</code>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 gap-2"
                  onClick={() => void navigator.clipboard.writeText(issuedToken)}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-medium">
                Token name
                <input
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  className={autoapplyInputClass + " mt-1"}
                />
              </label>
              <Button
                type="button"
                className="gap-2"
                disabled={tokenBusy}
                onClick={() => void issueToken()}
              >
                <Plus className="h-4 w-4" />
                Issue token
              </Button>
            </div>

            {tokensLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tokens yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {tokens.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(t.createdAt).toLocaleDateString()}
                        {t.lastUsedAt
                          ? ` · Last used ${new Date(t.lastUsedAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={t.active ? "default" : "secondary"}>
                        {t.active ? "Active" : "Revoked"}
                      </Badge>
                      {t.active ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={tokenBusy}
                          onClick={() => void revokeToken(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
