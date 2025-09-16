import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@/generated/prisma";
import { compare } from "bcrypt";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = creds?.email?.toString().toLowerCase();
        const password = creds?.password?.toString() ?? "";
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role } as any as NextAuthUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth(roles?: ("ADMIN"|"TECH"|"CLERK")[]) {
  const session = await getAuthSession();
  if (!session?.user) return { ok: false as const, status: 401, message: "غير مصرح" };
  const role = (session.user as any).role as "ADMIN"|"TECH"|"CLERK" | undefined;
  if (roles && role && !roles.includes(role)) {
    return { ok: false as const, status: 403, message: "صلاحيات غير كافية" };
  }
  return { ok: true as const, session, role };
}

