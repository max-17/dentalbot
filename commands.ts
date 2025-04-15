import { InlineKeyboard } from "grammy";
import { MyContext } from "./types";
import { db } from "./lib/db";
import { openMenu } from "./menu";

// /start - if registration exists, skip to main menu; otherwise, start registration
export async function startCommand(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (userId) {
    const dbUser = await db.user.findUnique({
      where: { id: userId },
    });
    if (dbUser && dbUser.fullName && dbUser.phone) {
      // User already registered. Use session language if available, or default to "ru".
      ctx.session = {
        step: "done",
        __language_code: dbUser.language.toLocaleLowerCase() as "RU" | "UZ",
        fullName: dbUser.fullName,
        phone: dbUser.phone,
        address: dbUser.address || "",
        latitude: dbUser.latitude,
        longitude: dbUser.longitude,
      };
      await openMenu(ctx);
      return;
    }
  }
  // Start registration flow.
  ctx.session.step = "lang";
  const langKeyboard = new InlineKeyboard().text("UZ", "uz").text("RU", "ru");
  await ctx.reply("Select Language / Tilni tanlang / Выберите язык:", {
    reply_markup: langKeyboard,
  });
}
