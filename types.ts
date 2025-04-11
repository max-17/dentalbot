import { Context } from "grammy";
import { Lang } from "./i18n";

export interface SessionData {
  step: "lang" | "fullname" | "contact" | "location" | "done";
  lang?: Lang;
  fullName?: string;
  phone?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  currentLevel?:
    | "main"
    | "deliveryType"
    | "category"
    | "subcategory"
    | "product"
    | "cart";
  currentCategoryId?: number | null; // Tracks the current category or subcategory
  cart?: Record<number, number>; // Tracks the cart items and their quantities
}

export type MyContext = Context & { session: SessionData };
