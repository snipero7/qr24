import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function UsersPage() {
  const session = await getAuthSession();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/signin");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">المستخدمون</h1>

      <section className="card tonal">
        <div className="card-header">
          <h2 className="card-title">إنشاء مستخدم</h2>
        </div>
        <div className="card-section">
        <form action={createUser} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <Input name="name" required placeholder="الاسم" />
          <Input name="email" required type="email" placeholder="البريد" />
          <Input name="password" required type="password" placeholder="كلمة المرور" />
          <Select name="role" defaultValue="CLERK">
            <option value="ADMIN">ADMIN</option>
            <option value="TECH">TECH</option>
            <option value="CLERK">CLERK</option>
          </Select>
          <button className="btn-primary h-14 sm:h-12 px-6">إنشاء</button>
        </form>
        </div>
      </section>

      <section className="card tonal p-0">
        <div className="card-header">
          <h2 className="card-title">قائمة المستخدمين</h2>
        </div>
        <div className="card-section overflow-x-auto">
          <Table className="glass-table">
            <THead>
              <TR>
                <TH>الاسم</TH>
                <TH>البريد</TH>
                <TH>الدور</TH>
                <TH>تحديث الدور</TH>
              </TR>
            </THead>
            <TBody>
              {users.map(u => (
                <TR key={u.id} className="glass-row rounded-xl">
                  <TD>{u.name}</TD>
                  <TD>{u.email}</TD>
                  <TD>{u.role}</TD>
                  <TD>
                    <form action={updateRole} className="flex items-center gap-2 justify-end">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} className="input h-8 py-0">
                        <option value="ADMIN">ADMIN</option>
                        <option value="TECH">TECH</option>
                        <option value="CLERK">CLERK</option>
                      </select>
                      <button className="btn-outline h-8 px-3">حفظ</button>
                    </form>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
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
