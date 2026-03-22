import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LayoutDashboard, Users, Shield, Activity } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  if (!user || user.role !== "admin") redirect("/game");

  const t = await getTranslations("admin");

  const NAV = [
    { href: "/admin",          label: t("overview"),  icon: LayoutDashboard },
    { href: "/admin/users",    label: t("users"),     icon: Users           },
    { href: "/admin/activity", label: t("activity"),  icon: Activity        },
    { href: "/admin/security", label: t("security"),  icon: Shield          },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Admin top bar */}
      <div
        className="sticky top-14 z-40 border-b border-[var(--glass-border)]"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)" }}
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-4 px-4">
          {/* Brand */}
          <Link href="/admin" className="flex items-center gap-2 shrink-0 mr-2">
            <Image
              src="/images/midnight-riches-logo.png"
              alt=""
              width={22}
              height={22}
              className="object-contain opacity-80"
            />
            <span
              className="text-[11px] font-black uppercase tracking-[0.25em]"
              style={{
                background: "linear-gradient(90deg, #fbbf24, #f472b6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("adminLabel")}
            </span>
          </Link>

          {/* Nav tabs */}
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] whitespace-nowrap transition-all hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
              {t("adminMode")}
            </span>
            <Link
              href="/game"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              ← {t("backToGame")}
            </Link>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </div>
    </div>
  );
}
