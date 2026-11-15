import { BadRequestException } from "@nestjs/common";
import type { ZodType, ZodTypeDef } from "zod";

export function parse<T>(schema: ZodType<T, ZodTypeDef, unknown>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new BadRequestException("البيانات غير صالحة، راجع الحقول المطلوبة");
  return result.data;
}

export function imageUrlIsSafe(value: string): boolean {
  if (!value) return true;
  if (value.startsWith("/images/") && !value.includes("..")) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}
