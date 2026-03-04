import { useState, useEffect, useMemo } from "react";
import { useKeyboard } from "@opentui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { Effect } from "effect";
import { fetchDiningCourtCategories, fetchUpcomingFavorites } from "../lib/api";
import { displayDate } from "../lib/date";
import {
  buildLocationGroups,
  filterLocationGroups,
  courtDisplayName,
  type LocationEntry,
} from "../lib/locations";
import {
  favoriteCourtsAtom,
  favoriteItemsAtom,
  locationFilterQueryAtom,
  selectCourtAtom,
  openSearchAtom,
  toggleFavoriteCourtAtom,
} from "../lib/atoms.ts";
import { runEffect } from "../lib/effects.ts";
import { useVimNav } from "../hooks/useVimNav.ts";
import { useFilter } from "../hooks/useFilter.ts";
import { FilterInput } from "./FilterInput.tsx";
import { CenteredMessage } from "./CenteredMessage.tsx";
import type { DiningCourtCategory, UpcomingFavoriteEntry, AsyncState } from "../lib/types";

export function LocationList() {
  const favoriteCourts = useAtomValue(favoriteCourtsAtom);
  const favoriteItems = useAtomValue(favoriteItemsAtom);
  const selectCourt = useSetAtom(selectCourtAtom);
  const openSearch = useSetAtom(openSearchAtom);
  const toggleCourt = useSetAtom(toggleFavoriteCourtAtom);

  const [catState, setCatState] = useState<AsyncState<DiningCourtCategory[]>>({
    data: null,
    error: null,
    loading: true,
  });
  useEffect(() => {
    runEffect(fetchDiningCourtCategories(), setCatState);
  }, []);

  const { data: categories, error, loading } = catState;

  const [upcomingFavorites, setUpcomingFavorites] = useState<UpcomingFavoriteEntry[]>([]);
  const filter = useFilter(locationFilterQueryAtom);

  const groups = useMemo(
    () => (categories ? buildLocationGroups(categories, favoriteCourts) : []),
    [categories, favoriteCourts],
  );

  const filteredGroups = useMemo(
    () => filterLocationGroups(groups, filter.query),
    [groups, filter.query],
  );

  const allEntries = useMemo(() => filteredGroups.flatMap((g) => g.entries), [filteredGroups]);

  const nav = useVimNav(allEntries.length);

  useEffect(() => {
    if (favoriteItems.size === 0) {
      setUpcomingFavorites([]);
      return;
    }
    Effect.runPromise(fetchUpcomingFavorites(favoriteItems))
      .then(setUpcomingFavorites)
      .catch(() => setUpcomingFavorites([]));
  }, [favoriteItems]);

  useKeyboard((key) => {
    if (filter.inputActive) {
      if (key.name === "escape") filter.cancel();
      return;
    }

    if (nav.handleKey(key)) return;

    if (key.name === "s") {
      openSearch();
      return;
    }

    if (key.name === "/") {
      filter.open();
      return;
    }

    if (key.name === "escape") {
      if (filter.query !== null) {
        filter.open();
        return;
      }
      return;
    }

    if (key.name === "f") {
      const entry = allEntries[nav.selectedIndex];
      if (entry) toggleCourt(entry.court.name);
      return;
    }

    if (key.name === "return") {
      const entry = allEntries[nav.selectedIndex];
      if (entry) selectCourt(entry.court);
    }
  });

  if (error) return <CenteredMessage color="#FF6B6B">Error: {error}</CenteredMessage>;
  if (loading) return <CenteredMessage>Loading dining locations...</CenteredMessage>;

  let flatIndex = 0;

  return (
    <box flexDirection="column" flexGrow={1}>
      {filter.query !== null && !filter.inputActive ? (
        <box paddingX={1} height={1}>
          <text fg="#888888">
            <span fg="#CEB888">Filter:</span> {filter.query} ({allEntries.length} match
            {allEntries.length !== 1 ? "es" : ""})
          </text>
        </box>
      ) : null}

      <scrollbox flexGrow={1}>
        <box flexDirection="column" paddingX={1}>
          {filteredGroups.map((group, gi) => (
            <box key={group.name} flexDirection="column" marginTop={gi === 0 ? 1 : 0}>
              <box>
                <text fg="#555555">
                  <strong>── {group.name} ──</strong>
                </text>
              </box>

              {group.entries.map((entry) => {
                const idx = flatIndex++;
                const isSelected = idx === nav.selectedIndex;
                return (
                  <LocationRow
                    key={`${group.name}-${entry.court.id}`}
                    entry={entry}
                    isSelected={isSelected}
                    isFav={favoriteCourts.has(entry.court.name)}
                  />
                );
              })}

              {gi < filteredGroups.length - 1 ? <box height={1} /> : null}
            </box>
          ))}

          {!filter.query && favoriteItems.size > 0 ? (
            <UpcomingFavoritesSection entries={upcomingFavorites} />
          ) : null}
        </box>
      </scrollbox>

      {filter.inputActive ? (
        <FilterInput
          query={filter.query}
          placeholder="filter locations..."
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

function LocationRow({
  entry,
  isSelected,
  isFav,
}: {
  entry: LocationEntry;
  isSelected: boolean;
  isFav: boolean;
}) {
  const name = courtDisplayName(entry.court);
  const prefix = isSelected ? " > " : " ";
  const suffix = `${isFav ? " [*]" : ""}${entry.open ? "" : " [x]"}`;
  let nameColor: string;
  if (isSelected) nameColor = "#CEB888";
  else if (entry.open) nameColor = "#555555";
  else nameColor = "#AAAAAA";
  const subColor = isSelected ? "#555555" : "#444444";
  const label = `${prefix}${name}${suffix}`;

  return (
    <box flexDirection="column" marginBottom={1}>
      <text fg={nameColor}>{isSelected ? <strong>{label}</strong> : label}</text>
      <text fg={subColor}>
        {"   "}
        {entry.statusText}
      </text>
    </box>
  );
}

function UpcomingFavoritesSection({ entries }: { entries: UpcomingFavoriteEntry[] }) {
  return (
    <box flexDirection="column" marginTop={1}>
      <box>
        <text fg="#555555">
          <strong>── Upcoming Favorites ──</strong>
        </text>
      </box>
      {entries.length === 0 ? (
        <box paddingLeft={1}>
          <text fg="#888888">No upcoming items.</text>
        </box>
      ) : (
        entries.map((entry, i) => {
          const dateStr = displayDate(new Date(entry.date));
          return (
            <box key={i} paddingLeft={1}>
              <text fg="#888888">
                {dateStr}
                {"  "}
                <span fg="#AAAAAA">{entry.itemName}</span>{" "}
                <span fg="#666666">
                  · {entry.locationName} · {entry.mealName}
                </span>
              </text>
            </box>
          );
        })
      )}
    </box>
  );
}
