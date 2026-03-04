import type { DiningCourt } from "../types";

export type Screen =
  | { kind: "locations" }
  | { kind: "menu"; court: DiningCourt }
  | { kind: "item"; court: DiningCourt; itemId: string; itemName: string }
  | { kind: "search" }
  | { kind: "searchItem"; itemId: string; itemName: string };

export interface Hint {
  key: string;
  label: string;
}
