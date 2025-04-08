import { PrismaClient } from "@prisma/client";
import { SessionData } from "../bot";

export const db = new PrismaClient();

// Helper: Save (or update) user in DB using Prisma.
// Note: The User model stores fullName, phone and a related Location.
export async function saveUser(userId: number, session: SessionData) {
  const existing = await db.user.findUnique({
    where: { id: userId },
  });
  if (existing) {
    return await db.user.update({
      where: { id: userId },
      data: {
        fullName: session.fullName!,
        phone: session.phone!,
        address: session.address,
        longitude: session.longitude!,
        latitude: session.latitude!,
      },
    });
  } else {
    return await db.user.create({
      data: {
        // We assume the Telegram user id is used as the primary key.
        id: userId,
        fullName: session.fullName!,
        phone: session.phone!,
        address: session.address,
        longitude: session.longitude,
        latitude: session.latitude,
      },
    });
  }
}
