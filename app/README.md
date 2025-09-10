هذا مشروع Next.js TypeScript لإدارة صيانة الجوالات وفق مستند System Design.md.

## التشغيل محليًا

المتطلبات: Node LTS + pnpm + Docker

1) شغّل قواعد البيانات:

```
docker compose up -d
```

2) عدّل ملف `app/.env` حسب بيئتك (DATABASE_URL/REDIS_URL ...).

3) ولّد عميل Prisma ثم ادفع المخطط:

```
pnpm db:generate
pnpm db:push
```

4) (اختياري) زرع بيانات تجريبية:

```
pnpm db:seed
```

5) شغّل الخادم:

```
pnpm dev
```

Endpoints مهمة:

- GET `/api/health` فحص الصحة
- POST `/api/orders` إنشاء طلب
- PATCH `/api/orders/:id/status` تحديث حالة
- POST `/api/orders/:id/deliver` تسليم مع تحصيل
- POST `/api/debts` إنشاء دين
- POST `/api/debts/:id/payments` إضافة دفعة
- GET `/api/reports/summary` ملخص الإحصاءات
- Page `/track/[code]` تتبع الطلب عبر الكود

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
