import { useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import { Show } from "@clerk/react";
import { Search, X, Flame, Coffee, Sun, Moon, UtensilsCrossed, RefreshCw, Settings2 } from "lucide-react";
import { useListCategories, useListProducts, useGetStoreSettings } from "@workspace/api-client-react";
import type { Product, Category } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo, Squiggle } from "@/components/brand";
import { basePath, formatPrice, imageFor } from "@/lib/menu-utils";

function catIcon(c: Category) {
  const s = `${c.name} ${c.nameEn}`.toLowerCase();
  if (s.includes("drink") || s.includes("مشروب")) return Coffee;
  if (s.includes("morning") || s.includes("صباح")) return Sun;
  if (s.includes("evening") || s.includes("مسائ")) return Moon;
  return UtensilsCrossed;
}

export default function MenuPage() {
  const [cat, setCat] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [open, setOpen] = useState<Product | null>(null);
  useEffect(() => { const t = setTimeout(() => setDq(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  const cats = useListCategories();
  const settings = useGetStoreSettings();
  const featured = useListProducts({ featured: true });
  const params = useMemo(() => ({ ...(cat ? { categoryId: cat } : {}), ...(dq ? { search: dq } : {}) }), [cat, dq]);
  const products = useListProducts(params);
  const currency = settings.data?.currency;
  const catName = (id: number) => cats.data?.find((c) => c.id === id)?.name ?? "";

  const grouped = useMemo(() => {
    const list = products.data ?? [];
    const cs = cats.data ?? [];
    return cs.map((c) => ({ c, items: list.filter((p) => p.categoryId === c.id) })).filter((g) => g.items.length);
  }, [products.data, cats.data]);

  return (
    <div className="min-h-[100dvh]" dir="rtl">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <Logo size={52} />
          <Show when="signed-in">
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-primary rounded-full border border-primary/20 px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors" data-testid="link-admin">
              <Settings2 className="w-4 h-4" /> لوحة الإدارة
            </Link>
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm font-semibold text-muted-foreground hover:text-primary" data-testid="link-signin">دخول المالك</Link>
          </Show>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-14 pb-10 grid md:grid-cols-[1.05fr_1fr] gap-8 md:gap-12 items-center">
        <div className="rise">
          <span className="inline-flex items-center gap-2 text-secondary font-semibold text-sm bg-accent rounded-full px-3 py-1">
            <Flame className="w-4 h-4" /> المنيو الإلكتروني
          </span>
          <h1 className="font-display text-primary text-[3.4rem] leading-[1.05] md:text-[5.2rem] mt-5">
            شباتي ساخن
            <br />
            <span className="text-secondary">وكرك</span> يعدّل المزاج
          </h1>
          <Squiggle className="w-40 text-secondary mt-3" />
          <p className="mt-5 text-lg text-muted-foreground max-w-md leading-relaxed">
            خبز شباتي ينضج على الصاج، حشوات للصبح وللمسا، وكرك مغلي بالهيل والزعفران. اختر قسمك وتصفّح.
          </p>
          <a href="#menu" className="mt-7 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-7 py-3.5 font-semibold shadow-[0_10px_30px_-10px_hsl(143_71%_21%/.6)] hover:-translate-y-0.5 transition-transform" data-testid="button-browse">
            تصفّح المنيو
          </a>
        </div>
        <div className="relative rise" style={{ animationDelay: ".15s" }}>
          <div className="absolute -inset-3 rounded-[2.5rem] bg-secondary rotate-3" />
          <img src={`${basePath}/images/hero.jpg`} alt="شباتي وكرك" className="relative w-full aspect-[4/3.4] object-cover rounded-[2.2rem] -rotate-1 shadow-2xl" />
          <div className="absolute -bottom-5 right-6 bg-card rounded-2xl px-4 py-3 shadow-xl border border-border flex items-center gap-3 -rotate-2">
            <div className="relative w-9 h-9 rounded-full bg-primary grid place-items-center">
              <Coffee className="w-4 h-4 text-primary-foreground" />
              <span className="steam absolute -top-3 right-3 w-1 h-3 rounded-full bg-secondary/60" />
            </div>
            <div className="text-sm"><div className="font-bold text-primary">كرك على الأصول</div><div className="text-muted-foreground text-xs">هيل، زعفران، حليب</div></div>
          </div>
        </div>
      </section>

      {/* Featured */}
      {(featured.isLoading || (featured.data && featured.data.length > 0)) && (
        <section className="bg-primary text-primary-foreground py-12 mt-6 relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-secondary font-semibold text-sm">اختيارات البيت</p>
                <h2 className="font-display text-4xl md:text-5xl">اختياراتنا لك</h2>
              </div>
            </div>
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 snap-x">
              {featured.isLoading
                ? [0, 1, 2].map((i) => <Skeleton key={i} className="w-72 h-80 rounded-3xl bg-white/10 shrink-0" />)
                : featured.data!.map((p, i) => (
                    <button key={p.id} onClick={() => setOpen(p)} className="snap-start shrink-0 w-72 text-right group" data-testid={`card-featured-${p.id}`}>
                      <div className="overflow-hidden rounded-3xl aspect-square relative">
                        <img src={imageFor(p.imageUrl, i)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <span className="absolute top-3 left-3 bg-secondary text-secondary-foreground font-bold text-sm rounded-full px-3 py-1">{formatPrice(p.price, currency)}</span>
                        {!p.available && <span className="absolute inset-0 bg-black/45 grid place-items-center font-bold">غير متوفر حالياً</span>}
                      </div>
                      <h3 className="font-display text-2xl mt-3">{p.name}</h3>
                      <p className="text-primary-foreground/70 text-sm line-clamp-2">{p.description}</p>
                    </button>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* Menu */}
      <section id="menu" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-20">
        <div className="sticky top-20 z-30 bg-background/90 backdrop-blur py-3 -mx-4 px-4 space-y-3">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن شباتي، كرك، جبن..." className="w-full h-12 rounded-full bg-card border border-border pr-12 pl-10 outline-none focus:ring-2 focus:ring-ring" data-testid="input-search" />
            {q && <button onClick={() => setQ("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="مسح" data-testid="button-clear-search"><X className="w-4 h-4" /></button>}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <Chip active={cat === null} onClick={() => setCat(null)} testId="chip-all">الكل</Chip>
            {cats.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-28 rounded-full shrink-0" />)}
            {cats.data?.map((c) => {
              const I = catIcon(c);
              return (
                <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} testId={`chip-category-${c.id}`}>
                  <I className="w-4 h-4" /> {c.name} <span className="opacity-60 text-xs">{c.productCount}</span>
                </Chip>
              );
            })}
          </div>
        </div>

        {products.isError || cats.isError ? (
          <div className="text-center py-20">
            <p className="font-display text-3xl text-primary">ما قدرنا نحمّل المنيو</p>
            <p className="text-muted-foreground mt-2">تأكد من الاتصال وحاول مرة ثانية.</p>
            <button onClick={() => { products.refetch(); cats.refetch(); }} className="mt-5 inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-5 py-2.5 font-semibold" data-testid="button-retry"><RefreshCw className="w-4 h-4" /> إعادة المحاولة</button>
          </div>
        ) : products.isLoading || cats.isLoading ? (
          <div className="grid sm:grid-cols-2 gap-5 mt-8">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-3xl" />)}</div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-20 h-20 rounded-full bg-accent grid place-items-center"><Search className="w-8 h-8 text-secondary" /></div>
            <p className="font-display text-3xl text-primary mt-5">{dq ? `لا شيء يطابق «${dq}»` : "القائمة فاضية حالياً"}</p>
            <p className="text-muted-foreground mt-2">{dq ? "جرّب كلمة ثانية أو اختر قسماً آخر." : "سنضيف الأصناف قريباً."}</p>
          </div>
        ) : (
          grouped.map(({ c, items }) => (
            <div key={c.id} className="mt-10">
              <div className="flex items-baseline gap-3 mb-5">
                <h2 className="font-display text-4xl text-primary">{c.name}</h2>
                <span className="text-xs tracking-widest text-secondary font-semibold uppercase" dir="ltr">{c.nameEn}</span>
                <span className="flex-1 border-b-2 border-dotted border-primary/20" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {items.map((p, i) => (
                  <button key={p.id} onClick={() => setOpen(p)} className="rise group text-right flex gap-4 bg-card border border-card-border rounded-3xl p-3 hover:border-secondary/50 hover:shadow-[0_14px_40px_-20px_hsl(27_86%_53%/.6)] transition-all" style={{ animationDelay: `${i * 50}ms` }} data-testid={`card-product-${p.id}`}>
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-2xl">
                      <img src={imageFor(p.imageUrl, p.id)} alt={p.name} loading="lazy" className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!p.available ? "grayscale opacity-60" : ""}`} />
                    </div>
                    <div className="flex-1 min-w-0 py-1 flex flex-col">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-foreground">{p.name}</h3>
                        {p.badge && <span className="text-[11px] font-bold bg-accent text-accent-foreground rounded-full px-2 py-0.5">{p.badge}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="font-display text-2xl text-secondary" data-testid={`text-price-${p.id}`}>{formatPrice(p.price, currency)}</span>
                        {!p.available && <span className="text-xs font-semibold text-destructive">غير متوفر</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <footer className="border-t border-border mt-10">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo size={44} />
          <p>المنيو للاطلاع فقط. الأسعار قد تتغير.</p>
        </div>
      </footer>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="p-0 overflow-hidden max-w-lg rounded-3xl border-0 bg-card" dir="rtl">
          {open && (
            <>
              <img src={imageFor(open.imageUrl, open.id)} alt={open.name} className="w-full aspect-[4/3] object-cover" />
              <div className="p-6">
                <div className="flex gap-2 flex-wrap text-xs font-semibold">
                  <span className="bg-muted rounded-full px-3 py-1 text-primary">{catName(open.categoryId)}</span>
                  {open.badge && <span className="bg-accent text-accent-foreground rounded-full px-3 py-1">{open.badge}</span>}
                  <span className={`rounded-full px-3 py-1 ${open.available ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{open.available ? "متوفر" : "غير متوفر حالياً"}</span>
                </div>
                <DialogTitle className="font-display text-4xl text-primary mt-3 text-right">{open.name}</DialogTitle>
                {open.nameEn && <p className="text-xs tracking-widest text-muted-foreground uppercase" dir="ltr" style={{ textAlign: "right" }}>{open.nameEn}</p>}
                <DialogDescription className="mt-3 text-base leading-relaxed text-right">{open.description || "—"}</DialogDescription>
                <div className="mt-5 flex items-center justify-between border-t border-dashed border-border pt-4">
                  <span className="text-muted-foreground">السعر</span>
                  <span className="font-display text-3xl text-secondary">{formatPrice(open.price, currency)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Chip({ active, onClick, children, testId }: { active: boolean; onClick: () => void; children: React.ReactNode; testId: string }) {
  return (
    <button onClick={onClick} data-testid={testId} className={`shrink-0 inline-flex items-center gap-2 h-10 rounded-full px-4 text-sm font-semibold border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground hover:border-primary/40"}`}>
      {children}
    </button>
  );
}
