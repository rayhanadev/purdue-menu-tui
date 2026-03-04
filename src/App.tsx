import { useEffect, useRef } from "react";
import { useKeyboard, useRenderer } from "@opentui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { Effect } from "effect";
import { Header } from "./components/Header.tsx";
import { StatusBar } from "./components/StatusBar.tsx";
import { LocationList } from "./components/LocationList.tsx";
import { DiningCourtMenu } from "./components/DiningCourtMenu.tsx";
import { ItemDetail } from "./components/ItemDetail.tsx";
import { SearchResults } from "./components/SearchResults.tsx";
import { loadFavorites, saveFavorites } from "./lib/favorites";
import {
  screenAtom,
  dateAtom,
  filterActiveAtom,
  favoriteCourtsAtom,
  favoriteItemsAtom,
  goBackAtom,
  shiftDateAtom,
} from "./lib/atoms.ts";

export function App() {
  const renderer = useRenderer();
  const screen = useAtomValue(screenAtom);
  const filterActive = useAtomValue(filterActiveAtom);
  const courts = useAtomValue(favoriteCourtsAtom);
  const items = useAtomValue(favoriteItemsAtom);
  const setCourts = useSetAtom(favoriteCourtsAtom);
  const setItems = useSetAtom(favoriteItemsAtom);
  const goBack = useSetAtom(goBackAtom);
  const shiftDate = useSetAtom(shiftDateAtom);
  const setDate = useSetAtom(dateAtom);
  const loaded = useRef(false);

  useEffect(() => {
    Effect.runPromise(loadFavorites).then((data) => {
      setCourts(new Set(data.courts));
      setItems(new Map(Object.entries(data.items)));
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    Effect.runPromise(
      saveFavorites({
        courts: Array.from(courts),
        items: Object.fromEntries(items),
      }),
    );
  }, [courts, items]);

  function renderScreen() {
    switch (screen.kind) {
      case "locations":
        return <LocationList />;
      case "menu":
        return <DiningCourtMenu court={screen.court} />;
      case "search":
        return <SearchResults />;
      case "item":
      case "searchItem":
        return <ItemDetail itemId={screen.itemId} itemName={screen.itemName} />;
    }
  }

  useKeyboard((key) => {
    if (filterActive) return;

    if (key.name === "q" && screen.kind === "locations") {
      renderer.destroy();
      return;
    }

    if (key.name === "escape" && (screen.kind === "item" || screen.kind === "searchItem")) {
      goBack();
      return;
    }

    if (key.name === "," || key.name === "<" || (key.name === "left" && key.shift)) {
      shiftDate(-1);
    }
    if (key.name === "." || key.name === ">" || (key.name === "right" && key.shift)) {
      shiftDate(1);
    }

    if (key.name === "t" && screen.kind !== "locations") {
      setDate(new Date());
    }
  });

  return (
    <box flexDirection="column" width="100%" height="100%">
      <Header />

      <box flexGrow={1}>{renderScreen()}</box>

      {!filterActive && <StatusBar />}
    </box>
  );
}
