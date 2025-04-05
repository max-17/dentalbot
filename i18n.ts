export type Lang = "uz" | "ru";

export const TEXTS: Record<
  Lang,
  {
    chosen_language: string;
    enter_full_name: string;
    enter_phone: string;
    main_menu: string;
    main_buttons: string[][];
    back: string;
    share_contact: string;
    help: string;
  }
> = {
  ru: {
    chosen_language: "Выбран язык:",
    enter_full_name: "Введите имя и фамилию:",
    enter_phone: "Введите или отправьте номер телефона:",
    main_menu: "Главное меню:",
    main_buttons: [
      ["🛍 Заказать", "🔥 Акция"],
      ["📦 Мои заказы", "⚙️ Настройки"],
      ["📍 Ближайший филиал"],
    ],
    back: "⬅️ Назад",
    share_contact: "📞 Отправить номер телефона",
    help: "Помощь",
  },
  uz: {
    chosen_language: "Tanlangan til:",
    enter_full_name: "Ismingiz va familiyangizni kiriting:",
    enter_phone: "Telefon raqamingizni kiriting yoki yuboring:",
    main_menu: "Asosiy menyu:",
    main_buttons: [
      ["🛍 Buyurtma berish", "🔥 Aksiya"],
      ["📦 Buyurtmalarim", "⚙️ Sozlamalar"],
      ["📍 Eng yaqin filial"],
    ],
    back: "⬅️ Orqaga",
    share_contact: "📞 Telefon raqamni yuborish",
    help: "Yordam",
  },
};
