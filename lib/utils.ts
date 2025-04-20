// 📦 Получение адреса по координатам (через Nominatim)
export async function getAddressFromCoords(
  lat: number,
  lon: number
): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "telegram-bot-demo/1.0",
    },
  });

  const data = (await response.json()) as any;

  return data.display_name || null;
}
