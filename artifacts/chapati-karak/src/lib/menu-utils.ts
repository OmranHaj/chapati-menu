export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function formatPrice(price: number, currency?: string) {
  const n = Number.isInteger(price) ? String(price) : price.toFixed(2);
  return `${n} ${currency || "ل.س"}`;
}

const fallbacks = ["/images/chapati.jpg", "/images/karak.jpg", "/images/breakfast.jpg", "/images/chicken.jpg"];

export function imageFor(url: string | undefined, seed = 0) {
  const u = (url || "").trim();
  if (!u) return `${basePath}${fallbacks[seed % fallbacks.length]}`;
  if (u.startsWith("/")) return `${basePath}${u}`;
  return u;
}

export function errorMessage(e: unknown, fallback = "حدث خطأ غير متوقع") {
  const err = e as { status?: number; data?: { error?: string; message?: string } | null; message?: string } | null;
  if (!err) return fallback;
  if (err.status === 409) return err.data?.error || "لا يمكن حذف قسم يحتوي على أصناف. انقل الأصناف أو احذفها أولاً.";
  if (err.status === 401) return "انتهت الجلسة، سجّل الدخول من جديد.";
  if (err.status === 403) return "ليست لديك صلاحية الإدارة.";
  return err.data?.error || err.data?.message || fallback;
}
