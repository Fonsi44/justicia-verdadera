import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, firms } from "@/database/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firmId: string;
      role: string;
      barNumber?: string | null;
      specialty?: string | null;
    } & DefaultSession["user"];
    calendarAccess?: {
      accessToken?: string;
      refreshToken?: string;
      provider?: string;
      expiresAt?: number;
    };
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

function uniqueSlug(base: string): string {
  const suffix = crypto.randomUUID().slice(0, 4);
  return `${slugify(base)}-${suffix}`;
}

async function tryGetDbUser(email: string) {
  try {
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return dbUser ?? null;
  } catch {
    return null;
  }
}

async function tryCreateFirmAndUser(
  name: string,
  email: string,
  image: string | null,
) {
  try {
    const firmName = name || email.split("@")[0];
    const baseSlug = slugify(firmName);

    const slug = uniqueSlug(baseSlug);

    const [newUser] = await db.transaction(async (tx) => {
      const { id: firmId } = (
        await tx
          .insert(firms)
          .values({
            name: firmName,
            slug,
            contactEmail: email,
          })
          .returning({ id: firms.id })
      )[0];

      const [user] = await tx
        .insert(users)
        .values({
          firmId,
          name: name || email.split("@")[0],
          email,
          image,
          role: "owner" as const,
        })
        .returning();

      return [user];
    });

    return newUser;
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      authorization: {
        params: {
          scope: "openid email profile offline_access Calendars.ReadWrite Mail.Read",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!dbUser) return null;

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    signIn({ user }) {
      return !!user.email;
    },
    async jwt({ token, user, trigger, account }) {
      if (trigger === "signIn" || trigger === "signUp") {
        if (account) {
          (token as Record<string, unknown>).accessToken = account.access_token;
          (token as Record<string, unknown>).refreshToken = account.refresh_token;
          (token as Record<string, unknown>).provider = account.provider;
          (token as Record<string, unknown>).expiresAt = account.expires_at;
        }

        if (user?.email) {
          const dbUser = await tryGetDbUser(user.email);

          if (dbUser) {
            token.firmId = dbUser.firmId as string;
            token.role = dbUser.role as string;
            token.barNumber = dbUser.barNumber;
            token.specialty = dbUser.specialty;
          } else {
            const newUser = await tryCreateFirmAndUser(
              user.name ?? "",
              user.email,
              user.image ?? null,
            );

            if (newUser) {
              token.firmId = newUser.firmId as string;
              token.role = newUser.role as string;
              token.barNumber = newUser.barNumber;
              token.specialty = newUser.specialty;
            }
          }
        }
      }

      if (trigger === "update" && token.email) {
        const dbUser = await tryGetDbUser(token.email);

        if (dbUser) {
          token.firmId = dbUser.firmId as string;
          token.role = dbUser.role as string;
          token.barNumber = dbUser.barNumber;
          token.specialty = dbUser.specialty;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.firmId = (token.firmId as string) ?? "";
        session.user.role = (token.role as string) ?? "lawyer";
        session.user.barNumber = (token.barNumber as string | null) ?? null;
        session.user.specialty = (token.specialty as string | null) ?? null;
      }
      session.calendarAccess = {
        accessToken: (token as Record<string, unknown>).accessToken as string | undefined,
        refreshToken: (token as Record<string, unknown>).refreshToken as string | undefined,
        provider: (token as Record<string, unknown>).provider as string | undefined,
        expiresAt: (token as Record<string, unknown>).expiresAt as number | undefined,
      };
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
