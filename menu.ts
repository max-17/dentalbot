import { Product } from "@prisma/client";
import { Category } from "@prisma/client";
import { Order } from "@prisma/client";
import { OrderItem } from "@prisma/client";
import { MyContext } from "./types";
import { db } from "./lib/db";
import { Lang, TEXTS } from "./lib/i18n";

export interface MenuNode {
  text: string; // Menu item label
  submenus?: { [key: string]: MenuNode }; // Optional submenus
}

export const menu: { [lang: string]: MenuNode } = {
  ru: {
    text: "Главное меню",
    submenus: {
      "🛍 Заказать": {
        text: "🛍 Заказать",
        submenus: {
          Доставка: { text: "Доставка" },
          Самовывоз: { text: "Самовывоз" },
        },
      },
      "📦 Мои заказы": { text: "📦 Мои заказы" },
      "⚙️ Настройки": {
        text: "⚙️ Настройки",
        submenus: {
          Помощь: { text: "Помощь" },
          "Сменить язык": { text: "Сменить язык" },
          "Сменить Телефон": { text: "Сменить Телефон" },
          "Сменить Адрес": { text: "Сменить Адрес" },
        },
      },
      "📍 Ближайший филиал": { text: "📍 Ближайший филиал" },
    },
  },
  uz: {
    text: "Asosiy menyu",
    submenus: {
      "🛍 Buyurtma berish": {
        text: "🛍 Buyurtma berish",
        submenus: {
          "Yetkazib berish": { text: "Yetkazib berish" },
          "Olib ketish": { text: "Olib ketish" },
        },
      },
      "📦 Buyurtmalarim": { text: "📦 Buyurtmalarim" },
      "⚙️ Sozlamalar": {
        text: "⚙️ Sozlamalar",
        submenus: {
          Yordam: { text: "Yordam" },
          "Tilni o'zgartirish": { text: "Tilni o'zgartirish" },
          "Telefonni o'zgartirish": { text: "Telefonni o'zgartirish" },
          "Manzilni o'zgartirish": { text: "Manzilni o'zgartirish" },
        },
      },
      "📍 Eng yaqin filial": { text: "📍 Eng yaqin filial" },
    },
  },
};

// Helper: Open main menu using the menu tree from menu.ts
export async function openMenu(ctx: MyContext) {
  const lang = ctx.session.lang as Lang;

  const mainMenuNode = menu[lang];
  const submenus = mainMenuNode.submenus || {};
  const keyboardOptions = Object.keys(submenus).map((key) => [key]);

  // Check if the user has an active cart
  const userId = ctx.from?.id;
  if (userId) {
    const cart = await db.order.findFirst({
      where: { userId, status: "PENDING" },
    });

    if (cart) {
      keyboardOptions.push(["🛒 Корзина"]); // Add "Cart" button if cart exists
    }
  }

  await ctx.reply(TEXTS[lang].main_menu, {
    reply_markup: {
      keyboard: keyboardOptions,
      resize_keyboard: true,
      one_time_keyboard: false, // Keep the keyboard persistent
    },
  });
}

export async function showDeliveryOptions(ctx: MyContext) {
  const lang = ctx.session.lang!;
  const deliveryOptions = [
    [TEXTS[lang].delivery],
    [TEXTS[lang].pickup],
    [TEXTS[lang].back], // Add a back button
  ];

  ctx.session.currentLevel = "deliveryType";

  await ctx.reply("Выберите способ получения:", {
    reply_markup: {
      keyboard: deliveryOptions,
      resize_keyboard: true,
    },
  });
}

export async function showCategories(ctx: MyContext) {
  const categories = await db.category.findMany({
    where: { parentId: null }, // Fetch top-level categories
  });

  const categoryButtons = categories.map((category) => [category.name]);
  categoryButtons.push([TEXTS[ctx.session.lang!].back]); // Add a back button

  ctx.session.currentLevel = "category";
  ctx.session.currentCategoryId = null; // Reset to top-level categories

  await ctx.reply("Выберите категорию:", {
    reply_markup: {
      keyboard: categoryButtons,
      resize_keyboard: true,
    },
  });
}
export async function showSubcategories(ctx: MyContext, parentId: number) {
  const subcategories = await db.category.findMany({
    where: { parentId },
  });

  if (subcategories.length === 0) {
    await ctx.reply("Нет доступных подкатегорий.");
    return;
  }

  const subcategoryButtons = subcategories.map((sub) => [sub.name]);
  subcategoryButtons.push([TEXTS[ctx.session.lang!].back]); // Add a back button

  ctx.session.currentLevel = "subcategory";

  await ctx.reply("Выберите подкатегорию:", {
    reply_markup: {
      keyboard: subcategoryButtons,
      resize_keyboard: true,
    },
  });
}

