import { count, sql } from "drizzle-orm";
import { db, pool, categoriesTable, productsTable, settingsTable } from "@workspace/db";
import { logger } from "./lib/logger";

async function seed() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(4829157)`);
    await tx.insert(settingsTable).values({ id: 1, currency: "ل.س" }).onConflictDoNothing();
    const [existing] = await tx.select({ value: count() }).from(categoriesTable);
    if (existing && existing.value > 0) {
      logger.info("Menu already initialized; existing products were preserved");
      return;
    }
    const categories = await tx.insert(categoriesTable).values([
      { name: "مشروبات", nameEn: "Drinks" },
      { name: "سندويشات صباحية", nameEn: "Breakfast Sandwiches" },
      { name: "سندويشات مسائية", nameEn: "Evening Sandwiches" },
    ]).returning();
    const drinks = categories[0]!.id;
    const breakfast = categories[1]!.id;
    const evening = categories[2]!.id;
    await tx.insert(productsTable).values([
      { name: "كرك الأصلي", nameEn: "Classic Karak", description: "شاي كرك على أصوله، بحليب كريمي ولمسة هيل عطرية.", price: 5, categoryId: drinks, imageUrl: "/images/karak.jpg", available: true, featured: true, badge: "اختيارنا لك" },
      { name: "كرك بالزعفران", nameEn: "Saffron Karak", description: "خلطة الكرك الدافئة مع خيوط الزعفران ونكهة غنية.", price: 7, categoryId: drinks, imageUrl: "/images/karak.jpg", available: true, featured: false, badge: "" },
      { name: "شاي بالحليب", nameEn: "Milk Tea", description: "شاي أسود محضّر مع الحليب، خفيف وموزون.", price: 4, categoryId: drinks, imageUrl: "/images/karak.jpg", available: true, featured: false, badge: "" },
      { name: "شباتي بيض وجبن", nameEn: "Egg & Cheese Chapati", description: "خبز شباتي طري، بيض ساخن وجبن ذائب لبداية لذيذة.", price: 10, categoryId: breakfast, imageUrl: "/images/breakfast.jpg", available: true, featured: true, badge: "صباحك ألذ" },
      { name: "شباتي جبن وعسل", nameEn: "Cheese & Honey Chapati", description: "جبن كريمي وعسل داخل شباتي طازج، حلو ومالح في لقمة.", price: 8, categoryId: breakfast, imageUrl: "/images/chapati.jpg", available: true, featured: true, badge: "" },
      { name: "شباتي لبنة وزعتر", nameEn: "Labneh & Zaatar Chapati", description: "لبنة ناعمة مع زعتر وزيت زيتون في خبز شباتي دافئ.", price: 8, categoryId: breakfast, imageUrl: "/images/chapati.jpg", available: true, featured: false, badge: "" },
      { name: "شباتي دجاج", nameEn: "Chicken Chapati", description: "قطع دجاج متبلة مع الخضار وصلصتنا الخاصة، ملفوفة بالشباتي.", price: 15, categoryId: evening, imageUrl: "/images/chicken.jpg", available: true, featured: true, badge: "جرّبها" },
      { name: "شباتي دجاج حار", nameEn: "Spicy Chicken Chapati", description: "دجاج بخلطة حارة مع الجبن والخضار لمحبي النكهة القوية.", price: 17, categoryId: evening, imageUrl: "/images/chicken.jpg", available: true, featured: false, badge: "حار" },
      { name: "شباتي خضار وجبن", nameEn: "Vegetable & Cheese Chapati", description: "تشكيلة خضار مع جبن ذائب، في شباتي محمّر بخفة.", price: 12, categoryId: evening, imageUrl: "/images/chapati.jpg", available: true, featured: false, badge: "" },
    ]);
    logger.info("Sample menu initialized. Replace the sample products and prices in the admin");
  });
}

seed().then(() => pool.end()).catch(async (err: unknown) => {
  logger.error({ err }, "Unable to initialize menu");
  await pool.end();
  process.exitCode = 1;
});
