import { Bot, Context, InlineKeyboard, Keyboard, session } from "grammy";
import { config } from "dotenv";
import { TEXTS, Lang } from "./i18n";
import { menu } from "./menu";
import { db } from "./lib/db";

config();

interface SessionData {
  step: "lang" | "fullname" | "contact" | "location" | "done";
  lang?: Lang;
  fullName?: string;
  phone?: string;
  location?: { latitude: number; longitude: number };
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

// Helper: Save (or update) user in DB using Prisma.
// Note: The User model stores fullName, phone and a related Location.
async function saveUser(userId: number, session: SessionData) {
  const existing = await db.user.findUnique({
    where: { id: userId },
    include: { location: true },
  });
  if (existing) {
    return await db.user.update({
      where: { id: userId },
      data: {
        fullName: session.fullName!,
        phone: session.phone!,
        // Use upsert to create/update nested Location, if location info is available.
        location: session.location
          ? {
              upsert: {
                create: {
                  latitude: session.location.latitude,
                  longitude: session.location.longitude,
                },
                update: {
                  latitude: session.location.latitude,
                  longitude: session.location.longitude,
                },
              },
            }
          : undefined,
      },
    });
  } else {
    return await db.user.create({
      data: {
        // We assume the Telegram user id is used as the primary key.
        id: userId,
        fullName: session.fullName!,
        phone: session.phone!,
        location: session.location
          ? {
              create: {
                latitude: session.location.latitude,
                longitude: session.location.longitude,
              },
            }
          : undefined,
      },
    });
  }
}

// /start - if registration exists, skip to main menu; otherwise, start registration
bot.command("start", async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      include: { location: true },
    });
    if (
      dbUser &&
      dbUser.fullName &&
      dbUser.phone &&
      dbUser.location &&
      dbUser.location.latitude !== null &&
      dbUser.location.longitude !== null
    ) {
      // User already registered. Use session language if available, or default to "ru".
      ctx.session = {
        step: "done",
        lang: ctx.session.lang || "ru",
        fullName: dbUser.fullName,
        phone: dbUser.phone,
        location: {
          latitude: dbUser.location.latitude!,
          longitude: dbUser.location.longitude!,
        },
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

  // If already registered (step === done), treat text input as menu navigation.
  if (step === "done") {
    const text = ctx.message.text;
    // Start from the root of the menu tree.
    let currentNode = menu[lang];
    for (const key of ctx.session.menuPath) {
      currentNode = (currentNode.submenus || {})[key];
    }
    // Handle back button only if menuPath is not empty.
    if (text === TEXTS[lang].back) {
      if (ctx.session.menuPath.length > 0) {
        ctx.session.menuPath.pop();
      } else {
        // Already at root; optionally, you can ignore or notify the user.
        await ctx.reply("Already at the main menu.");
      }
    } else if (currentNode.submenus && currentNode.submenus[text]) {
      // If the submenu exists, push the selection.
      ctx.session.menuPath.push(text);
    } else {
      // If user input doesn't match any submenu, we assume it's an action.
      await ctx.reply(`You selected: ${text}`);
      return;
    }
    // Build new keyboard (not inlineKeyboar) for the current submenu if there is an existing menu edit it
    let newMenuNode = menu[lang];
    for (const key of ctx.session.menuPath) {
      newMenuNode = (newMenuNode.submenus || {})[key];
    }
    const newKeyboardOptions = Object.keys(newMenuNode.submenus || {}).map(
      (key) => [key]
    );
    // Add back button if not at the root menu.
    if (ctx.session.menuPath.length > 0) {
      newKeyboardOptions.push([TEXTS[lang].back]);
    }
    // Send the updated menu.
    await ctx.reply(TEXTS[lang].main_menu, {
      reply_markup: {
        keyboard: newKeyboardOptions,
        resize_keyboard: true,
        one_time_keyboard: false, // Keep the keyboard persistent
      },
    });
    return;
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
    ctx.session.location = {
      latitude: ctx.message.location.latitude,
      longitude: ctx.message.location.longitude,
    };
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
    description: "Запуск бота",
  },
  {
    command: "help",
    description: "if you need help",
  },
]);

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.start();
