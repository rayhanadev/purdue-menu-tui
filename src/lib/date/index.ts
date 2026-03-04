import type { MealStatusSummary } from "./types.ts";

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function displayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getMealStatus(
  upcomingMeals: Array<{ name: string | null; startTime: string; endTime: string }>,
): MealStatusSummary {
  if (upcomingMeals.length === 0) {
    return { open: false, mealName: null, timeLabel: "" };
  }

  const now = Date.now();

  for (const meal of upcomingMeals) {
    const start = new Date(meal.startTime).getTime();
    const end = new Date(meal.endTime).getTime();
    if (now >= start && now < end) {
      return { open: true, mealName: meal.name, timeLabel: formatTime(meal.endTime) };
    }
  }

  for (const meal of upcomingMeals) {
    const start = new Date(meal.startTime).getTime();
    if (now < start) {
      return { open: false, mealName: meal.name, timeLabel: formatTime(meal.startTime) };
    }
  }

  return { open: false, mealName: null, timeLabel: "" };
}
