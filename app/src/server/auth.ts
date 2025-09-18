import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@/generated/prisma";
import { compare } from "bcrypt";
import { getServerSession } from "next-auth";
import { getRedis } from "./redis";

type AttemptState = { attempts: number; lockedUntil?: number };

const MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS ?? 5);
const LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES ?? 15);
const LOCK_TTL_SECONDS = Math.max(LOCK_MINUTES, 1) * 60;
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;
const REMEMBER_MAX_AGE_SECONDS = Number(process.env.LOGIN_REMEMBER_MAX_AGE_SECONDS ?? 30 * 24 * 60 * 60);
const DEFAULT_MAX_AGE_SECONDS = Number(process.env.LOGIN_DEFAULT_MAX_AGE_SECONDS ?? 24 * 60 * 60);

const prisma = new PrismaClient();

function getHeader(req: unknown, key: string) {
  try {
    const headers = (req as any)?.headers;
    if (headers?.get) return headers.get(key) as string | null;
    if (typeof headers === "object" && headers) {
      const value = headers[key] ?? headers[key.toLowerCase()];
      return Array.isArray(value) ? value[0] : value ?? null;
    }
  } catch {}
  return null;
}

function extractIdentifiers(email: string | undefined, req: unknown) {
  const identifiers: string[] = [];
  const xfwd = getHeader(req, "x-forwarded-for");
  const xReal = getHeader(req, "x-real-ip");
  const ipCandidate = xfwd?.split(",").map((part: string) => part.trim()).filter(Boolean)[0] || xReal || undefined;
  if (email) identifiers.push(`email:${email}`);
  if (ipCandidate) identifiers.push(`ip:${ipCandidate}`);
  return { identifiers, ip: ipCandidate };
}

async function readState(redis: any, identifier: string): Promise<AttemptState> {
  const key = `auth:attempts:${identifier}`;
  const raw = await redis.get(key);
  if (!raw) return { attempts: 0 };
  try {
    const parsed = JSON.parse(raw) as AttemptState;
    return { attempts: Number(parsed.attempts || 0), lockedUntil: parsed.lockedUntil ?? undefined };
  } catch {
    return { attempts: 0 };
  }
}

async function saveState(redis: any, identifier: string, state: AttemptState) {
  const key = `auth:attempts:${identifier}`;
  await redis.set(key, JSON.stringify(state), "EX", LOCK_TTL_SECONDS);
}

async function clearState(redis: any, identifiers: string[]) {
  if (!identifiers.length) return;
  await redis.del(...identifiers.map((id) => `auth:attempts:${id}`));
}

async function checkLocked(redis: any, identifiers: string[]) {
  const now = Date.now();
  for (const id of identifiers) {
    const { lockedUntil } = await readState(redis, id);
    if (lockedUntil && lockedUntil > now) {
      return { locked: true as const, until: lockedUntil };
    }
  }
  return { locked: false as const };
}

async function recordFailure(redis: any, identifiers: string[]) {
  if (!identifiers.length || MAX_ATTEMPTS <= 0) return { locked: false as const };
  const now = Date.now();
  let lockedInfo: { locked: true; until: number } | null = null;
  for (const id of identifiers) {
    const state = await readState(redis, id);
    const nextAttempts = (state.attempts || 0) + 1;
    if (nextAttempts >= MAX_ATTEMPTS) {
      const until = now + LOCK_MINUTES * 60 * 1000;
      await saveState(redis, id, { attempts: nextAttempts, lockedUntil: until });
      if (!lockedInfo || until > lockedInfo.until) lockedInfo = { locked: true, until };
    } else {
      await saveState(redis, id, { attempts: nextAttempts });
    }
  }
  if (lockedInfo) return lockedInfo;
  return { locked: false as const };
}

async function verifyRecaptcha(token: string | undefined, remoteIp: string | undefined) {
  if (!RECAPTCHA_SECRET) return true;
  if (!token) return false;
  try {
    const params = new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token });
    if (remoteIp) params.set("remoteip", remoteIp);
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        captchaToken: { label: "Captcha", type: "text" },
        remember: { label: "Remember", type: "text" },
      },
      async authorize(creds, req) {
        const email = creds?.email?.toString().toLowerCase();
        const password = creds?.password?.toString() ?? "";
        const captchaToken = creds?.captchaToken?.toString();
        const remember = (() => {
          const raw = creds?.remember;
          if (typeof raw === "string") {
            return raw === "true" || raw === "on";
          }
          return false;
        })();
        const redis = (() => {
          try { return getRedis(); } catch { return null; }
        })();
        const { identifiers, ip } = extractIdentifiers(email, req);

        if (redis) {
          const lockStatus = await checkLocked(redis, identifiers);
          if (lockStatus.locked) {
            throw new Error("LOCKED");
          }
        }

        const captchaOk = await verifyRecaptcha(captchaToken, ip);
        if (!captchaOk) {
          throw new Error("CAPTCHA_FAILED");
        }

        if (!email || !password) {
          if (redis) {
            const failure = await recordFailure(redis, identifiers);
            if (failure.locked) throw new Error("LOCKED");
          }
          throw new Error("INVALID");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          if (redis) {
            const failure = await recordFailure(redis, identifiers);
            if (failure.locked) throw new Error("LOCKED");
          }
          throw new Error("INVALID");
        }
        const ok = await compare(password, user.passwordHash);
        if (!ok) {
          if (redis) {
            const failure = await recordFailure(redis, identifiers);
            if (failure.locked) throw new Error("LOCKED");
          }
          throw new Error("INVALID");
        }

        if (redis) {
          try { await clearState(redis, identifiers); } catch {}
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role, remember } as any as NextAuthUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const remember = Boolean((user as any).remember);
        const maxAge = remember ? REMEMBER_MAX_AGE_SECONDS : DEFAULT_MAX_AGE_SECONDS;
        token.role = (user as any).role;
        (token as any).remember = remember;
        (token as any).exp = Math.floor(Date.now() / 1000 + maxAge);
      } else if (trigger === "update" && session) {
        if (typeof (session as any).remember === "boolean") {
          (token as any).remember = (session as any).remember;
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role = token.role;
       (session as any).remember = (token as any).remember ?? false;
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
