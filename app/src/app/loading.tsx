export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
        role="status"
        aria-label="جارٍ التحميل"
      />
    </div>
  );
}
