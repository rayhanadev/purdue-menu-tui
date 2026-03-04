import { Effect, Schedule } from "effect";
import type { DiningCourtCategory, DiningCourt, Item, UpcomingFavoriteEntry } from "../types";
import { NetworkError, ParseError, ServerError, GraphQLError, TimeoutError } from "./errors.ts";

type ApiError = NetworkError | ParseError | ServerError | GraphQLError | TimeoutError;

const ENDPOINT = "https://api.hfs.purdue.edu/menus/v3/GraphQL";

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

function gql<T>(query: string, variables?: Record<string, unknown>): Effect.Effect<T, ApiError> {
  return Effect.gen(function* () {
    const res = yield* Effect.tryPromise({
      try: () =>
        fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables }),
        }),
      catch: () => new NetworkError({ message: "Network request failed" }),
    }).pipe(
      Effect.timeoutFail({
        duration: "10 seconds",
        onTimeout: () => new TimeoutError({ message: "Request timed out" }),
      }),
    );

    if (!res.ok) {
      return yield* Effect.fail(
        new ServerError({
          message: "Server returned an error",
          status: res.status,
          statusText: res.statusText,
        }),
      );
    }

    const json = yield* Effect.tryPromise({
      try: () => res.json() as Promise<GraphQLResponse<T>>,
      catch: () => new ParseError({ message: "Failed to parse response" }),
    });

    if (json.errors?.length) {
      return yield* Effect.fail(
        new GraphQLError({
          message: "GraphQL query failed",
          errors: json.errors,
        }),
      );
    }

    return json.data;
  }).pipe(Effect.withSpan("Api.gql"));
}

// ── Queries ──────────────────────────────────────────────────────────

const DINING_COURT_CATEGORIES_QUERY = `
  query DiningCourtCategories {
    diningCourtCategories {
      name
      diningCourts {
        id
        name
        formalName
        upcomingMeals {
          id
          name
          type
          startTime
          endTime
        }
      }
    }
  }
`;

export const fetchDiningCourtCategories = Effect.fn("Api.fetchDiningCourtCategories")(function* () {
  const data = yield* gql<{ diningCourtCategories: DiningCourtCategory[] }>(
    DINING_COURT_CATEGORIES_QUERY,
  );
  return data.diningCourtCategories;
});

const DINING_COURT_MENU_QUERY = `
  query DiningCourtMenu($name: String!, $date: Date!) {
    diningCourtByName(name: $name) {
      id
      name
      formalName
      dailyMenu(date: $date) {
        notes
        meals {
          id
          name
          status
          type
          startTime
          endTime
          notes
          stations {
            id
            name
            items {
              id
              itemMenuId
              displayName
              specialName
              hasComponents
              item {
                id
                itemId
                name
                traits {
                  id
                  name
                  type
                }
              }
              components {
                id
                displayName
                item {
                  id
                  itemId
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const fetchDiningCourtMenu = Effect.fn("Api.fetchDiningCourtMenu")(function* (
  name: string,
  date: string,
) {
  const data = yield* gql<{ diningCourtByName: DiningCourt | null }>(DINING_COURT_MENU_QUERY, {
    name,
    date,
  });
  return data.diningCourtByName;
});

const ITEM_DETAIL_QUERY = `
  query ItemDetail($itemId: Guid!) {
    itemByItemId(itemId: $itemId) {
      id
      itemId
      name
      ingredients
      nutritionFacts {
        name
        value
        label
        dailyValueLabel
      }
      traits {
        id
        name
        type
      }
      appearances {
        locationName
        date
        mealName
        stationName
      }
    }
  }
`;

export const fetchItemDetail = Effect.fn("Api.fetchItemDetail")(function* (itemId: string) {
  const data = yield* gql<{ itemByItemId: Item }>(ITEM_DETAIL_QUERY, {
    itemId,
  });
  return data.itemByItemId;
});

const ITEM_SEARCH_QUERY = `
  query ItemSearch($name: String!) {
    itemSearch(name: $name) {
      id
      itemId
      name
      appearances {
        locationName
        date
        mealName
        stationName
      }
    }
  }
`;

export const fetchItemSearch = Effect.fn("Api.fetchItemSearch")(function* (name: string) {
  const data = yield* gql<{ itemSearch: Item[] }>(ITEM_SEARCH_QUERY, { name });
  return data.itemSearch;
});

// ── Composed Queries ─────────────────────────────────────────────────

export const fetchSearchResults = Effect.fn("Api.fetchSearchResults")(function* (name: string) {
  const now = new Date();
  const items = yield* fetchItemSearch(name);
  return items
    .map((item) => ({
      item,
      upcoming: (item.appearances ?? []).filter((a) => new Date(a.date) >= now).slice(0, 5),
    }))
    .filter((entry) => entry.upcoming.length > 0);
});

function dedupeAndSort(entries: UpcomingFavoriteEntry[]): UpcomingFavoriteEntry[] {
  const seen = new Set<string>();
  return entries
    .filter((entry) => {
      const key = `${entry.date}|${entry.locationName}|${entry.mealName}|${entry.itemId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);
}

export const fetchUpcomingFavorites = Effect.fn("Api.fetchUpcomingFavorites")(function* (
  favoriteItems: Map<string, string>,
) {
  if (favoriteItems.size === 0) return [] as UpcomingFavoriteEntry[];

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + 14);

  const effects = Array.from(favoriteItems.entries()).map(([itemId, displayName]) =>
    fetchItemDetail(itemId).pipe(
      Effect.retry(Schedule.recurs(2)),
      Effect.map((item) =>
        (item.appearances ?? [])
          .filter((a) => {
            const d = new Date(a.date);
            return d >= now && d <= cutoff;
          })
          .map((a) => ({
            date: a.date,
            locationName: a.locationName,
            mealName: a.mealName,
            itemName: displayName,
            itemId,
          })),
      ),
      Effect.orElseSucceed(() => [] as UpcomingFavoriteEntry[]),
    ),
  );

  const results = yield* Effect.all(effects, { concurrency: "unbounded" });
  return dedupeAndSort(results.flat());
});
