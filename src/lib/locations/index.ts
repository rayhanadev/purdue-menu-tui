import type { DiningCourtCategory, DiningCourt } from "../types";
import { getMealStatus } from "../date";
import type { LocationEntry, LocationGroup } from "./types.ts";

export type { LocationEntry, LocationGroup } from "./types.ts";

const CATEGORY_ORDER = ["Dining Courts", "Quick Bites", "On-the-GO!"];

function formatStatusText(status: ReturnType<typeof getMealStatus>): string {
  if (status.open) return `Serving ${status.mealName} until ${status.timeLabel}`;
  if (status.mealName) return `Opens for ${status.mealName} at ${status.timeLabel}`;
  return "Closed";
}

function buildLocationEntry(court: DiningCourt): LocationEntry {
  const status = getMealStatus(court.upcomingMeals ?? []);
  return {
    court,
    open: status.open,
    statusText: formatStatusText(status),
  };
}

function sortOpenFirst(entries: LocationEntry[]): LocationEntry[] {
  return [...entries].sort((a, b) => (a.open === b.open ? 0 : a.open ? -1 : 1));
}

export function buildLocationGroups(
  categories: DiningCourtCategory[],
  favoriteCourts: Set<string>,
): LocationGroup[] {
  const catMap = new Map(categories.map((c) => [c.name, c]));
  const allCourts = new Map<string, DiningCourt>();
  for (const cat of categories) {
    for (const court of cat.diningCourts) {
      allCourts.set(court.name, court);
    }
  }

  const groups: LocationGroup[] = [];

  if (favoriteCourts.size > 0) {
    const favEntries: LocationEntry[] = [];
    for (const courtName of favoriteCourts) {
      const court = allCourts.get(courtName);
      if (court) favEntries.push(buildLocationEntry(court));
    }
    if (favEntries.length > 0) {
      groups.push({
        name: "\u2605 Favorites",
        entries: sortOpenFirst(favEntries),
      });
    }
  }

  for (const catName of CATEGORY_ORDER) {
    const cat = catMap.get(catName);
    if (!cat) continue;
    groups.push({
      name: catName,
      entries: sortOpenFirst(cat.diningCourts.map(buildLocationEntry)),
    });
  }

  return groups;
}

export function courtDisplayName(court: DiningCourt): string {
  return court.formalName ?? court.name;
}

export function filterLocationGroups(
  groups: LocationGroup[],
  query: string | null,
): LocationGroup[] {
  if (!query) return groups;
  const q = query.toLowerCase();
  return groups
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) =>
        courtDisplayName(entry.court).toLowerCase().includes(q),
      ),
    }))
    .filter((group) => group.entries.length > 0);
}
