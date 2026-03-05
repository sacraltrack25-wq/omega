"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare, Image, Video, Music, Gamepad2,
  Settings, LogOut, User
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard/chat",   label: "Text",   icon: MessageSquare },
  { href: "/dashboard/images", label: "Images", icon: Image },
  { href: "/dashboard/video",  label: "Video",  icon: Video },
  { href: "/dashboard/audio",  label: "Audio",  icon: Music },
  { href: "/dashboard/games",  label: "Games",  icon: Gamepad2 },
];

interface SidebarUser {
  name?:  string | null;
  email?: string | null;
  image?: string | null;
  role?:  string;
}

export function Sidebar({ user }: { user: SidebarUser | null }) {
  const path = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-bg-secondary flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <span className="text-accent font-bold text-lg mr-2">Ω</span>
        <span className="font-semibold text-sm">OMEGA AI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn("nav-link", path === href && "active")}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3 space-y-0.5">
        {user?.role === "admin" && (
          <Link href="/admin" className={cn("nav-link", path.startsWith("/admin") && "active")}>
            <Settings className="w-4 h-4" />
            Admin
          </Link>
        )}
        <div className="flex items-center gap-2 px-3 py-2">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-bg-elevated flex items-center justify-center">
              <User className="w-3 h-3 text-text-muted" />
            </div>
          )}
          <span className="text-text-secondary text-xs truncate flex-1">
            {user?.name ?? user?.email ?? "User"}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-link w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
