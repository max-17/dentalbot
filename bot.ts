import { Bot, Context, InlineKeyboard, Keyboard, session } from "grammy";
import { config } from "dotenv";
import { TEXTS, Lang } from "./i18n";
import { menu } from "./menu";
import { db, saveUser } from "./lib/db";
config();

export interface SessionData {
  step: "lang" | "fullname" | "contact" | "location" | "done";
  lang?: Lang;
  fullName?: string;
  phone?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  menuPath: string[];
}

type MyContext = Context & { session: SessionData };

const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

// Initialize session
bot.use(
  session({
    initial: (): SessionData => ({ step: "lang", menuPath: [] }),
  })
);

// Helper: Open main menu using the menu tree from menu.ts
async function openMenu(ctx: MyContext) {
  const lang = ctx.session.lang as Lang;

  ctx.session.menuPath = [];
  const mainMenuNode = menu[lang];
  const submenus = mainMenuNode.submenus || {};
  const keyboardOptions = Object.keys(submenus).map((key) => [key]);

  // Directly send the menu message with a persistent keyboard
  await ctx.reply(TEXTS[lang].main_menu, {
    reply_markup: {
      keyboard: keyboardOptions,
      resize_keyboard: true,
      one_time_keyboard: false, // Keep the keyboard persistent
    },
  });
}

// /start - if registration exists, skip to main menu; otherwise, start registration
bot.command("start", async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    const dbUser = await db.user.findUnique({
      where: { id: userId },
    });
    if (dbUser && dbUser.fullName && dbUser.phone) {
      // User already registered. Use session language if available, or default to "ru".
      ctx.session = {
        step: "done",
        lang: ctx.session.lang || "ru",
        fullName: dbUser.fullName,
        phone: dbUser.phone,
        address: dbUser.address || "",
        latitude: dbUser.latitude,
        longitude: dbUser.longitude,
        menuPath: [],
      };
      await openMenu(ctx);
      return;
    }
  }
  // Start registration flow.
  ctx.session.step = "lang";
  ctx.session.menuPath = [];
  const langKeyboard = new InlineKeyboard().text("UZ", "uz").text("RU", "ru");
  await ctx.reply("Select Language / Tilni tanlang / Выберите язык:", {
    reply_markup: langKeyboard,
  });
});

// Handle language selection (registration step: lang)
bot.callbackQuery(["uz", "ru"], async (ctx) => {
  if (ctx.session.step !== "lang") return;
  const lang = ctx.callbackQuery.data as Lang;
  ctx.session.lang = lang;
  ctx.session.step = "fullname";
  await ctx.answerCallbackQuery(
    `${TEXTS[lang].chosen_language} ${lang.toUpperCase()}`
  );
  await ctx.reply(TEXTS[lang].enter_full_name);
});

