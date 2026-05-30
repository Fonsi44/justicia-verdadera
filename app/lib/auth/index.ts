import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
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

    const [firm] = await db
      .insert(firms)
      .values({
        name: firmName,
        slug: uniqueSlug(baseSlug),
        contactEmail: email,
      })
      .returning();

    const [newUser] = await db
      .insert(users)
      .values({
        firmId: firm.id as string,
        name: name || email.split("@")[0],
        email,
        image,
        role: "owner" as const,
      })
      .returning();

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
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
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
    async jwt({ token, user, trigger }) {
      if (trigger === "signIn" && user?.email) {
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
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
