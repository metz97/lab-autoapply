"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Settings } from "lucide-react";

import { autoapplyFetch } from "@/components/autoapply/autoapply-shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/autoapply/supabase-browser";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AutoApplyNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      await autoapplyFetch("/api/profile", { method: "GET" }).catch(
        () => undefined,
      );
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 border-b border-border/80 pb-4">
      {links.map(({ href, label, icon: Icon }) => (
        <Button
          key={href}
          asChild
          variant={pathname.startsWith(href) ? "default" : "ghost"}
          size="sm"
          className={cn("gap-2")}
        >
          <Link href={href}>
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        </Button>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto gap-2 text-muted-foreground"
        onClick={() => void signOut()}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </nav>
  );
}
