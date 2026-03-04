import { atom } from "jotai";
import { shiftDate } from "./date";
import { buildBreadcrumbs, buildHints, type Screen } from "./navigation";
import type { DiningCourt } from "./types";

// --- Primitive atoms ---

export const screenAtom = atom<Screen>({ kind: "locations" });
export const dateAtom = atom<Date>(new Date());
export const filterActiveAtom = atom(false);
export const locationFilterQueryAtom = atom<string | null>(null);
export const menuFilterQueryAtom = atom<string | null>(null);
export const searchQueryAtom = atom("");
export const favoriteCourtsAtom = atom<Set<string>>(new Set());
export const favoriteItemsAtom = atom<Map<string, string>>(new Map());

// --- Derived atoms ---

export const breadcrumbsAtom = atom((get) => buildBreadcrumbs(get(screenAtom)));
export const hintsAtom = atom((get) => buildHints(get(screenAtom)));

// --- Action atoms ---

export const toggleFavoriteCourtAtom = atom(null, (get, set, courtName: string) => {
  const prev = get(favoriteCourtsAtom);
  const next = new Set(prev);
  if (next.has(courtName)) next.delete(courtName);
  else next.add(courtName);
  set(favoriteCourtsAtom, next);
});

export const toggleFavoriteItemAtom = atom(
  null,
  (get, set, { itemId, displayName }: { itemId: string; displayName: string }) => {
    const prev = get(favoriteItemsAtom);
    const next = new Map(prev);
    if (next.has(itemId)) next.delete(itemId);
    else next.set(itemId, displayName);
    set(favoriteItemsAtom, next);
  },
);

export const selectCourtAtom = atom(null, (_get, set, court: DiningCourt) => {
  set(menuFilterQueryAtom, null);
  set(screenAtom, { kind: "menu", court });
});

export const selectItemAtom = atom(
  null,
  (get, set, { itemId, itemName }: { itemId: string; itemName: string }) => {
    const screen = get(screenAtom);
    if (screen.kind === "menu") {
      set(screenAtom, { kind: "item", court: screen.court, itemId, itemName });
    } else if (screen.kind === "search") {
      set(screenAtom, { kind: "searchItem", itemId, itemName });
    }
  },
);

export const openSearchAtom = atom(null, (_get, set) => {
  set(searchQueryAtom, "");
  set(screenAtom, { kind: "search" });
});

export const goBackAtom = atom(null, (get, set) => {
  const screen = get(screenAtom);
  if (screen.kind === "item") {
    set(screenAtom, { kind: "menu", court: screen.court });
  } else if (screen.kind === "searchItem") {
    set(screenAtom, { kind: "search" });
  } else {
    set(screenAtom, { kind: "locations" });
  }
});

export const shiftDateAtom = atom(null, (get, set, days: number) => {
  set(dateAtom, shiftDate(get(dateAtom), days));
});
