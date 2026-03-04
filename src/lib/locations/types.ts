import type { DiningCourt } from "../types";

export interface LocationEntry {
  court: DiningCourt;
  open: boolean;
  statusText: string;
}

export interface LocationGroup {
  name: string;
  entries: LocationEntry[];
}
