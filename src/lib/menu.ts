import type { MealMenu, Station, ItemAppearance } from "./types";
import { MealStatus } from "./types/enums.ts";

export function findInitialMealIndex(meals: MealMenu[]): number {
  const now = Date.now();

  const currentIdx = meals.findIndex(
    (m) =>
      m.startTime &&
      m.endTime &&
      now >= new Date(m.startTime).getTime() &&
      now < new Date(m.endTime).getTime(),
  );
  if (currentIdx >= 0) return currentIdx;

  const upcomingIdx = meals.findIndex((m) => m.startTime && now < new Date(m.startTime).getTime());
  if (upcomingIdx >= 0) return upcomingIdx;

  const lastIdx = meals.findLastIndex((m) => m.status !== MealStatus.UNAVAILABLE);
  if (lastIdx >= 0) return lastIdx;

  return 0;
}

export function flattenStationItems(stations: Station[]): ItemAppearance[] {
  return stations.flatMap((s) => s.items);
}

export function filterStations(stations: Station[], query: string | null): Station[] {
  if (!query) return stations;
  const q = query.toLowerCase();
  return stations
    .map((station) => ({
      ...station,
      items: station.items.filter((ia) => itemDisplayName(ia).toLowerCase().includes(q)),
    }))
    .filter((station) => station.items.length > 0);
}

export function itemDisplayName(ia: ItemAppearance): string {
  return ia.displayName || ia.item.name;
}
