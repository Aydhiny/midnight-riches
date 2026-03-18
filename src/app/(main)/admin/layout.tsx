import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user || user.role !== "admin") {
    redirect("/game");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <div className="flex items-center gap-4 border-b border-purple-800/30 pb-4">
        <h1 className="text-2xl font-bold text-yellow-400">Admin Dashboard</h1>
        <nav className="flex gap-2">
          <Link
            href="/admin"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-purple-300 hover:bg-purple-900/30 hover:text-white"
          >
            Overview
          </Link>
          <Link
            href="/admin/users"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-purple-300 hover:bg-purple-900/30 hover:text-white"
          >
            Users
          </Link>
          <Link
            href="/admin/security"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-purple-300 hover:bg-purple-900/30 hover:text-white"
          >
            Security
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
