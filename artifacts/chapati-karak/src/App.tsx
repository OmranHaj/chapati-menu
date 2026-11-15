import { useEffect, useRef, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { arSA } from "@clerk/localizations";
import { Route, Switch, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MenuPage from "@/pages/menu";
import AdminPage from "@/pages/admin";
import { Logo } from "@/components/brand";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 10_000, refetchInterval: 30_000, refetchOnWindowFocus: true } } });

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: "simple" as const,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
  },
  variables: {
    colorPrimary: "#0F5A2B",
    colorForeground: "#13301d",
    colorMutedForeground: "#55685b",
    colorDanger: "#b8322a",
    colorBackground: "#FFFDF7",
    colorInput: "#FAF8F0",
    colorInputForeground: "#13301d",
    colorNeutral: "#13301d",
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    borderRadius: "0.9rem",
  },
  elements: {
    rootBox: { width: "100%", display: "flex", justifyContent: "center" },
    cardBox: { background: "#FFFDF7", borderRadius: "1.75rem", width: "440px", maxWidth: "100%", overflow: "hidden", boxShadow: "0 30px 60px -30px rgba(15,90,43,.45)", border: "1px solid #e8e1cc" },
    card: { boxShadow: "none", border: 0, background: "transparent", borderRadius: 0 },
    footer: { boxShadow: "none", border: 0, background: "transparent", borderRadius: 0 },
    headerTitle: { fontFamily: "'Lalezar', serif", fontWeight: 400, fontSize: "1.9rem", color: "#0F5A2B" },
    headerSubtitle: { color: "#55685b" },
    socialButtonsBlockButtonText: { color: "#13301d", fontWeight: 600 },
    formFieldLabel: { color: "#13301d", fontWeight: 600 },
    footerActionLink: { color: "#EE7D22", fontWeight: 700 },
    footerActionText: { color: "#55685b" },
    dividerText: { color: "#55685b" },
    identityPreviewEditButton: { color: "#EE7D22" },
    formFieldSuccessText: { color: "#0F5A2B" },
    alertText: { color: "#13301d" },
    logoBox: { height: "84px", justifyContent: "center" },
    logoImage: { height: "84px", width: "84px", borderRadius: "999px" },
    socialButtonsBlockButton: { border: "1px solid #e1d9c2", background: "#FAF8F0" },
    formButtonPrimary: { background: "#0F5A2B", borderRadius: "999px", height: "44px", fontWeight: 700 },
    formFieldInput: { border: "1px solid #ddd4bb", background: "#FAF8F0" },
    footerAction: { justifyContent: "center" },
    dividerLine: { background: "#e8e1cc" },
    alert: { background: "#fdf0e4", border: "1px solid #f3c79c" },
    otpCodeFieldInput: { border: "1px solid #ddd4bb" },
    formFieldRow: {},
    main: {},
  },
};

function AuthShell({ children, title, body }: { children: ReactNode; title: string; body: string }) {
  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-2" dir="rtl">
      <div className="hidden lg:flex relative overflow-hidden bg-primary text-primary-foreground p-12 flex-col justify-between">
        <img src={`${basePath}/images/hero.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />
        <div className="relative bg-background rounded-full p-1 w-fit"><Logo size={48} /></div>
        <div className="relative">
          <h1 className="font-display text-6xl leading-tight">{title}</h1>
          <p className="mt-3 text-lg text-primary-foreground/80 max-w-sm">{body}</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-10">{children}</div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthShell title="أهلاً بالمالك" body="ادخل لتعديل الأصناف والأسعار. صلاحية الإدارة يتحقق منها الخادم.">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} forceRedirectUrl={`${basePath}/admin`} />
    </AuthShell>
  );
}

function SignUpPage() {
  return (
    <AuthShell title="حساب جديد" body="إنشاء الحساب لا يمنح صلاحية الإدارة. الصلاحية لبريد المالك المعتمد فقط.">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} forceRedirectUrl={`${basePath}/admin`} />
    </AuthShell>
  );
}

function AdminRoute() {
  return (
    <>
      <Show when="signed-in"><AdminPage /></Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) qc.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        ...arSA,
        signIn: { ...arSA.signIn, start: { ...arSA.signIn?.start, title: "دخول المالك", subtitle: "سجّل الدخول لإدارة منيو شباتي وكرك" } },
        signUp: { ...arSA.signUp, start: { ...arSA.signUp?.start, title: "إنشاء حساب", subtitle: "حساب عادي، والصلاحية تُمنح من الخادم" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/" component={MenuPage} />
              <Route path="/admin" component={AdminRoute} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route component={NotFound} />
            </Switch>
          </RoutedErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
