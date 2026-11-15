import { Link } from "wouter";
import { basePath } from "@/lib/menu-utils";

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-3 shrink-0" data-testid="link-home">
      <img src={`${basePath}/logo.png`} alt="شباتي وكرك" style={{ width: size, height: size }} className="rounded-full object-cover bg-[#FAF8F0] ring-2 ring-[#0F5A2B]/10" />
      <span className="leading-none hidden sm:block">
        <span className="font-display text-2xl text-primary block">شباتي وكرك</span>
        <span className="text-[11px] tracking-[0.25em] text-secondary font-semibold" dir="ltr">CHAPATI & KARAK</span>
      </span>
    </Link>
  );
}

export function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} fill="none" aria-hidden>
      <path d="M2 6 Q 12 0 22 6 T 42 6 T 62 6 T 82 6 T 102 6 T 118 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
