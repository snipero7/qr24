import bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@example.com', passwordHash, role: 'ADMIN' },
  });

  const customer = await prisma.customer.upsert({
    where: { phone: '0550000000' },
    update: { name: 'عميل تجريبي' },
    create: { name: 'عميل تجريبي', phone: '0550000000' },
  });

  const order = await prisma.order.create({
    data: {
      code: 'demo12345',
      customerId: customer.id,
      service: 'تغيير شاشة',
      originalPrice: 350,
      status: 'NEW',
      statusLogs: { create: { to: 'NEW' } },
    },
  });

  const debt = await prisma.debt.create({
    data: { shopName: 'محل التقانة', service: 'سوفت وير', amount: 100, status: 'OPEN' },
  });
  await prisma.debtPayment.create({ data: { debtId: debt.id, amount: 50 } });

  console.log({ admin: admin.email, order: order.code, debt: debt.id });
}

main().finally(async () => {
  await prisma.$disconnect();
});