export async function showProducts(ctx: MyContext, subcategoryId: number) {
  const category = await db.category.findUnique({
    where: { id: subcategoryId },
    include: { products: true },
  });
  ctx.session.currentCategoryId = subcategoryId;

  if (category!.products.length > 0) {
    const productButtons = category!.products.map((product) => [product.name]);
    productButtons.push([TEXTS[ctx.session.lang!].back]); // Add a back button

    ctx.session.currentLevel = "product";

    await ctx.reply("Выберите продукт:", {
      reply_markup: {
        keyboard: productButtons,
        resize_keyboard: true,
      },
    });
  } else {
    await ctx.reply("Нет доступных подкатегорий или продуктов.");
  }
}

export async function showProductDetails(ctx: MyContext, productName: string) {
  const product = await db.product.findUnique({
    where: { name: productName },
  });

  if (!product) {
    await ctx.reply("Продукт не найден.");
    return;
  }

  const productDetails = `
Продукт: ${product.name}
Цена: ${product.price}₽
${product.description ? `Описание: ${product.description}` : ""}
`;

  await ctx.replyWithPhoto(
    product.imageUrl || "https://via.placeholder.com/300", // Use product image or placeholder
    {
      caption: productDetails,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "➖", callback_data: `decrease_${product.id}` },
            { text: "1", callback_data: `amount_${product.id}` }, // Default amount
            { text: "➕", callback_data: `increase_${product.id}` },
          ],
          [
            {
              text: "Добавить в корзину",
              callback_data: `add_to_cart_${product.id}`,
            },
          ],
        ],
      },
    }
  );
}

export async function handleBackButton(ctx: MyContext) {
  // product -> subcategory
  if (ctx.session.currentLevel === "product") {
    const subCategory = await db.category.findUnique({
      where: { id: ctx.session.currentCategoryId! },
    });
    ctx.session.currentLevel = "subcategory";
    ctx.session.currentCategoryId = subCategory?.parentId!; // Reset to parent category
    await showSubcategories(ctx, subCategory?.parentId!);
  }
  // subcategory -> category
  else if (ctx.session.currentLevel === "subcategory") {
    ctx.session.currentLevel = "category";
    ctx.session.currentCategoryId = null; // Reset to top-level categories
    await showCategories(ctx);
  }
  // category -> deliveryType
  else if (ctx.session.currentLevel === "category") {
    ctx.session.currentLevel = "deliveryType";
    await showDeliveryOptions(ctx);
  }
  // cart -> main menu
  else if (ctx.session.currentLevel === "cart") {
    ctx.session.currentLevel = "main";
    await openMenu(ctx);
  }
  // deliveryType -> main menu
  else if (ctx.session.currentLevel === "deliveryType") {
    ctx.session.currentLevel = "main";
    await openMenu(ctx);
  }
}

// export async function showCart(ctx: MyContext) {
//   const userId = ctx.from?.id;
//   if (!userId) return;

//   // Fetch the user's active cart
//   const cart = await db.order.findFirst({
//     where: { userId, status: "PENDING" },
//     include: { items: { include: { product: true } } },
//   });

//   if (!cart || cart.items.length === 0) {
//     await ctx.reply("Ваша корзина пуста.", {
//       reply_markup: {
//         keyboard: [[TEXTS[ctx.session.lang!].back]],
//         resize_keyboard: true,
//       },
//     });
//     return;
//   }

//   // Format the cart items
//   const cartDetails = cart.items
//     .map(
//       (item) =>
//         `${item.product.name} x ${item.quantity} = ${
//           item.quantity * Number(item.product.price)
//         }₽`
//     )
//     .join("\n");

//   const total = cart.items.reduce(
//     (sum, item) => sum + item.quantity * Number(item.product.price),
//     0
//   );

