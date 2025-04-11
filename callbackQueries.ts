import { MyContext } from "./types";
import { db } from "./lib/db";
import { handleCart } from "./menu";
import { Lang, TEXTS } from "./lib/i18n";

export const cartRemove = async (ctx: MyContext) => {
  const orderItemId = Number(ctx.match![1]);

  // Remove the item from the cart
  await db.orderItem.delete({
    where: { id: orderItemId },
  });

  await ctx.answerCallbackQuery("Товар удален из корзины.");

  // Get updated cart details
  const { text, inlineKeyboard } = await handleCart(ctx, false);

  // Edit the current message
  await ctx.editMessageText(text, {
    reply_markup: { inline_keyboard: inlineKeyboard },
  });
};

export const cartConfirm = async (ctx: MyContext) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Confirm the order
  await db.order.updateMany({
    where: { userId, status: "PENDING" },
    data: { status: "CONFIRMED" },
  });

  await ctx.answerCallbackQuery("Заказ подтвержден.");
  await ctx.editMessageText("Ваш заказ подтвержден. Спасибо за покупку!", {
    reply_markup: {
      inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "cart_back" }]],
    },
  });
};

export const cartClear = async (ctx: MyContext) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Clear all items in the user's cart
  const cart = await db.order.findFirst({
    where: { userId, status: "PENDING" },
  });

  if (cart) {
    await db.orderItem.deleteMany({
      where: { orderId: cart.id },
    });
  }

  await ctx.answerCallbackQuery("Корзина очищена.");

  // Get updated cart details
  const { text, inlineKeyboard } = await handleCart(ctx, false);

  // Edit the current message
  await ctx.editMessageText(text, {
    reply_markup: { inline_keyboard: inlineKeyboard },
  });
};

export const cartDecrease = async (ctx: MyContext) => {
  const orderItemId = Number(ctx.match![1]);

  // Fetch the current item
  const orderItem = await db.orderItem.findUnique({
    where: { id: orderItemId },
  });

  if (!orderItem) {
    await ctx.answerCallbackQuery("Товар не найден.");
    return;
  }

  if (orderItem.quantity > 1) {
    // Decrease the quantity
    await db.orderItem.update({
      where: { id: orderItemId },
      data: { quantity: { decrement: 1 } },
    });
    await ctx.answerCallbackQuery("Количество уменьшено.");
  } else {
    // Remove the item if quantity is 1
    await db.orderItem.delete({
      where: { id: orderItemId },
    });
    await ctx.answerCallbackQuery("Товар удален из корзины.");
  }

  // Get updated cart details
  const { text, inlineKeyboard } = await handleCart(ctx, false);

  // Edit the current message
  await ctx.editMessageText(text, {
    reply_markup: { inline_keyboard: inlineKeyboard },
  });
};

export const addToCart = async (ctx: MyContext) => {
  const productId = Number(ctx.match![1]);
  const userId = ctx.from?.id;

  if (!userId) return;

  // Get the quantity from the session
  const quantity = ctx.session.cart?.[productId] || 1;

  // Find or create the user's active cart
  let cart = await db.order.findFirst({
    where: { userId, status: "PENDING" },
  });

  if (!cart) {
    cart = await db.order.create({
      data: {
        userId,
        status: "PENDING",
        total: 0,
        delivery: "DELIVERY",
        deliveryAt: new Date(),
      },
    });
  }

  // Add the product to the cart
  const orderItem = await db.orderItem.findFirst({
    where: { orderId: cart.id, productId, order: { status: "PENDING" } },
  });

  if (orderItem) {
    await db.orderItem.update({
      where: { id: orderItem.id },
      data: { quantity: orderItem.quantity + quantity },
    });
  } else {
    await db.orderItem.create({
      data: {
        orderId: cart.id,
        productId,
        quantity,
      },
    });
  }

  await ctx.answerCallbackQuery("Товар добавлен в корзину.");

  // Delete the product detail message
  await ctx.deleteMessage();

  //remove cart messages from chat

  // Show the updated cart
  await handleCart(ctx);
};

export const cartIncrease = async (ctx: MyContext) => {
  const orderItemId = Number(ctx.match![1]);

  // Update the quantity in the database
  await db.orderItem.update({
    where: { id: orderItemId },
    data: { quantity: { increment: 1 } },
  });

  await ctx.answerCallbackQuery("Количество увеличено.");

  // Get updated cart details
  const { text, inlineKeyboard } = await handleCart(ctx, false);

  // Edit the current message
  await ctx.editMessageText(text, {
    reply_markup: { inline_keyboard: inlineKeyboard },
  });
};

export const decrease_ = async (ctx: MyContext) => {
  const productId = Number(ctx.match![1]);
  const userId = ctx.from?.id;

  if (!userId) return;

  // Update the quantity in the session
  ctx.session.cart = ctx.session.cart || {};
  ctx.session.cart[productId] = Math.max(
    (ctx.session.cart[productId] || 1) - 1,
    1
  );

  await ctx.answerCallbackQuery("Количество уменьшено.");
  await ctx.editMessageReplyMarkup({
    reply_markup: {
      inline_keyboard: [
        [
          { text: "➖", callback_data: `decrease_${productId}` },
          {
            text: `${ctx.session.cart[productId]}`,
            callback_data: `amount_${productId}`,
          },
          { text: "➕", callback_data: `increase_${productId}` },
        ],
        [
          {
            text: "Добавить в корзину",
            callback_data: `add_to_cart_${productId}`,
          },
        ],
      ],
    },
  });
};

export const increase_ = async (ctx: MyContext) => {
  const productId = Number(ctx.match![1]);
  const userId = ctx.from?.id;

  if (!userId) return;

  // Update the quantity in the session
  ctx.session.cart = ctx.session.cart || {};
  ctx.session.cart[productId] = (ctx.session.cart[productId] || 1) + 1;

  await ctx.answerCallbackQuery("Количество увеличено.");

  await ctx.editMessageReplyMarkup({
    reply_markup: {
      inline_keyboard: [
        [
          { text: "➖", callback_data: `decrease_${productId}` },
          {
            text: `${ctx.session.cart[productId]}`,
            callback_data: `amount_${productId}`,
          },
          { text: "➕", callback_data: `increase_${productId}` },
        ],
        [
          {
            text: "Добавить в корзину",
            callback_data: `add_to_cart_${productId}`,
          },
        ],
      ],
    },
  });
};

export const ru_uz = async (ctx: MyContext) => {
  if (ctx.session.step !== "lang") return;
  const lang = ctx.callbackQuery?.data as Lang;
  if (!lang) return;
  ctx.session.lang = lang;
  ctx.session.step = "fullname";
  await ctx.answerCallbackQuery(
    `${TEXTS[lang].chosen_language} ${lang.toUpperCase()}`
  );
  await ctx.reply(TEXTS[lang].enter_full_name);
};
