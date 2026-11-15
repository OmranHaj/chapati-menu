import { Link } from "wouter";
import { Logo } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] grid place-items-center px-4 text-center" dir="rtl">
      <div className="rise">
        <div className="flex justify-center"><Logo size={72} /></div>
        <p className="font-display text-[7rem] leading-none text-secondary mt-6">404</p>
        <h1 className="font-display text-3xl text-primary">الصفحة مو موجودة</h1>
        <p className="text-muted-foreground mt-2">يمكن الرابط تغيّر. المنيو بانتظارك.</p>
        <Link href="/" className="mt-6 inline-flex bg-primary text-primary-foreground rounded-full px-6 py-3 font-semibold" data-testid="link-back-menu">ارجع للمنيو</Link>
      </div>
    </div>
  );
}
