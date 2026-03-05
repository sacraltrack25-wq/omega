"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Network, Dumbbell, BarChart2,
  Database, ArrowLeft, Zap, BookOpen, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin",            label: "Overview",   icon: LayoutDashboard },
  { href: "/admin/chat",       label: "Chat Test",  icon: MessageSquare },
  { href: "/admin/neurons",    label: "Neurons",    icon: Network },
  { href: "/admin/training",   label: "Training",   icon: Dumbbell },
  { href: "/admin/stats",      label: "Statistics", icon: BarChart2 },
  { href: "/admin/harvesters", label: "Harvesters", icon: Database },
  { href: "/admin/guide",      label: "Guide",      icon: BookOpen },
];

export function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-bg-secondary flex flex-col h-screen sticky top-0" suppressHydrationWarning>
      <div className="h-14 flex items-center px-4 border-b border-border gap-2" suppressHydrationWarning>
        <Zap className="w-4 h-4 text-accent" />
        <span className="font-semibold text-sm">Admin Panel</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn("nav-link", path === href && "active")}>
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-3" suppressHydrationWarning>
        <Link href="/dashboard/chat" className="nav-link">
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>
      </div>
    </aside>
  );
}
