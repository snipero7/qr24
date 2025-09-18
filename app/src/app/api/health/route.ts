import { prisma } from "@/server/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: true });
  } catch {
    return Response.json({ status: "degraded", db: false }, { status: 500 });
  }
}
