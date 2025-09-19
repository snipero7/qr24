import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import EditUserDialog from "@/components/users/EditUserDialog";
import DeleteUserButton from "@/components/users/DeleteUserButton";
import NewUserForm from "@/components/users/NewUserForm";
import { roleToArabic } from "@/lib/roleLabels";

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
          <NewUserForm action={createUser} />
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
                <TH className="text-right">الاسم</TH>
                <TH className="text-right">البريد</TH>
                <TH className="text-center">الدور</TH>
                <TH className="text-center">إجراءات</TH>
              </TR>
            </THead>
            <TBody>
              {users.map(u => (
                <TR key={u.id} className="glass-row rounded-xl">
                  <TD className="text-right">{u.name}</TD>
                  <TD className="text-right">{u.email}</TD>
                  <TD className="text-center">{roleToArabic(u.role)}</TD>
                  <TD className="text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <EditUserDialog user={{ id: u.id, name: u.name, email: u.email, role: u.role }} variant="pill" />
                      <DeleteUserButton user={{ id: u.id, name: u.name, role: u.role }} variant="pill" />
                    </div>
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
  revalidatePath("/users");
}
