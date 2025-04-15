import { Context, SessionFlavor } from "grammy";
import { Lang } from "./lib/i18n";
import { type I18nFlavor } from "@grammyjs/i18n";

export interface SessionData {
  step: "lang" | "fullname" | "contact" | "location" | "done";
  __language_code?: Lang;
  fullName?: string;
  phone?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  orderId?: number;
  currentLevel?:
    | "main"
    | "deliveryType"
    | "category"
    | "subcategory"
    | "settings"
    | "product";
  currentCategoryId?: number | null; // Tracks the current category or subcategory
  cart?: Record<number, number>; // Tracks the cart items and their quantities
}

export type MyContext = Context & {
  session: SessionData;
} & SessionFlavor<SessionData> &
  I18nFlavor;
