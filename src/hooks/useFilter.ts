import { useState } from "react";
import { useAtom, useSetAtom, type WritableAtom } from "jotai";
import { filterActiveAtom } from "../lib/atoms.ts";

interface FilterState {
  query: string | null;
  inputActive: boolean;
  open: () => void;
  close: () => void;
  clear: () => void;
  cancel: () => void;
  setQuery: (q: string | null) => void;
}

export function useFilter(
  queryAtom: WritableAtom<string | null, [string | null], void>,
): FilterState {
  const [query, setQuery] = useAtom(queryAtom);
  const setFilterActive = useSetAtom(filterActiveAtom);
  const [inputActive, setInputActive] = useState(false);

  function open() {
    setInputActive(true);
    setFilterActive(true);
  }

  function close() {
    setInputActive(false);
    setFilterActive(false);
  }

  function clear() {
    setQuery(null);
  }

  function cancel() {
    setInputActive(false);
    setQuery(null);
    setFilterActive(false);
  }

  return { query, inputActive, open, close, clear, cancel, setQuery };
}
