"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import type { Session } from "next-auth";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      {children}
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "omega-card border-border",
            title: "text-text-primary",
            description: "text-text-secondary",
          },
        }}
      />
    </SessionProvider>
  );
}
