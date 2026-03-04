import { Match } from "effect";
import type { Screen, Hint } from "./types.ts";

export type { Screen, Hint } from "./types.ts";

export function buildBreadcrumbs(screen: Screen): string[] {
  return Match.value(screen).pipe(
    Match.when({ kind: "locations" }, () => []),
    Match.when({ kind: "menu" }, (s) => [s.court.formalName ?? s.court.name]),
    Match.when({ kind: "item" }, (s) => [s.court.formalName ?? s.court.name, s.itemName]),
    Match.when({ kind: "search" }, () => ["Search"]),
    Match.when({ kind: "searchItem" }, (s) => ["Search", s.itemName]),
    Match.exhaustive,
  );
}

export function buildHints(screen: Screen): Hint[] {
  return Match.value(screen).pipe(
    Match.when({ kind: "locations" }, () => [
      { key: "j/k", label: "Navigate" },
      { key: "Enter", label: "Open" },
      { key: "s", label: "Search" },
      { key: "f", label: "Favorite" },
      { key: "/", label: "Filter" },
      { key: "</>", label: "Date" },
      { key: "q", label: "Quit" },
    ]),
    Match.when({ kind: "menu" }, () => [
      { key: "j/k", label: "Items" },
      { key: "h/l", label: "Meals" },
      { key: "Enter", label: "Details" },
      { key: "f", label: "Favorite" },
      { key: "/", label: "Filter" },
      { key: "</>", label: "Date" },
      { key: "Esc", label: "Back" },
    ]),
    Match.when({ kind: "item" }, () => [
      { key: "j/k", label: "Scroll" },
      { key: "Esc", label: "Back" },
    ]),
    Match.when({ kind: "search" }, () => [
      { key: "j/k", label: "Navigate" },
      { key: "Enter", label: "Details" },
      { key: "f", label: "Favorite" },
      { key: "Esc", label: "Back" },
    ]),
    Match.when({ kind: "searchItem" }, () => [
      { key: "j/k", label: "Scroll" },
      { key: "Esc", label: "Back" },
    ]),
    Match.exhaustive,
  );
}
