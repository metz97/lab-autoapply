import { cn } from "@/lib/utils";

export const autoapplyInputClass = cn(
  "flex w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm",
  "text-foreground shadow-sm outline-none transition-colors",
  "placeholder:text-muted-foreground",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export const autoapplyFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, { ...init, credentials: "include" });

export type ApiErr = { ok: false; error: string; code?: string };
