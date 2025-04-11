import { Bot, Keyboard, session, webhookCallback } from "grammy";
import { config } from "dotenv";
import { TEXTS } from "../lib/i18n";
import {
  handleBackButton,
  handleCart,
  openMenu,
  showCategories,
  showDeliveryOptions,
  showProductDetails,
  showProducts,
  showSubcategories,
} from "../menu";
import { db, saveUser } from "../lib/db";
import { startCommand } from "../commands";
import {
  addToCart,
  cartClear,
  cartConfirm,
  cartDecrease,
  cartIncrease,
  cartRemove,
  decrease_,
  increase_,
  ru_uz,
} from "../callbackQueries";
import { MyContext, SessionData } from "../types";
config();

export const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);
export default webhookCallback(bot, "https");
// Initialize session
bot.use(
  session({
    initial: (): SessionData => ({ step: "lang" }),
  })
);

bot.command("start", startCommand);

// /main - open main menu
bot.command("main", async (ctx) => {
  await openMenu(ctx);
});

// Handle language selection (registration step: lang)
bot.callbackQuery(["uz", "ru"], ru_uz);

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
    await ctx.reply(TEXTS[lang].share_location, {
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

// Handle text messages for full name and menu navigation.
bot.on("message:text", async (ctx) => {
  const { step, lang } = ctx.session;

  const text = ctx.message.text;

  // Registration: full name
  if (step === "fullname" && lang) {
    ctx.session.fullName = text;
    ctx.session.step = "contact";
    const contactKeyboard = new Keyboard()
      .requestContact(TEXTS[lang].share_contact)
      .resized();
    await ctx.reply(TEXTS[lang].enter_phone, { reply_markup: contactKeyboard });
    return;
  }

  // Registration: location
  if (step === "location") {
    ctx.session.address = text;
    ctx.session.step = "done";
    if (ctx.from?.id) {
      await saveUser(ctx.from.id, ctx.session);
    }
    await openMenu(ctx);
    return;
  }

  // Menu navigation
  if (step === "done" && lang) {
    if (text === "🛍 Заказать") {
      await showDeliveryOptions(ctx);
      return;
    }

    if (
      ["Доставка", "Самовывоз", "Yetkazib berish", "Olib ketish"].includes(text)
    ) {
      await showCategories(ctx);
      return;
    }

    if (text === TEXTS[lang].back) {
      await handleBackButton(ctx);
      return;
    }

    if (text === "🛒 Корзина") {
      await handleCart(ctx);
      return;
    }

    if (ctx.session.currentLevel === "category") {
      const category = await db.category.findUnique({ where: { name: text } });
      if (category) {
        await showSubcategories(ctx, category.id);
      } else {
        await ctx.reply("Категория не найдена.");
      }
      return;
    }

    if (ctx.session.currentLevel === "subcategory") {
      const subcategory = await db.category.findUnique({
        where: { name: text },
      });
      if (subcategory) {
        await showProducts(ctx, subcategory.id);
      } else {
        await ctx.reply("Подкатегория не найдена.");
      }
      return;
    }

    if (ctx.session.currentLevel === "product") {
      await showProductDetails(ctx, text);
      return;
    }
  }
  await ctx.reply("перезапустить бота: /start");
});

bot.callbackQuery("cart_confirm", cartConfirm);

bot.callbackQuery(/^increase_(\d+)$/, increase_);

bot.callbackQuery(/^decrease_(\d+)$/, decrease_);

bot.callbackQuery(/^add_to_cart_(\d+)$/, addToCart);

bot.callbackQuery(/^cart_increase_(\d+)$/, cartIncrease);

bot.callbackQuery(/^cart_decrease_(\d+)$/, cartDecrease);

bot.callbackQuery(/^cart_remove_(\d+)$/, cartRemove);

bot.callbackQuery("cart_clear", cartClear);

bot.callbackQuery("cart_back", async (ctx) => {
  await handleBackButton(ctx); // Navigate back to the previous menu
});

bot.api.setMyCommands([
  {
    command: "start",
    description: "Запуск бота | Botni ishga tushirish",
  },
  {
    command: "main",
    description: "открыть главное меню | asosoy menuni ochish",
  },

  {
    command: "help",
    description: "Помощь | Yordam",
  },
]);

bot.catch((err) => {
  console.error("Bot error:", err);
});

// bot.start();
