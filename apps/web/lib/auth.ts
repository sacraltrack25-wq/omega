import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

// Supabase admin client for profile sync (server-only)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // JWT strategy — no DB required for sessions
  session: { strategy: "jwt" },

  callbacks: {
    // Attach user id and role to the JWT token
    async jwt({ token, user, account }) {
      if (user && account) {
        token.sub = user.id ?? token.sub;
        token.email = user.email ?? token.email;
        token.name  = user.name  ?? token.name;
        token.picture = user.image ?? token.picture;

        // Sync / create profile in Supabase on first login
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const supabase = getSupabaseAdmin();
            const { data: existing } = await supabase
              .from("profiles")
              .select("role, current_plan, plan_expires")
              .eq("email", user.email!)
              .single();

            if (!existing) {
              await supabase.from("profiles").insert({
                id:           token.sub,
                email:        user.email,
                full_name:    user.name,
                avatar_url:   user.image,
                role:         "user",
                current_plan: "free",
              });
              // Create free subscription
              const { data: freePlan } = await supabase
                .from("plans")
                .select("id")
                .eq("name", "free")
                .single();
              if (freePlan) {
                await supabase.from("subscriptions").insert({
                  user_id:  token.sub,
                  plan_id:  freePlan.id,
                  status:   "active",
                });
              }
              token.role = "user";
              token.plan = "free";
            } else {
              token.role = existing.role;
              token.plan = existing.current_plan ?? "free";
              token.planExpires = existing.plan_expires ?? null;
            }
          } catch {
            token.role = "user";
          }
        }
      }
      return token;
    },

    // Expose id, role and plan on the session object
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as typeof session.user & {
          id: string; role: string; plan: string; planExpires: string | null;
        };
        u.id          = token.sub as string;
        u.role        = (token.role        as string) ?? "user";
        u.plan        = (token.plan        as string) ?? "free";
        u.planExpires = (token.planExpires as string) ?? null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },
};
