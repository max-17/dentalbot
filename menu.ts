import { Product } from "@prisma/client";
import { Category } from "@prisma/client";
import { Order } from "@prisma/client";
import { OrderItem } from "@prisma/client";

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
