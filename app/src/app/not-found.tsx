import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-gray-400">404</p>
        <h1 className="text-3xl font-bold">عذرًا، الصفحة غير موجودة</h1>
        <p className="text-gray-600 max-w-md">
          الرابط الذي وصلت إليه غير صحيح أو تم نقله. يمكنك العودة إلى لوحة التحكم أو تسجيل الدخول من جديد.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/dashboard" className="btn-primary px-6">
          العودة للوحة التحكم
        </Link>
        <Link href="/signin" className="btn-outline px-6">
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
