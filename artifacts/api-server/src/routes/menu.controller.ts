import { Body, Controller, Get, Post, Patch, Delete, Param, Query, Req, HttpCode, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import type { Request } from "express";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { db, categoriesTable, productsTable, settingsTable } from "@workspace/db";
import {
  CreateCategoryBody, UpdateCategoryBody, UpdateCategoryParams, DeleteCategoryParams,
  CreateProductBody, UpdateProductBody, UpdateProductParams, DeleteProductParams,
  ListProductsQueryParams, ListProductsResponse, ListCategoriesResponse,
  CreateProductResponse, UpdateProductResponse, CreateCategoryResponse, UpdateCategoryResponse,
  GetAdminStatusResponse, GetMenuSummaryResponse, GetStoreSettingsResponse, UpdateStoreSettingsBody,
} from "@workspace/api-zod";
import { adminStatus, requireAdmin } from "../lib/admin";
import { imageUrlIsSafe, parse } from "../lib/validation";

@Controller()
export class MenuController {
  @Get("healthz")
  health() { return { status: "ok", framework: "NestJS" }; }

  @Get("auth/me")
  async me(@Req() req: Request) {
    return GetAdminStatusResponse.parse(await adminStatus(req));
  }

  @Get("categories")
  async categories() {
    const rows = await db.select({
      id: categoriesTable.id, name: categoriesTable.name, nameEn: categoriesTable.nameEn,
      productCount: count(productsTable.id),
    }).from(categoriesTable).leftJoin(productsTable, eq(categoriesTable.id, productsTable.categoryId))
      .groupBy(categoriesTable.id).orderBy(asc(categoriesTable.id));
    return ListCategoriesResponse.parse(rows);
  }

  @Post("categories")
  async addCategory(@Req() req: Request, @Body() body: unknown) {
    await requireAdmin(req);
    const data = parse(CreateCategoryBody, body);
    if (!data.name.trim()) throw new BadRequestException("اسم القسم مطلوب");
    const [category] = await db.insert(categoriesTable).values({ ...data, name: data.name.trim() }).returning();
    return CreateCategoryResponse.parse({ ...category, productCount: 0 });
  }

  @Patch("categories/:id")
  async editCategory(@Req() req: Request, @Param() params: unknown, @Body() body: unknown) {
    await requireAdmin(req);
    const { id } = parse(UpdateCategoryParams, params);
    const data = parse(UpdateCategoryBody, body);
    if (!data.name.trim()) throw new BadRequestException("اسم القسم مطلوب");
    const [category] = await db.update(categoriesTable).set({ ...data, name: data.name.trim() }).where(eq(categoriesTable.id, id)).returning();
    if (!category) throw new NotFoundException("القسم غير موجود");
    const [totals] = await db.select({ value: count() }).from(productsTable).where(eq(productsTable.categoryId, id));
    return UpdateCategoryResponse.parse({ ...category, productCount: totals?.value ?? 0 });
  }

  @Delete("categories/:id")
  @HttpCode(204)
  async removeCategory(@Req() req: Request, @Param() params: unknown) {
    await requireAdmin(req);
    const { id } = parse(DeleteCategoryParams, params);
    const [totals] = await db.select({ value: count() }).from(productsTable).where(eq(productsTable.categoryId, id));
    if (totals && totals.value > 0) throw new ConflictException("انقل منتجات هذا القسم أو احذفها قبل حذف القسم");
    const [category] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning();
    if (!category) throw new NotFoundException("القسم غير موجود");
  }

  @Get("products")
  async products(@Query() query: Record<string, unknown>) {
    // z.coerce.boolean() treats \"false\" as true; normalize the wire format explicitly.
    if (query.featured !== undefined && !["true", "false"].includes(String(query.featured))) {
      throw new BadRequestException("قيمة التصفية غير صالحة");
    }
    const data = parse(ListProductsQueryParams, {
      ...query, ...(query.featured !== undefined ? { featured: query.featured === "true" || query.featured === true } : {}),
    });
    const filters = [];
    if (data.categoryId !== undefined) filters.push(eq(productsTable.categoryId, data.categoryId));
    if (data.featured !== undefined) filters.push(eq(productsTable.featured, data.featured));
    if (data.search?.trim()) {
      const term = `%${data.search.trim().replace(/[\\%_]/g, "\\$&")}%`;
      filters.push(or(ilike(productsTable.name, term), ilike(productsTable.nameEn, term), ilike(productsTable.description, term)));
    }
    const rows = await db.select().from(productsTable).where(and(...filters)).orderBy(asc(productsTable.id));
    return ListProductsResponse.parse(rows);
  }

  private async productData(schema: typeof CreateProductBody, body: unknown) {
    const data = parse(schema, body);
    if (!data.name.trim()) throw new BadRequestException("اسم المنتج مطلوب");
    if (!Number.isInteger(Math.round(data.price * 100)) || Math.abs(data.price * 100 - Math.round(data.price * 100)) > 0.00001) {
      throw new BadRequestException("السعر يقبل منزلتين عشريتين فقط");
    }
    if (!imageUrlIsSafe(data.imageUrl)) throw new BadRequestException("أدخل رابط صورة آمن يبدأ بـ https://");
    const [category] = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.id, data.categoryId));
    if (!category) throw new BadRequestException("القسم المختار غير موجود");
    return { ...data, name: data.name.trim() };
  }

  @Post("products")
  async addProduct(@Req() req: Request, @Body() body: unknown) {
    await requireAdmin(req);
    const data = await this.productData(CreateProductBody, body);
    const [product] = await db.insert(productsTable).values(data).returning();
    return CreateProductResponse.parse(product);
  }

  @Patch("products/:id")
  async editProduct(@Req() req: Request, @Param() params: unknown, @Body() body: unknown) {
    await requireAdmin(req);
    const { id } = parse(UpdateProductParams, params);
    const data = await this.productData(UpdateProductBody, body);
    const [product] = await db.update(productsTable).set(data).where(eq(productsTable.id, id)).returning();
    if (!product) throw new NotFoundException("المنتج غير موجود");
    return UpdateProductResponse.parse(product);
  }

  @Delete("products/:id")
  @HttpCode(204)
  async removeProduct(@Req() req: Request, @Param() params: unknown) {
    await requireAdmin(req);
    const { id } = parse(DeleteProductParams, params);
    const [product] = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();
    if (!product) throw new NotFoundException("المنتج غير موجود");
  }

  @Get("menu-summary")
  async summary() {
    const [products, categories] = await Promise.all([
      db.select({ available: productsTable.available, featured: productsTable.featured }).from(productsTable),
      db.select({ value: count() }).from(categoriesTable),
    ]);
    return GetMenuSummaryResponse.parse({
      totalProducts: products.length,
      availableProducts: products.filter((p) => p.available).length,
      totalCategories: categories[0]?.value ?? 0,
      featuredProducts: products.filter((p) => p.featured).length,
    });
  }

  @Get("settings")
  async settings() {
    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.id, 1));
    return GetStoreSettingsResponse.parse({ currency: settings?.currency ?? "ل.س" });
  }

  @Patch("settings")
  async editSettings(@Req() req: Request, @Body() body: unknown) {
    await requireAdmin(req);
    const data = parse(UpdateStoreSettingsBody, body);
    if (!data.currency.trim()) throw new BadRequestException("العملة مطلوبة");
    const [settings] = await db.insert(settingsTable).values({ id: 1, currency: data.currency.trim() })
      .onConflictDoUpdate({ target: settingsTable.id, set: { currency: data.currency.trim() } }).returning();
    return GetStoreSettingsResponse.parse(settings);
  }
}
