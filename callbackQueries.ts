import { MyContext } from "./types";
import { db } from "./lib/db";
import { handleCart } from "./menu";
import { Lang } from "./lib/i18n";

export const cartRemove = async (ctx: MyContext) => {
  const orderItemId = Number(ctx.match![1]);

  // Remove the item from the cart
  await db.orderItem.delete({
    where: { id: orderItemId },
  });

  await ctx.answerCallbackQuery(ctx.t("item_removed_from_cart"));

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
  const orderId = ctx.session.orderId;
  if (!orderId) return await ctx.answerCallbackQuery(ctx.t("order_not_found"));

  // Confirm the order
  await db.order.updateMany({
    where: { userId, status: "PENDING" },
    data: { status: "CONFIRMED" },
  });

  await ctx.answerCallbackQuery(ctx.t("order_confirmed"));
  await ctx.editMessageText(ctx.t("order_confirmed_message"));

  // Send message to group
  const order = await db.order.findUnique({
    where: { userId, id: orderId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });
  if (order) {
    const userDetails = await db.user.findUnique({
      where: { id: userId },
    });
    const userName = ctx.from.username;
    const orderDetails = order.items.map((item) => {
      return `${item.product.name} - x${item.quantity} = ${
        item.product.price * item.quantity
      }  y.e`;
    });

    const total = order.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

    const message = `${ctx.t("new_order_from_user", {
      username: userName || ctx.t("not_specified"),
    })}:
    \n${ctx.t("name")}: ${userDetails?.fullName || ctx.t("not_specified")}
    \n${ctx.t("phone")}: ${userDetails?.phone || ctx.t("not_specified")}
    \n${ctx.t("address")}: ${userDetails?.address || ctx.t("not_specified")}
    \n${ctx.t("delivery")}: ${order.delivery}
    \n${orderDetails.join("\n")} \n${ctx.t("total")}: ${total}  y.e`;

    // Send location message to group
    const sentMessage = await ctx.api.sendMessage(-1002686064315, message);
    if (userDetails?.latitude && userDetails?.longitude) {
      await ctx.api.sendLocation(
        -1002686064315,
        userDetails.latitude,
        userDetails.longitude,
        { reply_to_message_id: sentMessage.message_id }
      );
    }
  }
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

  await ctx.answerCallbackQuery(ctx.t("cart_cleared"));

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
    await ctx.answerCallbackQuery(ctx.t("item_not_found"));
    return;
  }

  if (orderItem.quantity > 1) {
    // Decrease the quantity
    await db.orderItem.update({
      where: { id: orderItemId },
      data: { quantity: { decrement: 1 } },
    });
    await ctx.answerCallbackQuery(ctx.t("quantity_decreased"));
  } else {
    // Remove the item if quantity is 1
    await db.orderItem.delete({
      where: { id: orderItemId },
    });
    await ctx.answerCallbackQuery(ctx.t("item_removed_from_cart"));
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

  // Save the orderId to the session
  ctx.session.orderId = cart.id;

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

  await ctx.answerCallbackQuery(ctx.t("item_added_to_cart"));

  // Delete the product detail message
  await ctx.deleteMessage();

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

  await ctx.answerCallbackQuery(ctx.t("quantity_increased"));

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

  await ctx.answerCallbackQuery(ctx.t("quantity_decreased"));
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
            text: ctx.t("add_to_cart"),
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

  await ctx.answerCallbackQuery(ctx.t("quantity_increased"));

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
            text: ctx.t("add_to_cart"),
            callback_data: `add_to_cart_${productId}`,
          },
        ],
      ],
    },
  });
};

export const ru_uz = async (ctx: MyContext) => {
  const lang = ctx.callbackQuery?.data as Lang;
  if (!lang) return;
  ctx.session.__language_code = lang;
  await db.user.update({
    where: { id: ctx.from?.id },
    data: { language: lang },
  });
  await ctx.answerCallbackQuery(ctx.t("chosen_language") + ` ${lang}`);
  //delete message with reply_markup
  await ctx.deleteMessage();
  await ctx.reply(ctx.t("language_changed"));
  if (ctx.session.step === "lang") {
    ctx.session.step = "fullname";
    await ctx.reply(ctx.t("enter_full_name"));
  }
};
