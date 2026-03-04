import { useState, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { fetchSearchResults } from "../lib/api";
import { displayDate } from "../lib/date";
import {
  searchQueryAtom,
  favoriteItemsAtom,
  filterActiveAtom,
  selectItemAtom,
  goBackAtom,
  toggleFavoriteItemAtom,
} from "../lib/atoms.ts";
import { runEffect } from "../lib/effects.ts";
import { useVimNav } from "../hooks/useVimNav.ts";
import { CenteredMessage } from "./CenteredMessage.tsx";
import type { SearchResultEntry, AsyncState } from "../lib/types";

export function SearchResults() {
  const [query, setQuery] = useAtom(searchQueryAtom);
  const favoriteItems = useAtomValue(favoriteItemsAtom);
  const setFilterActive = useSetAtom(filterActiveAtom);
  const selectItem = useSetAtom(selectItemAtom);
  const goBack = useSetAtom(goBackAtom);
  const toggleItem = useSetAtom(toggleFavoriteItemAtom);

  const [inputActive, setInputActive] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [state, setState] = useState<AsyncState<SearchResultEntry[]>>({
    data: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    setFilterActive(inputActive);
    return () => setFilterActive(false);
  }, [inputActive]);

  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    runEffect(fetchSearchResults(debouncedQuery), setState);
  }, [debouncedQuery]);

  const { data: entries, error, loading } = state;
  const resultCount = entries?.length ?? 0;
  const nav = useVimNav(resultCount);

  useKeyboard((key) => {
    if (inputActive) {
      if (key.name === "escape") {
        goBack();
      }
      return;
    }

    if (nav.handleKey(key)) return;

    if (key.name === "escape") {
      setInputActive(true);
      return;
    }

    if (key.name === "/" || key.name === "s") {
      setInputActive(true);
      return;
    }

    if (key.name === "f" && entries) {
      const entry = entries[nav.selectedIndex];
      if (entry) toggleItem({ itemId: entry.item.itemId, displayName: entry.item.name });
      return;
    }

    if (key.name === "return" && entries) {
      const entry = entries[nav.selectedIndex];
      if (entry) selectItem({ itemId: entry.item.itemId, itemName: entry.item.name });
    }
  });

  const showResults = debouncedQuery.length > 0;

  function renderContent() {
    if (showResults && error) {
      return <CenteredMessage color="#FF6B6B">Error: {error}</CenteredMessage>;
    }
    if (showResults && loading) {
      return <CenteredMessage>Searching...</CenteredMessage>;
    }
    if (showResults && resultCount === 0 && entries) {
      return <CenteredMessage>No upcoming results for "{debouncedQuery}".</CenteredMessage>;
    }
    if (!showResults && !inputActive) {
      return <CenteredMessage>Press s or / to search</CenteredMessage>;
    }
    if (!entries) return null;

    return (
      <box flexDirection="column" flexGrow={1}>
        <box paddingX={1} height={1}>
          <text fg="#555555">
            {resultCount} item{resultCount !== 1 ? "s" : ""} with upcoming appearances
          </text>
        </box>

        <scrollbox flexGrow={1}>
          <box flexDirection="column" paddingX={1}>
            {entries.map((entry, i) => {
              const isSelected = !inputActive && i === nav.selectedIndex;
              const isFav = favoriteItems.has(entry.item.itemId);
              const label = `${isSelected ? " > " : " "}${entry.item.name}${isFav ? " [*]" : ""}`;
              return (
                <box key={entry.item.itemId} flexDirection="column" marginBottom={1}>
                  <text fg={isSelected ? "#CEB888" : "#555555"}>
                    {isSelected ? <strong>{label}</strong> : label}
                  </text>
                  {entry.upcoming.map((a, j) => {
                    const dateStr = displayDate(new Date(a.date));
                    return (
                      <text key={j} fg={isSelected ? "#AAAAAA" : "#888888"}>
                        {"    "}
                        {dateStr}
                        {"  "}
                        {a.locationName} · {a.mealName}
                      </text>
                    );
                  })}
                </box>
              );
            })}
          </box>
        </scrollbox>
      </box>
    );
  }

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexGrow={1}>{renderContent()}</box>

      {inputActive ? (
        <box height={1} paddingX={1} flexDirection="row">
          <text fg="#CEB888">Search: </text>
          <input
            flexGrow={1}
            focused
            value={query}
            placeholder="food items..."
            onInput={setQuery}
            onSubmit={() => {
              if (query.trim()) setInputActive(false);
            }}
          />
        </box>
      ) : null}
    </box>
  );
}
