import { useState, useEffect, useMemo } from "react";
import { useKeyboard } from "@opentui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { fetchDiningCourtMenu } from "../lib/api";
import { formatDate, formatTime } from "../lib/date";
import {
  findInitialMealIndex,
  flattenStationItems,
  filterStations,
  itemDisplayName,
} from "../lib/menu.ts";
import {
  dateAtom,
  favoriteItemsAtom,
  menuFilterQueryAtom,
  selectItemAtom,
  goBackAtom,
  toggleFavoriteItemAtom,
} from "../lib/atoms.ts";
import { runEffect } from "../lib/effects.ts";
import { useVimNav } from "../hooks/useVimNav.ts";
import { useFilter } from "../hooks/useFilter.ts";
import { FilterInput } from "./FilterInput.tsx";
import { CenteredMessage } from "./CenteredMessage.tsx";
import { MealStatus } from "../lib/types/enums.ts";
import type { DiningCourt, MealMenu, AsyncState } from "../lib/types";

interface DiningCourtMenuProps {
  court: DiningCourt;
}

export function DiningCourtMenu({ court }: DiningCourtMenuProps) {
  const date = useAtomValue(dateAtom);
  const favoriteItems = useAtomValue(favoriteItemsAtom);
  const selectItem = useSetAtom(selectItemAtom);
  const goBack = useSetAtom(goBackAtom);
  const toggleItem = useSetAtom(toggleFavoriteItemAtom);

  const dateStr = formatDate(date);

  const [menuState, setMenuState] = useState<AsyncState<DiningCourt | null>>({
    data: null,
    error: null,
    loading: true,
  });
  useEffect(() => {
    runEffect(fetchDiningCourtMenu(court.name, dateStr), setMenuState);
  }, [court.name, dateStr]);

  const { data: menuData, error, loading } = menuState;

  const [mealIndex, setMealIndex] = useState(0);
  const filter = useFilter(menuFilterQueryAtom);

  const meals = menuData?.dailyMenu?.meals ?? [];
  const currentMeal: MealMenu | undefined = meals[mealIndex];
  const stations = currentMeal?.stations ?? [];

  const filteredStations = useMemo(
    () => filterStations(stations, filter.query),
    [stations, filter.query],
  );

  const flatItems = useMemo(() => flattenStationItems(filteredStations), [filteredStations]);

  const nav = useVimNav(flatItems.length);

  useEffect(() => {
    if (meals.length > 0) {
      setMealIndex(findInitialMealIndex(meals));
      nav.setSelectedIndex(0);
    }
  }, [menuData]);

  useKeyboard((key) => {
    if (filter.inputActive) {
      if (key.name === "escape") filter.cancel();
      return;
    }

    if (nav.handleKey(key)) return;

    if (key.name === "/") {
      filter.open();
      return;
    }

    if (key.name === "escape") {
      if (filter.query !== null) {
        filter.open();
        return;
      }
      goBack();
      return;
    }

    if (key.name === "h" || key.name === "left") {
      setMealIndex((i) => Math.max(0, i - 1));
      nav.setSelectedIndex(0);
      filter.clear();
      return;
    }
    if (key.name === "l" || key.name === "right") {
      setMealIndex((i) => Math.min(meals.length - 1, i + 1));
      nav.setSelectedIndex(0);
      filter.clear();
      return;
    }

    if (key.name === "f") {
      const item = flatItems[nav.selectedIndex];
      if (item) toggleItem({ itemId: item.item.itemId, displayName: itemDisplayName(item) });
      return;
    }

    if (key.name === "return") {
      const item = flatItems[nav.selectedIndex];
      if (item) selectItem({ itemId: item.item.itemId, itemName: itemDisplayName(item) });
    }
  });

  if (error) return <CenteredMessage color="#FF6B6B">Error: {error}</CenteredMessage>;
  if (loading)
    return <CenteredMessage>Loading menu for {court.formalName ?? court.name}...</CenteredMessage>;

  if (!menuData?.dailyMenu || meals.length === 0) {
    return <CenteredMessage>No menu available for this date.</CenteredMessage>;
  }

  let itemIdx = 0;
  const showFilterIndicator = filter.query !== null && !filter.inputActive;

  return (
    <box flexDirection="column" flexGrow={1}>
      <MealTabs meals={meals} selectedIndex={mealIndex} />

      {currentMeal?.notes ? (
        <box paddingX={1}>
          <text fg="#FFD700">{currentMeal.notes}</text>
        </box>
      ) : null}

      {showFilterIndicator ? (
        <box paddingX={1} height={1} marginTop={1}>
          <text fg="#888888">
            <span fg="#CEB888">Filter:</span> {filter.query} ({flatItems.length} match
            {flatItems.length !== 1 ? "es" : ""})
          </text>
        </box>
      ) : null}

      <scrollbox flexGrow={1}>
        <box flexDirection="column" paddingX={1} paddingTop={showFilterIndicator ? 0 : 1}>
          {filteredStations.map((station) => (
            <box key={station.id} flexDirection="column" marginBottom={1}>
              <box>
                <text fg="#555555">
                  <strong>── {station.name ?? "Station"} ──</strong>
                </text>
              </box>

              {station.items.map((ia) => {
                const idx = itemIdx++;
                const isSelected = idx === nav.selectedIndex;
                const name = itemDisplayName(ia);
                const isFav = favoriteItems.has(ia.item.itemId);
                const label = `${isSelected ? " > " : " "}${name}${isFav ? " [*]" : ""}`;

                return (
                  <text key={ia.id} fg={isSelected ? "#CEB888" : "#AAAAAA"}>
                    {isSelected ? <strong>{label}</strong> : label}
                  </text>
                );
              })}
            </box>
          ))}
        </box>
      </scrollbox>

      {filter.inputActive ? (
        <FilterInput
          query={filter.query}
          placeholder="filter items..."
          onInput={(value) => {
            filter.setQuery(value);
            nav.setSelectedIndex(0);
          }}
          onSubmit={filter.close}
        />
      ) : null}
    </box>
  );
}

function MealTabs({ meals, selectedIndex }: { meals: MealMenu[]; selectedIndex: number }) {
  return (
    <box flexDirection="row" gap={1} paddingX={1} height={1}>
      {meals.map((m, i) => {
        const isSelected = i === selectedIndex;
        const time =
          m.startTime && m.endTime ? ` ${formatTime(m.startTime)}-${formatTime(m.endTime)}` : "";
        let statusTag = "";
        if (m.status === MealStatus.CLOSED) {
          statusTag = " [Closed]";
        } else if (m.status === MealStatus.UNAVAILABLE) {
          statusTag = " [N/A]";
        }
        const label = ` ${m.name}${statusTag}${time} `;

        return (
          <text key={m.id} fg={isSelected ? "#CEB888" : "#555555"}>
            {isSelected ? <strong>{label}</strong> : label}
          </text>
        );
      })}
    </box>
  );
}
