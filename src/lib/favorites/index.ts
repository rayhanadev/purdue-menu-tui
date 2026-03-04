import { Effect } from "effect";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { FavoritesData } from "./types.ts";

export type { FavoritesData } from "./types.ts";

function getConfigDir(): string {
  const home = homedir();
  if (process.platform === "darwin") {
    return join(home, "Library", "Preferences", "purdue-menu-tui");
  }
  if (process.platform === "win32") {
    return join(
      process.env.APPDATA ?? join(home, "AppData", "Roaming"),
      "purdue-menu-tui",
      "Config",
    );
  }
  return join(process.env.XDG_CONFIG_HOME ?? join(home, ".config"), "purdue-menu-tui");
}

function configPath(): string {
  return join(getConfigDir(), "favorites.json");
}

function parseFavorites(text: string): FavoritesData {
  const parsed = JSON.parse(text) as Partial<FavoritesData>;
  return {
    courts: Array.isArray(parsed.courts) ? parsed.courts : [],
    items: parsed.items && typeof parsed.items === "object" ? parsed.items : {},
  };
}

export const loadFavorites: Effect.Effect<FavoritesData> = Effect.tryPromise(() =>
  Bun.file(configPath()).text(),
).pipe(
  Effect.map(parseFavorites),
  Effect.orElseSucceed(() => ({ courts: [], items: {} })),
  Effect.withSpan("Favorites.load"),
);

export const saveFavorites = Effect.fn("Favorites.save")(function* (data: FavoritesData) {
  yield* Effect.tryPromise(() => mkdir(getConfigDir(), { recursive: true })).pipe(
    Effect.andThen(
      Effect.tryPromise(() => Bun.write(configPath(), JSON.stringify(data, null, 2) + "\n")),
    ),
    Effect.asVoid,
    Effect.orElse(() => Effect.void),
  );
});
