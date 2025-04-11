import { db } from "./db";

const rawProducts = [
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE A1B", 53],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE A2B", 53],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE A3B", 53],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE A4B", 53],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE A3.5B", 53],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE B3B", 53],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE ESSENTIAL KIT", 340],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE BL", 53],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE WE", 53],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE NE", 53],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE TE", 53],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE YE", 53],
  ["Композиты", "Пастообразные", "ESTELITE ASTERIA SYRINGE OcE", 53],
  ["Композиты", "Пастообразные", "ESTELITE POSTERIOR Syringe PA1", 42],
  ["Композиты", "Пастообразные", "ESTELITE POSTERIOR Syringe PA2", 42],
  ["Композиты", "Пастообразные", "ESTELITE POSTERIOR Syringe PA3", 42],
  ["Композиты", "Пастообразные", "ESTELITE POSTERIOR Syringe PCE", 42],
  ["Композиты", "Пастообразные", "PALFIQUE ESTELITE PASTE Syringe A1", 22],
  ["Композиты", "Пастообразные", "PALFIQUE ESTELITE PASTE Syringe A2", 22],
  ["Композиты", "Пастообразные", "PALFIQUE ESTELITE PASTE Syringe A3", 22],
  ["Композиты", "Пастообразные", "PALFIQUE ESTELITE PASTE Syringe OA2", 22],
  ["Композиты", "Пастообразные", "PALFIQUE ESTELITE PASTE Syringe OA3", 22],
  ["Композиты", "Пастообразные", "PALFIQUE ESTELITE PASTE Syringe A3.5", 22],
  ["Композиты", "Пастообразные", "PALFIQUE ESTELITE PASTE Syringe InC", 22],
  ["Композиты", "Пастообразные", "PALFIQUE ESTELITE PASTE Syringe C2", 22],
  ["Композиты", "Пастообразные", "PALFIQUE ESTELITE PASTE Syringe B2", 22],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe A1", 35],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe A2", 35],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe A3", 35],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe A4", 35],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe BW", 35],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe A3.5", 35],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe WE", 35],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe OA1", 35],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe OA2", 35],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe OA3", 35],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe OPA2", 35],
  ["Композиты", "Пастообразные", "ESTELITE Σ QUICK Syringe CE (inc)", 35],
  [
    "Композиты",
    "Пастообразные",
    "ESTELITE Σ QUICK Syringe Promo Kit (3 шт)",
    98,
  ],
  [
    "Композиты",
    "Пастообразные",
    "ESTELITE Σ QUICK Syringe Promo Kit (6 шт)",
    200,
  ],
  ["Композиты", "Пастообразные", "Omnichroma", 41],
  ["Композиты", "Пастообразные", "Omnichroma Blocker", 41],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW SuperLow L-SYR A1", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW SuperLow L-SYR A2", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW SuperLow L-SYR A3", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW SuperLow L-SYR A3.5", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW High L-SYR A1", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW High L-SYR A2", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW High L-SYR A3", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW High L-SYR OPA2", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW High L-SYR OPA3", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW High L-SYR A3.5", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW Medium L-SYR A1", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW Medium L-SYR A2", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW Medium L-SYR A3", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW Medium L-SYR OPA2", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW Medium L-SYR OPA3", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW Medium L-SYR CE", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW Medium L-SYR BW", 39],
  ["Композиты", "Текучие", "ESTELITE UNIVERSAL FLOW Medium L-SYR A3.5", 39],
  ["Адгезивы", "штучне", "бонд форс (штучне)", 0],
  ["Адгезивы", "набор ", "бонд форс (набор )", 0],
  [
    "Расходные материалы",
    "Очки",
    "Очки защитные с маркировкой CLEAN+SAFE, Модель Прозрачные",
    8,
  ],
  [
    "Расходные материалы",
    "Очки",
    "Очки защитные с маркировкой CLEAN+SAFE, Модель Оранжевые",
    8,
  ],
  [
    "Расходные материалы",
    "Очки",
    "Очки защитные с маркировкой CLEAN+SAFE, Модель Темные",
    8,
  ],
  [
    "Расходные материалы",
    "Очки",
    "Очки защитные с маркировкой CLEAN+SAFE, Модель Темные 1",
    9,
  ],
  [
    "Расходные материалы",
    "Очки",
    "Очки защитные с маркировкой CLEAN+SAFE, Модель Темные 2",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, бирюзовый, LARGE III (Y) 70x135см",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, бирюзовый, MEDIUM II (Y) 70x100см",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, бирюзовый, SMALL I (Y) 70x75см",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, голубой, LARGE III (Y) 70x135см",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, голубой, MEDIUM II (Y) 70x100см",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, голубой, SMALL I (Y) 70x75см",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, зеленый, LARGE III (Y) 70x135см",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, зеленый, MEDIUM II (Y) 70x100см",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, лазурный, MEDIUM - II (У) 70x100см",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, сиреневый, LARGE III (Y) 70x135см",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, сиреневый, MEDIUM II (Y) 70x100см",
    9,
  ],
  [
    "Расходные материалы",
    "Фартуки",
    "Фартук защитный Clean+Safe, сиреневый, SMALL I (Y) 70x75см",
    9,
  ],
];

async function addProducts() {
  try {
    await db.$transaction(
      async (prisma) => {
        const productPromises = rawProducts.map(
          async ([
            categoryName,
            subcategoryName,
            productName,
            productPrice,
          ]) => {
            return prisma.product.create({
              data: {
                name: productName as string,
                price: productPrice as number,
                category: {
                  connectOrCreate: {
                    where: { name: subcategoryName as string },
                    create: {
                      name: subcategoryName as string,
                      parent: {
                        connectOrCreate: {
                          where: { name: categoryName as string },
                          create: {
                            name: categoryName as string,
                          },
                        },
                      },
                    },
                  },
                },
              },
            });
          }
        );

        await Promise.all(productPromises);
      },
      { timeout: 50000 } // Increase timeout to 20 seconds
    );
    console.log("Products added successfully");
  } catch (error) {
    console.error("Error adding products:", error);
  }
}

// addProducts()
//   .then(() => {
//     console.log("Products added successfully");
//   })
//   .catch((error) => {
//     console.error("Error adding products:", error);
//   });
