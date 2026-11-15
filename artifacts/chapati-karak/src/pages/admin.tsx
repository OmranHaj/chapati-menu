import { useState } from "react";
import { Link } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, LogOut, ShieldAlert, Lock, Package, Layers, Star, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import {
  useGetAdminStatus, useGetMenuSummary, useListCategories, useListProducts, useGetStoreSettings,
  useUpdateStoreSettings, useCreateCategory, useUpdateCategory, useDeleteCategory,
  useCreateProduct, useUpdateProduct, useDeleteProduct,
  getListProductsQueryKey, getListCategoriesQueryKey, getGetMenuSummaryQueryKey, getGetStoreSettingsQueryKey,
} from "@workspace/api-client-react";
import type { Product, Category, ProductInput } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/brand";
import { basePath, errorMessage, formatPrice, imageFor } from "@/lib/menu-utils";

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
    qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetMenuSummaryQueryKey() });
  };
}

const btn = "inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 font-semibold transition-colors disabled:opacity-50";
const btnPrimary = `${btn} bg-primary text-primary-foreground hover:bg-primary/90`;
const btnOrange = `${btn} bg-secondary text-secondary-foreground hover:bg-secondary/90`;
const btnGhost = `${btn} border border-border hover:bg-muted`;

function StateScreen({ icon: I, title, body, children }: { icon: typeof Lock; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] grid place-items-center px-4" dir="rtl">
      <div className="max-w-md text-center bg-card border border-border rounded-[2rem] p-8 shadow-xl rise">
        <div className="mx-auto w-16 h-16 rounded-full bg-accent grid place-items-center"><I className="w-7 h-7 text-secondary" /></div>
        <h1 className="font-display text-3xl text-primary mt-5">{title}</h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">{body}</p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">{children}</div>
      </div>
    </div>
  );
}

function SignOutBtn({ className = btnGhost }: { className?: string }) {
  const { signOut } = useClerk();
  return <button className={className} onClick={() => signOut({ redirectUrl: basePath || "/" })} data-testid="button-signout"><LogOut className="w-4 h-4" /> خروج</button>;
}

export default function AdminPage() {
  const status = useGetAdminStatus();
  if (status.isLoading)
    return <div className="min-h-[100dvh] grid place-items-center"><Skeleton className="w-80 h-64 rounded-[2rem]" /></div>;
  if (status.isError)
    return (
      <StateScreen icon={ShieldAlert} title="تعذّر التحقق من الصلاحية" body={errorMessage(status.error, "لم نتمكن من الوصول للخادم.")}>
        <button className={btnPrimary} onClick={() => status.refetch()} data-testid="button-retry-status"><RefreshCw className="w-4 h-4" /> إعادة المحاولة</button>
        <Link href="/" className={btnGhost}>المنيو</Link>
      </StateScreen>
    );
  const s = status.data!;
  if (!s.authenticated)
    return (
      <StateScreen icon={Lock} title="الجلسة غير موجودة" body="سجّل الدخول بحساب المالك للوصول إلى لوحة الإدارة.">
        <Link href="/sign-in" className={btnPrimary} data-testid="link-signin">تسجيل الدخول</Link>
        <Link href="/" className={btnGhost}>المنيو</Link>
      </StateScreen>
    );
  if (!s.configured)
    return (
      <StateScreen icon={ShieldAlert} title="الإدارة غير مهيّأة بعد" body="لم يتم ضبط حساب المالك على الخادم. لن يُمنح أي حساب صلاحية الإدارة حتى يتم إعداد البريد المعتمد.">
        <SignOutBtn /><Link href="/" className={btnGhost}>المنيو</Link>
      </StateScreen>
    );
  if (!s.isAdmin)
    return (
      <StateScreen icon={ShieldAlert} title="لا تملك صلاحية الإدارة" body="هذا الحساب مسجّل لكنه ليس حساب المالك. إذا كنت المالك، سجّل الدخول بالبريد المعتمد.">
        <SignOutBtn /><Link href="/" className={btnGhost}>المنيو</Link>
      </StateScreen>
    );
  return <Dashboard />;
}

