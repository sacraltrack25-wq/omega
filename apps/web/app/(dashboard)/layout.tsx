import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  const user = session.user as typeof session.user & { role?: string };

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar user={{ ...user, role: user.role }} />
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
