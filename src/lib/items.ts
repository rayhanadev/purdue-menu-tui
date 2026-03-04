import type { ItemOccurrence } from "./types";

const MAJOR_NUTRIENTS = new Set([
  "Calories",
  "Total Fat",
  "Saturated Fat",
  "Trans Fat",
  "Cholesterol",
  "Sodium",
  "Total Carbohydrate",
  "Dietary Fiber",
  "Total Sugars",
  "Protein",
]);

const SUB_NUTRIENTS = new Set(["Saturated Fat", "Trans Fat", "Dietary Fiber", "Total Sugars"]);

export function isMajorNutrient(name: string | null): boolean {
  return MAJOR_NUTRIENTS.has(name ?? "");
}

export function isSubNutrient(name: string | null): boolean {
  return SUB_NUTRIENTS.has(name ?? "");
}

export function getUpcomingAppearances(
  appearances: ItemOccurrence[],
  limit: number = 5,
): ItemOccurrence[] {
  const now = new Date();
  return appearances.filter((a) => new Date(a.date) >= now).slice(0, limit);
}