function Dashboard() {
  const { user } = useUser();
  const summary = useGetMenuSummary();
  const settings = useGetStoreSettings();
  const currency = settings.data?.currency;
  const stats = [
    { k: "totalProducts", l: "إجمالي الأصناف", I: Package },
    { k: "availableProducts", l: "المتوفر الآن", I: CheckCircle2 },
    { k: "totalCategories", l: "الأقسام", I: Layers },
    { k: "featuredProducts", l: "المميّز", I: Star },
  ] as const;
  return (
    <div className="min-h-[100dvh]" dir="rtl">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between gap-3">
          <div className="bg-background rounded-full p-1"><Logo size={44} /></div>
          <div className="flex items-center gap-2">
            <span className="hidden md:block text-sm text-primary-foreground/70">{user?.primaryEmailAddress?.emailAddress}</span>
            <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-full hover:bg-white/10" data-testid="link-menu"><ArrowRight className="w-4 h-4" /> المنيو</Link>
            <SignOutBtn className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-full bg-white/10 hover:bg-white/20" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-16 pt-4">
          <p className="text-secondary font-semibold text-sm">لوحة المالك</p>
          <h1 className="font-display text-5xl">إدارة المنيو</h1>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 -mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ k, l, I }) => (
          <div key={k} className="bg-card border border-card-border rounded-3xl p-5 shadow-lg" data-testid={`stat-${k}`}>
            <I className="w-5 h-5 text-secondary" />
            {summary.isLoading ? <Skeleton className="h-10 w-16 mt-2" /> : <div className="font-display text-4xl text-primary mt-2">{summary.data?.[k] ?? "—"}</div>}
            <div className="text-sm text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
      <main className="max-w-6xl mx-auto px-4 py-10">
        <Tabs defaultValue="products" dir="rtl">
          <TabsList className="rounded-full bg-muted p-1 h-12">
            <TabsTrigger value="products" className="rounded-full px-5 h-10" data-testid="tab-products">الأصناف</TabsTrigger>
            <TabsTrigger value="categories" className="rounded-full px-5 h-10" data-testid="tab-categories">الأقسام</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full px-5 h-10" data-testid="tab-settings">الإعدادات</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-6"><ProductsPanel currency={currency} /></TabsContent>
          <TabsContent value="categories" className="mt-6"><CategoriesPanel /></TabsContent>
          <TabsContent value="settings" className="mt-6"><SettingsPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

const emptyProduct = (categoryId = 0): ProductInput => ({ name: "", nameEn: "", description: "", price: 0, categoryId, imageUrl: "", available: true, featured: false, badge: "" });

function ProductsPanel({ currency }: { currency?: string }) {
  const products = useListProducts();
  const cats = useListCategories();
  const [filter, setFilter] = useState<number | "all">("all");
  const [editing, setEditing] = useState<{ id: number | null; data: ProductInput } | null>(null);
  const [del, setDel] = useState<Product | null>(null);
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  const invalidate = useInvalidate();
  const { toast } = useToast();
  const list = (products.data ?? []).filter((p) => filter === "all" || p.categoryId === filter);
  const catName = (id: number) => cats.data?.find((c) => c.id === id)?.name ?? "—";

  const toggle = (p: Product, field: "available" | "featured") => {
    const { id, ...rest } = p;
    update.mutate({ id, data: { ...rest, [field]: !p[field] } }, {
      onSuccess: invalidate,
      onError: (e) => toast({ title: "تعذّر التحديث", description: errorMessage(e), variant: "destructive" }),
    });
  };

  const save = () => {
    if (!editing) return;
    const d = editing.data;
    if (!d.name.trim()) { toast({ title: "اسم الصنف مطلوب", variant: "destructive" }); return; }
    if (!d.categoryId) { toast({ title: "اختر القسم", variant: "destructive" }); return; }
    if (!(d.price >= 0)) { toast({ title: "السعر غير صالح", variant: "destructive" }); return; }
    const data = { ...d, name: d.name.trim(), price: Number(d.price) };
    const opts = {
      onSuccess: () => { invalidate(); setEditing(null); toast({ title: editing.id ? "تم حفظ التعديلات" : "تمت إضافة الصنف" }); },
      onError: (e: unknown) => toast({ title: "تعذّر الحفظ", description: errorMessage(e), variant: "destructive" }),
    };
    if (editing.id) update.mutate({ id: editing.id, data }, opts);
    else create.mutate({ data }, opts);
  };

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setEditing((e) => e && { ...e, data: { ...e.data, [k]: v } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>الكل</FilterChip>
          {cats.data?.map((c) => <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>{c.name}</FilterChip>)}
        </div>
        <button className={btnOrange} disabled={!cats.data?.length} onClick={() => setEditing({ id: null, data: emptyProduct(cats.data?.[0]?.id) })} data-testid="button-add-product"><Plus className="w-4 h-4" /> صنف جديد</button>
      </div>
      {products.isError ? (
        <ErrorBox msg={errorMessage(products.error)} onRetry={() => products.refetch()} />
      ) : products.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}</div>
      ) : list.length === 0 ? (
        <EmptyBox title="لا توجد أصناف هنا" body={cats.data?.length ? "أضف أول صنف لهذا القسم." : "أنشئ قسماً أولاً من تبويب الأقسام."} />
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <div key={p.id} className="bg-card border border-card-border rounded-3xl p-3 flex flex-wrap sm:flex-nowrap items-center gap-4" data-testid={`row-product-${p.id}`}>
              <img src={imageFor(p.imageUrl, p.id)} alt="" className={`w-20 h-20 rounded-2xl object-cover ${!p.available ? "grayscale" : ""}`} />
              <div className="flex-1 min-w-[10rem]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{p.name}</span>
                  {p.badge && <span className="text-[11px] font-bold bg-accent text-accent-foreground rounded-full px-2">{p.badge}</span>}
                </div>
                <div className="text-sm text-muted-foreground">{catName(p.categoryId)} · <span className="text-secondary font-semibold">{formatPrice(p.price, currency)}</span></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={p.available} onCheckedChange={() => toggle(p, "available")} data-testid={`switch-available-${p.id}`} /> متوفر</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={p.featured} onCheckedChange={() => toggle(p, "featured")} data-testid={`switch-featured-${p.id}`} /> مميّز</label>
              <div className="flex gap-1">
                <button className="p-2.5 rounded-full hover:bg-muted" onClick={() => { const { id, ...rest } = p; setEditing({ id, data: rest }); }} aria-label="تعديل" data-testid={`button-edit-product-${p.id}`}><Pencil className="w-4 h-4" /></button>
                <button className="p-2.5 rounded-full hover:bg-destructive/10 text-destructive" onClick={() => setDel(p)} aria-label="حذف" data-testid={`button-delete-product-${p.id}`}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl rounded-3xl max-h-[90dvh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="font-display text-3xl text-primary text-right">{editing?.id ? "تعديل صنف" : "صنف جديد"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="الاسم بالعربي *"><Input value={editing.data.name} maxLength={100} onChange={(e) => set("name", e.target.value)} data-testid="input-product-name" /></F>
              <F label="الاسم بالإنجليزي"><Input dir="ltr" value={editing.data.nameEn} maxLength={100} onChange={(e) => set("nameEn", e.target.value)} data-testid="input-product-name-en" /></F>
              <F label="القسم *">
                <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={editing.data.categoryId} onChange={(e) => set("categoryId", Number(e.target.value))} data-testid="select-product-category">
                  {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </F>
              <F label={`السعر (${currency || "ل.س"}) *`}><Input type="number" min={0} step="0.01" value={editing.data.price} onChange={(e) => set("price", Number(e.target.value))} data-testid="input-product-price" /></F>
              <div className="sm:col-span-2"><F label="الوصف"><Textarea value={editing.data.description} maxLength={500} rows={3} onChange={(e) => set("description", e.target.value)} data-testid="input-product-description" /></F></div>
              <F label="شارة (اختياري)"><Input value={editing.data.badge} maxLength={40} placeholder="جديد، حار..." onChange={(e) => set("badge", e.target.value)} data-testid="input-product-badge" /></F>
              <F label="رابط الصورة"><Input dir="ltr" value={editing.data.imageUrl} maxLength={2048} placeholder="/images/chapati.jpg" onChange={(e) => set("imageUrl", e.target.value)} data-testid="input-product-image" /></F>
              <div className="sm:col-span-2 flex items-center gap-4">
                <img src={imageFor(editing.data.imageUrl, editing.id ?? 0)} alt="" className="w-20 h-20 rounded-2xl object-cover bg-muted" />
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={editing.data.available} onCheckedChange={(v) => set("available", v)} data-testid="switch-product-available" /> متوفر</label>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={editing.data.featured} onCheckedChange={(v) => set("featured", v)} data-testid="switch-product-featured" /> يظهر ضمن اختياراتنا لك</label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <button className={btnGhost} onClick={() => setEditing(null)}>إلغاء</button>
            <button className={btnPrimary} onClick={save} disabled={create.isPending || update.isPending} data-testid="button-save-product">{create.isPending || update.isPending ? "جارٍ الحفظ..." : "حفظ"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Confirm open={!!del} onClose={() => setDel(null)} title={`حذف «${del?.name ?? ""}»؟`} body="سيختفي الصنف من المنيو نهائياً. لا يمكن التراجع." pending={remove.isPending}
        onConfirm={() => del && remove.mutate({ id: del.id }, {
          onSuccess: () => { invalidate(); setDel(null); toast({ title: "تم حذف الصنف" }); },
          onError: (e) => toast({ title: "تعذّر الحذف", description: errorMessage(e), variant: "destructive" }),
        })} />
    </div>
  );
}

function CategoriesPanel() {
  const cats = useListCategories();
  const [editing, setEditing] = useState<{ id: number | null; name: string; nameEn: string } | null>(null);
  const [del, setDel] = useState<Category | null>(null);
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const invalidate = useInvalidate();
  const { toast } = useToast();
  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast({ title: "اسم القسم مطلوب", variant: "destructive" }); return; }
    const data = { name: editing.name.trim(), nameEn: editing.nameEn.trim() };
    const opts = {
      onSuccess: () => { invalidate(); setEditing(null); toast({ title: "تم الحفظ" }); },
      onError: (e: unknown) => toast({ title: "تعذّر الحفظ", description: errorMessage(e), variant: "destructive" }),
    };
    if (editing.id) update.mutate({ id: editing.id, data }, opts); else create.mutate({ data }, opts);
  };
  return (
    <div>
      <div className="flex justify-end mb-5"><button className={btnOrange} onClick={() => setEditing({ id: null, name: "", nameEn: "" })} data-testid="button-add-category"><Plus className="w-4 h-4" /> قسم جديد</button></div>
      {cats.isError ? <ErrorBox msg={errorMessage(cats.error)} onRetry={() => cats.refetch()} /> : cats.isLoading ? <Skeleton className="h-40 rounded-3xl" /> : !cats.data?.length ? (
        <EmptyBox title="لا توجد أقسام" body="ابدأ بإضافة قسم مثل المشروبات." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.data.map((c) => (
            <div key={c.id} className="bg-card border border-card-border rounded-3xl p-5" data-testid={`card-category-${c.id}`}>
              <div className="font-display text-2xl text-primary">{c.name}</div>
              <div className="text-xs text-muted-foreground tracking-widest uppercase" dir="ltr" style={{ textAlign: "right" }}>{c.nameEn || "—"}</div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm bg-muted rounded-full px-3 py-1">{c.productCount} صنف</span>
                <div className="flex gap-1">
                  <button className="p-2.5 rounded-full hover:bg-muted" onClick={() => setEditing({ id: c.id, name: c.name, nameEn: c.nameEn })} aria-label="تعديل" data-testid={`button-edit-category-${c.id}`}><Pencil className="w-4 h-4" /></button>
                  <button className="p-2.5 rounded-full hover:bg-destructive/10 text-destructive" onClick={() => setDel(c)} aria-label="حذف" data-testid={`button-delete-category-${c.id}`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md rounded-3xl" dir="rtl">
          <DialogHeader><DialogTitle className="font-display text-3xl text-primary text-right">{editing?.id ? "تعديل قسم" : "قسم جديد"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <F label="الاسم بالعربي *"><Input value={editing.name} maxLength={80} onChange={(e) => setEditing({ ...editing, name: e.target.value })} data-testid="input-category-name" /></F>
              <F label="الاسم بالإنجليزي"><Input dir="ltr" value={editing.nameEn} maxLength={80} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} data-testid="input-category-name-en" /></F>
            </div>
          )}
          <DialogFooter className="gap-2">
            <button className={btnGhost} onClick={() => setEditing(null)}>إلغاء</button>
            <button className={btnPrimary} onClick={save} disabled={create.isPending || update.isPending} data-testid="button-save-category">حفظ</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Confirm open={!!del} onClose={() => setDel(null)} title={`حذف قسم «${del?.name ?? ""}»؟`} pending={remove.isPending}
        body={del && del.productCount > 0 ? `هذا القسم يحتوي على ${del.productCount} صنف ولن يسمح الخادم بحذفه. انقل الأصناف أو احذفها أولاً.` : "سيُحذف القسم نهائياً."}
        onConfirm={() => del && remove.mutate({ id: del.id }, {
          onSuccess: () => { invalidate(); setDel(null); toast({ title: "تم حذف القسم" }); },
          onError: (e) => { setDel(null); toast({ title: "تعذّر حذف القسم", description: errorMessage(e), variant: "destructive" }); },
        })} />
    </div>
  );
}

function SettingsPanel() {
  const settings = useGetStoreSettings();
  const update = useUpdateStoreSettings();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [val, setVal] = useState<string | null>(null);
  const current = val ?? settings.data?.currency ?? "";
  if (settings.isLoading) return <Skeleton className="h-48 rounded-3xl max-w-lg" />;
  if (settings.isError) return <ErrorBox msg={errorMessage(settings.error)} onRetry={() => settings.refetch()} />;
  return (
    <div className="bg-card border border-card-border rounded-3xl p-6 max-w-lg">
      <h3 className="font-display text-2xl text-primary">العملة</h3>
      <p className="text-sm text-muted-foreground mt-1">تظهر بجانب كل الأسعار في المنيو.</p>
      <div className="flex gap-2 mt-4 flex-wrap">
        {["ل.س", "ر.س", "د.إ", "د.أ", "$", "€"].map((c) => <FilterChip key={c} active={current === c} onClick={() => setVal(c)}>{c}</FilterChip>)}
      </div>
      <div className="flex gap-2 mt-4">
        <Input value={current} maxLength={20} onChange={(e) => setVal(e.target.value)} data-testid="input-currency" />
        <button className={btnPrimary} disabled={!current.trim() || update.isPending} data-testid="button-save-currency"
          onClick={() => update.mutate({ data: { currency: current.trim() } }, {
            onSuccess: (d) => { qc.setQueryData(getGetStoreSettingsQueryKey(), d); setVal(null); toast({ title: "تم حفظ العملة" }); },
            onError: (e) => toast({ title: "تعذّر الحفظ", description: errorMessage(e), variant: "destructive" }),
          })}>حفظ</button>
      </div>
      <p className="text-sm mt-4">معاينة: <span className="font-display text-xl text-secondary">{formatPrice(12.5, current)}</span></p>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm font-semibold">{label}</Label>{children}</div>;
}
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`shrink-0 h-9 rounded-full px-4 text-sm font-semibold border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>{children}</button>;
}
function ErrorBox({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return <div className="text-center py-14 bg-card rounded-3xl border border-border"><p className="font-bold text-destructive">{msg}</p><button className={`${btnGhost} mt-4`} onClick={onRetry}><RefreshCw className="w-4 h-4" /> إعادة المحاولة</button></div>;
}
function EmptyBox({ title, body }: { title: string; body: string }) {
  return <div className="text-center py-14 bg-card rounded-3xl border border-dashed border-primary/25"><Package className="w-10 h-10 mx-auto text-secondary" /><p className="font-display text-2xl text-primary mt-3">{title}</p><p className="text-muted-foreground text-sm mt-1">{body}</p></div>;
}
function Confirm({ open, onClose, title, body, onConfirm, pending }: { open: boolean; onClose: () => void; title: string; body: string; onConfirm: () => void; pending: boolean }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent dir="rtl" className="rounded-3xl">
        <AlertDialogHeader><AlertDialogTitle className="text-right">{title}</AlertDialogTitle><AlertDialogDescription className="text-right">{body}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-full">إلغاء</AlertDialogCancel>
          <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={pending} onClick={(e) => { e.preventDefault(); onConfirm(); }} data-testid="button-confirm-delete">{pending ? "جارٍ الحذف..." : "حذف"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
