import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { clerkClient, getAuth } from "@clerk/express";
import type { Request } from "express";

export function ownerEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

// Privileges are never granted to the first visitor or from client-editable metadata.
// Both identity and email ownership are verified by the authentication provider.
export async function adminStatus(req: Request) {
  const configured = ownerEmails().length > 0;
  const { userId } = getAuth(req);
  if (!userId) return { authenticated: false, isAdmin: false, configured };
  if (!configured) return { authenticated: true, isAdmin: false, configured };
  const user = await clerkClient.users.getUser(userId);
  const isAdmin = user.emailAddresses.some((address) =>
    address.verification?.status === "verified" && ownerEmails().includes(address.emailAddress.toLowerCase()),
  );
  return { authenticated: true, isAdmin, configured };
}

export async function requireAdmin(req: Request): Promise<void> {
  const status = await adminStatus(req);
  if (!status.authenticated) throw new UnauthorizedException("يرجى تسجيل الدخول أولاً");
  if (!status.isAdmin) throw new ForbiddenException("هذا الحساب لا يملك صلاحيات إدارة المنيو");
  const origin = req.headers.origin;
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = typeof forwardedHost === "string" ? forwardedHost.split(",")[0].trim() : req.headers.host;
  if (origin) {
    let originHost: string;
    try { originHost = new URL(origin).host; } catch { throw new ForbiddenException("مصدر الطلب غير صالح"); }
    if (originHost !== host) throw new ForbiddenException("لا يسمح بالتعديل من موقع آخر");
  }
}
