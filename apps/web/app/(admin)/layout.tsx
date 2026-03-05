import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const bypass = process.env.ADMIN_BYPASS === "true";

  if (!bypass) {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const user = session.user as typeof session.user & { role?: string };
    if (user.role !== "admin") redirect("/dashboard/chat");
  }

  return (
    <div className="flex min-h-screen bg-bg-primary" suppressHydrationWarning>
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto" suppressHydrationWarning>
        {bypass && (
          <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 text-xs text-warning font-mono" suppressHydrationWarning>
            ⚠ ADMIN_BYPASS=true — auth is disabled. Set ADMIN_BYPASS=false before deploying to production.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