//   const inlineKeyboard = cart.items.map((item) => [
//     { text: "➖", callback_data: `cart_decrease_${item.id}` },
//     { text: item.product.name, callback_data: `cart_item_${item.id}` },
//     { text: "➕", callback_data: `cart_increase_${item.id}` },
//   ]);

//   inlineKeyboard.push(
//     [{ text: "Очистить", callback_data: "cart_clear" }],
//     [{ text: "⬅️ Назад", callback_data: "cart_back" }]
//   );

//   ctx.session.currentLevel = "cart"; // Set the current level to "cart"

//   await ctx.reply(`Корзина:\n\n${cartDetails}\n\nИтого: ${total}₽`, {
//     reply_markup: {
//       inline_keyboard: inlineKeyboard,
//     },
//   });
// }

// export async function getCartDetails(ctx: MyContext) {
//   const userId = ctx.from?.id;
//   if (!userId) return { text: "Ваша корзина пуста.", inlineKeyboard: [] };

//   // Fetch the user's active cart
//   const cart = await db.order.findFirst({
//     where: { userId, status: "PENDING" },
//     include: { items: { include: { product: true } } },
//   });

//   if (!cart || cart.items.length === 0) {
//     return { text: "Ваша корзина пуста.", inlineKeyboard: [] };
//   }

//   // Format the cart items
//   const cartDetails = cart.items
//     .map(
//       (item) =>
//         `${item.product.name} x ${item.quantity} = ${
//           item.quantity * Number(item.product.price)
//         }₽`
//     )
//     .join("\n");

//   const total = cart.items.reduce(
//     (sum, item) => sum + item.quantity * Number(item.product.price),
//     0
//   );

//   const inlineKeyboard = [
//     [{ text: "✅ Подтвердить заказ", callback_data: "cart_confirm" }],
//     [{ text: "🗑 Очистить корзину", callback_data: "cart_clear" }],
//     ...cart.items.map((item) => [
//       { text: "➖", callback_data: `cart_decrease_${item.id}` },
//       { text: `${item.product.name}`, callback_data: `cart_item_${item.id}` },
//       { text: "➕", callback_data: `cart_increase_${item.id}` },
//     ]),
//   ];

//   return {
//     text: `Корзина:\n\n${cartDetails}\n\nИтого: ${total}₽`,
//     inlineKeyboard,
//   };
// }

export async function handleCart(ctx: MyContext, sendReply: boolean = true) {
  const userId = ctx.from?.id;
  if (!userId) {
    if (sendReply) {
      await ctx.reply("Ваша корзина пуста.");
    }
    return { text: "Ваша корзина пуста.", inlineKeyboard: [] };
  }

  // Fetch the user's active cart
  const cart = await db.order.findFirst({
    where: { userId, status: "PENDING" },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    const emptyCartResponse = {
      text: "Ваша корзина пуста.",
      inlineKeyboard: [],
    };
    if (sendReply) {
      await ctx.reply(emptyCartResponse.text, {
        reply_markup: {
          keyboard: [[TEXTS[ctx.session.lang!].back]],
          resize_keyboard: true,
        },
      });
    }
    return emptyCartResponse;
  }

  // Format the cart items
  const cartDetails = cart.items
    .map(
      (item) =>
        `${item.product.name} x ${item.quantity} = ${
          item.quantity * Number(item.product.price)
        }₽`
    )
    .join("\n");

  const total = cart.items.reduce(
    (sum, item) => sum + item.quantity * Number(item.product.price),
    0
  );

  const inlineKeyboard = [
    [{ text: "✅ Подтвердить заказ", callback_data: "cart_confirm" }],
    [{ text: "🗑 Очистить корзину", callback_data: "cart_clear" }],
    ...cart.items.map((item) => [
      { text: "➖", callback_data: `cart_decrease_${item.id}` },
      { text: `${item.product.name}`, callback_data: `cart_item_${item.id}` },
      { text: "➕", callback_data: `cart_increase_${item.id}` },
    ]),
  ];

  const response = {
    text: `Корзина:\n\n${cartDetails}\n\nИтого: ${total}₽`,
    inlineKeyboard,
  };

  if (sendReply) {
    ctx.session.currentLevel = "cart"; // Set the current level to "cart"
    await ctx.reply(response.text, {
      reply_markup: {
        inline_keyboard: response.inlineKeyboard,
      },
    });
  }

  return response;
}