// Handle text messages for full name and menu navigation.
bot.on("message:text", async (ctx) => {
  const { step, lang } = ctx.session;
  if (!lang) return;

  // Registration: full name
  if (step === "fullname") {
    ctx.session.fullName = ctx.message.text;
    ctx.session.step = "contact";
    // Ask for phone using a reply keyboard that requests contact.
    const contactKeyboard = new Keyboard()
      .requestContact(TEXTS[lang].share_contact)
      .resized();
    await ctx.reply(TEXTS[lang].enter_phone, { reply_markup: contactKeyboard });
    return;
  }

  //handle location (adress) message for registration
  if (step === "location") {
    ctx.session.address = ctx.message.text;
    ctx.session.step = "done";
    // Save the registered user.
    if (ctx.from?.id) {
      await saveUser(ctx.from.id, ctx.session);
      await openMenu(ctx);
    }
    return;
  }

  // If already registered (step === done), treat text input as menu navigation.
  if (step === "done") {
    const text = ctx.message.text;

    // Start from the root of the menu tree.
    let currentNode = menu[lang];
    for (const key of ctx.session.menuPath) {
      if (!currentNode || !currentNode.submenus) {
        console.error("Invalid menu path:", ctx.session.menuPath);
        await ctx.reply(
          "Произошла ошибка в меню. Возвращаемся в главное меню."
        );
        await openMenu(ctx);
        return;
      }
      currentNode = currentNode.submenus[key];
    }

    // Handle "🛍 Заказать" -> Show categories
    if (text === "🛍 Заказать") {
      const categories = await db.category.findMany({
        where: { parentId: null }, // Fetch top-level categories
      });

      const categoryButtons = categories.map((category) => [category.name]);
      ctx.session.menuPath = ["🛍 Заказать"];
      await ctx.reply("Выберите категорию:", {
        reply_markup: {
          keyboard: [...categoryButtons, [TEXTS[lang].back]],
          resize_keyboard: true,
        },
      });
      return;
    }

    /// handle back button
    if (text === TEXTS[lang].back) {
      ctx.session.menuPath.pop();
      await openMenu(ctx);
      return;
    }

    // Handle category selection -> Show subcategories or products
    if (ctx.session.menuPath.includes("🛍 Заказать")) {
      const selectedCategory = await db.category.findUnique({
        where: { name: text },
        include: { subCategories: true, products: true },
      });

      if (!selectedCategory) {
        await ctx.reply("Категория не найдена.");
        return;
      }

      ctx.session.menuPath.push(text);

      if (selectedCategory.subCategories.length > 0) {
        // Show subcategories
        const subcategoryButtons = selectedCategory.subCategories.map((sub) => [
          sub.name,
        ]);
        await ctx.reply("Выберите подкатегорию:", {
          reply_markup: {
            keyboard: [...subcategoryButtons, [TEXTS[lang].back]],
            resize_keyboard: true,
          },
        });
      } else if (selectedCategory.products.length > 0) {
        // Show products
        const productButtons = selectedCategory.products.map((product) => [
          product.name,
        ]);
        await ctx.reply("Выберите продукт:", {
          reply_markup: {
            keyboard: [...productButtons, [TEXTS[lang].back]],
            resize_keyboard: true,
          },
        });
      } else {
        await ctx.reply("Нет доступных подкатегорий или продуктов.");
      }
      return;
    }

    // Handle product selection
    const selectedProduct = await db.product.findUnique({
      where: { name: text },
    });

    if (selectedProduct) {
      // Format the product details
      const productDetails = `
Продукт: ${selectedProduct.name}
Цена: ${selectedProduct.price}₽
${selectedProduct.description ? `Описание: ${selectedProduct.description}` : ""}
`;

      // Send the product details as a message
      await ctx.reply(productDetails, {
        reply_markup: {
          keyboard: [[TEXTS[lang].back]],
          resize_keyboard: true,
        },
      });
      return;
    }

    // Handle back button
    if (text === TEXTS[lang].back) {
      if (ctx.session.menuPath.length > 0) {
        ctx.session.menuPath.pop();
      }

      // Navigate back to the appropriate menu level
      currentNode = menu[lang];
      for (const key of ctx.session.menuPath) {
        currentNode = (currentNode.submenus || {})[key];
      }

      if (ctx.session.menuPath.includes("🛍 Заказать")) {
        const parentCategoryName =
          ctx.session.menuPath[ctx.session.menuPath.length - 1];
        const parentCategory = await db.category.findUnique({
          where: { name: parentCategoryName },
          include: { subCategories: true, products: true },
        });

        if (
          parentCategory?.subCategories &&
          parentCategory?.subCategories.length > 0
        ) {
          const subcategoryButtons = parentCategory.subCategories.map((sub) => [
            sub.name,
          ]);
          await ctx.reply("Выберите подкатегорию:", {
            reply_markup: {
              keyboard: [...subcategoryButtons, [TEXTS[lang].back]],
              resize_keyboard: true,
            },
          });
        } else if (
          parentCategory?.subCategories &&
          parentCategory?.subCategories.length > 0
        ) {
          const productButtons = parentCategory.products.map((product) => [
            product.name,
          ]);
          await ctx.reply("Выберите продукт:", {
            reply_markup: {
              keyboard: [...productButtons, [TEXTS[lang].back]],
              resize_keyboard: true,
            },
          });
        } else {
          await ctx.reply("Выберите категорию:", {
            reply_markup: {
              keyboard: [[TEXTS[lang].back]],
              resize_keyboard: true,
            },
          });
        }
      } else {
        // Return to the main menu
        await openMenu(ctx);
      }
      return;
    }

    // If input doesn't match any menu item, notify the user
    await ctx.reply("Пожалуйста, выберите пункт меню.");
  }
});

// Handle contact message for registration (phone)
bot.on("message:contact", async (ctx) => {
  const { step, lang } = ctx.session;
  if (!lang) return;
  if (step === "contact") {
    ctx.session.phone = ctx.message.contact.phone_number;
    ctx.session.step = "location";
    // Ask for location using a reply keyboard that requests location.
    const locationKeyboard = new Keyboard()
      .requestLocation("Share Location")
      .resized();
    await ctx.reply("Please share your location:", {
      reply_markup: locationKeyboard,
    });
    return;
  }
});

// Handle location message for registration.
bot.on("message:location", async (ctx) => {
  const { step, lang } = ctx.session;
  if (!lang) return;
  if (step === "location") {
    ctx.session.latitude = ctx.message.location.latitude;
    ctx.session.longitude = ctx.message.location.longitude;
    ctx.session.step = "done";
    // Save the registered user.
    if (ctx.from?.id) {
      await saveUser(ctx.from.id, ctx.session);
    }
    await openMenu(ctx);
    return;
  }
});

bot.api.setMyCommands([
  {
    command: "start",
    description: "Запуск бота | Botni ishga tushirish",
  },
  {
    command: "help",
    description: "Помощь | Yordam",
  },
]);

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.start();
