import { MyContext } from "./types";
import { db } from "./lib/db";
import { Lang } from "./lib/i18n";

export interface MenuNode {
  text: string; // Menu item label
  submenus?: { [key: string]: MenuNode }; // Optional submenus
}

export const menu: { [lang: string]: MenuNode } = {
  ru: {
    text: "Главное меню",
    submenus: {
      "🛍️ Заказать": {
        text: "🛍️ Заказать",
        submenus: {
          Доставка: {
            text: "Доставка",

            //submenus: {'categoryname': {text: 'categoryname', submenus: {'subcategoryname': {text: 'subcategoryname',}}
            // submenus: async () =>
            //   (await db.category.findMany({ where: { parentId: null } })).map(
            //     (category) => ({ text: category.name })
            //   ),
          },
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
      "📍 наш адрес": { text: "📍 наш адрес" },
    },
  },
  uz: {
    text: "Asosiy menyu",
    submenus: {
      "Buyurtma berish": {
        text: "Buyurtma berish",
        submenus: {
          "Yetkazib berish": { text: "Yetkazib berish" },
          "Olib ketish": { text: "Olib ketish" },
        },
      },
      Buyurtmalarim: { text: "Buyurtmalarim" },
      Sozlamalar: {
        text: "Sozlamalar",
        submenus: {
          Yordam: { text: "Yordam" },
          "Tilni o'zgartirish": { text: "Tilni o'zgartirish" },
          "Telefonni o'zgartirish": { text: "Telefonni o'zgartirish" },
          "Manzilni o'zgartirish": { text: "Manzilni o'zgartirish" },
        },
      },
      "Eng yaqin filial": { text: "Eng yaqin filial" },
    },
  },
};

export async function openMenu(ctx: MyContext) {
  const lang = ctx.session.__language_code as Lang;

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
      keyboardOptions.push([ctx.t("menu_cart")]); // Add "menu_cart" button if cart exists
    }
  }

  await ctx.reply(ctx.t("main_menu"), {
    reply_markup: {
      keyboard: keyboardOptions,
      resize_keyboard: true,
      one_time_keyboard: false, // Keep the keyboard persistent
    },
  });
}

export async function showDeliveryOptions(ctx: MyContext) {
  const deliveryOptions = [
    [ctx.t("back")], // Add a back button
    [ctx.t("delivery")],
    [ctx.t("pickup")],
  ];

  ctx.session.currentLevel = "deliveryType";

  await ctx.reply(ctx.t("choose_delivery_method"), {
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
  categoryButtons.unshift([ctx.t("back"), ctx.t("menu_cart")]); // Add a back button

  ctx.session.currentLevel = "category";
  ctx.session.currentCategoryId = null; // Reset to top-level categories

  await ctx.reply(ctx.t("choose_category"), {
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
    await ctx.reply(ctx.t("no_subcategories"));
    return;
  }

  const subcategoryButtons = subcategories.map((sub) => [sub.name]);
  subcategoryButtons.unshift([ctx.t("back"), ctx.t("menu_cart")]); // Add a back button

  ctx.session.currentLevel = "subcategory";

  await ctx.reply(ctx.t("choose_subcategory"), {
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
    productButtons.unshift([ctx.t("back"), ctx.t("menu_cart")]); // Add a back button

    ctx.session.currentLevel = "product";

    await ctx.reply(ctx.t("choose_product"), {
      reply_markup: {
        keyboard: productButtons,
        resize_keyboard: true,
      },
    });
  } else {
    await ctx.reply(ctx.t("no_products_available"));
  }
}

export async function showProductDetails(ctx: MyContext, productName: string) {
  const product = await db.product.findUnique({
    where: { name: productName },
  });

  if (!product) {
    await ctx.reply(ctx.t("product_not_found"));
    return;
  }

  const productDetails = `
${ctx.t("product")}: ${product.name}
${ctx.t("price")}: ${product.price} y.e
${product.description ? `${ctx.t("description")}: ${product.description}` : ""}
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
              text: ctx.t("add_to_cart"),
              callback_data: `add_to_cart_${product.id}`,
            },
          ],
        ],
      },
    }
  );
}

export async function handleBackButton(ctx: MyContext) {
  // cart/product -> subcategory
  switch (ctx.session.currentLevel) {
    case "product": {
      const subCategory = await db.category.findUnique({
        where: { id: ctx.session.currentCategoryId! },
      });
      ctx.session.currentLevel = "subcategory";
      ctx.session.currentCategoryId = subCategory?.parentId!; // Reset to parent category
      await showSubcategories(ctx, subCategory?.parentId!);
      break;
    }
    case "subcategory": {
      ctx.session.currentLevel = "category";
      ctx.session.currentCategoryId = null; // Reset to top-level categories
      await showCategories(ctx);
      break;
    }
    case "category": {
      ctx.session.currentLevel = "deliveryType";
      await showDeliveryOptions(ctx);
      break;
    }
    case "deliveryType": {
      ctx.session.currentLevel = "main";
      await openMenu(ctx);
      break;
    }
    default:
      break;
  }
}

export async function handleCart(ctx: MyContext, sendReply: boolean = true) {
  const userId = ctx.from?.id;
  if (!userId) {
    if (sendReply) {
      await ctx.reply(ctx.t("cart_empty"));
    }
    return { text: ctx.t("cart_empty"), inlineKeyboard: [] };
  }

  // Fetch the user's active cart
  const cart = await db.order.findFirst({
    where: { userId, status: "PENDING" },
    include: { items: { include: { product: true }, orderBy: { id: "desc" } } },
  });

  if (!cart || cart.items.length === 0) {
    const emptyCartResponse = {
      text: ctx.t("cart_empty"),
      inlineKeyboard: [],
    };
    if (sendReply) {
      await ctx.reply(emptyCartResponse.text, {
        reply_markup: {
          keyboard: [[ctx.t("back")]],
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
        } y.e`
    )
    .join("\n");

  const total = cart.items.reduce(
    (sum, item) => sum + item.quantity * Number(item.product.price),
    0
  );

  const inlineKeyboard = [
    [{ text: ctx.t("confirm_order"), callback_data: "cart_confirm" }],
    [{ text: ctx.t("clear_cart"), callback_data: "cart_clear" }],
    ...cart.items.map((item) => [
      { text: "➖", callback_data: `cart_decrease_${item.id}` },
      { text: `${item.product.name}`, callback_data: `cart_item_${item.id}` },
      { text: "➕", callback_data: `cart_increase_${item.id}` },
    ]),
  ];

  const response = {
    text: `${ctx.t("menu_cart")}:\n\n${cartDetails}\n\n${ctx.t(
      "total"
    )}: ${total} y.e`,
    inlineKeyboard,
  };

  if (sendReply) {
    await ctx.reply(response.text, {
      reply_markup: {
        inline_keyboard: response.inlineKeyboard,
      },
    });
  }

  return response;
}
