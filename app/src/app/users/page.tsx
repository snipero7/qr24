import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";

export default async function UsersPage() {
  const session = await getAuthSession();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/signin");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">المستخدمون</h1>

      <section className="border rounded p-4 bg-white">
        <h2 className="font-semibold mb-3">إنشاء مستخدم</h2>
        <form action={createUser} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input name="name" required placeholder="الاسم" className="border rounded p-2" />
          <input name="email" required type="email" placeholder="البريد" className="border rounded p-2" />
          <input name="password" required type="password" placeholder="كلمة المرور" className="border rounded p-2" />
          <select name="role" defaultValue="CLERK" className="border rounded p-2">
            <option value="ADMIN">ADMIN</option>
            <option value="TECH">TECH</option>
            <option value="CLERK">CLERK</option>
          </select>
          <button className="btn-primary">إنشاء</button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold mb-3">قائمة المستخدمين</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">الاسم</th>
                <th className="p-2">البريد</th>
                <th className="p-2">الدور</th>
                <th className="p-2">تحديث الدور</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">
                    <form action={updateRole} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} className="border rounded p-1">
                        <option value="ADMIN">ADMIN</option>
                        <option value="TECH">TECH</option>
                        <option value="CLERK">CLERK</option>
                      </select>
                      <button className="border px-2 rounded">حفظ</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

async function createUser(formData: FormData) {
  "use server";
  const session = await getAuthSession();
  if (!session || (session.user as any).role !== "ADMIN") return;
  const name = String(formData.get("name"));
  const email = String(formData.get("email")).toLowerCase();
  const password = String(formData.get("password"));
  const role = String(formData.get("role")) as any;
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash, role } });
}

async function updateRole(formData: FormData) {
  "use server";
  const session = await getAuthSession();
  if (!session || (session.user as any).role !== "ADMIN") return;
  const id = String(formData.get("id"));
  const role = String(formData.get("role")) as any;
  await prisma.user.update({ where: { id }, data: { role } });
}
