import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

const ROLES = ["ADMIN", "TECH", "CLERK"] as const;

type Role = (typeof ROLES)[number];

function isRole(value: string | Role | undefined): value is Role {
  return !!value && ROLES.includes(value as Role);
}

async function requireAdmin() {
  const session = await getAuthSession();
  if (!session || (session.user as any).role !== "ADMIN") {
    return null;
  }
  return session;
}

type RouteParams = Promise<{ id: string }>;

export async function PATCH(request: Request, ctx: { params: RouteParams }) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ code: "UNAUTHORIZED", message: "غير مصرح" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ code: "INVALID_BODY", message: "بيانات غير صالحة" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return Response.json({ code: "NOT_FOUND", message: "المستخدم غير موجود" }, { status: 404 });
  }

  const data: any = {};
  if (body.name) {
    data.name = String(body.name).trim();
  }
  if (body.email) {
    data.email = String(body.email).trim().toLowerCase();
  }
  if (body.password) {
    const password = String(body.password);
    if (password.length < 6) {
      return Response.json({ code: "WEAK_PASSWORD", message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }
  if (body.role && isRole(body.role)) {
    const newRole = body.role as Role;
    if (user.role === "ADMIN" && newRole !== "ADMIN") {
      const otherAdmins = await prisma.user.count({ where: { role: "ADMIN", NOT: { id } } });
      if (otherAdmins === 0) {
        return Response.json({ code: "LAST_ADMIN", message: "لا يمكن إزالة آخر مدير" }, { status: 400 });
      }
    }
    data.role = newRole;
  }

  if (!Object.keys(data).length) {
    return Response.json({ code: "NO_UPDATES", message: "لا توجد تغييرات" }, { status: 400 });
  }

  try {
    await prisma.user.update({ where: { id }, data });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return Response.json({ code: "EMAIL_EXISTS", message: "البريد مستخدم بالفعل" }, { status: 400 });
    }
    return Response.json({ code: "SERVER_ERROR", message: "فشل التحديث" }, { status: 500 });
  }

  revalidatePath("/users");
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: { params: RouteParams }) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ code: "UNAUTHORIZED", message: "غير مصرح" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!user) {
    return Response.json({ code: "NOT_FOUND", message: "المستخدم غير موجود" }, { status: 404 });
  }

  if (user.role === "ADMIN") {
    const otherAdmins = await prisma.user.count({ where: { role: "ADMIN", NOT: { id } } });
    if (otherAdmins === 0) {
      return Response.json({ code: "LAST_ADMIN", message: "لا يمكن حذف آخر مدير" }, { status: 400 });
    }
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    return Response.json({ code: "SERVER_ERROR", message: "فشل الحذف" }, { status: 500 });
  }

  revalidatePath("/users");
  return Response.json({ ok: true });
}
