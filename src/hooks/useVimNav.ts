import { useState, useRef } from "react";

interface KeyEvent {
  name: string;
  shift?: boolean;
}

interface VimNavResult {
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  handleKey: (key: KeyEvent) => boolean;
}

export function useVimNav(itemCount: number): VimNavResult {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const countRef = useRef("");

  function handleKey(key: KeyEvent): boolean {
    if (key.name >= "0" && key.name <= "9") {
      countRef.current += key.name;
      return true;
    }

    const count = Math.max(1, parseInt(countRef.current, 10) || 1);
    countRef.current = "";

    switch (key.name) {
      case "down":
      case "j":
        setSelectedIndex((i) => Math.min(itemCount - 1, i + count));
        return true;
      case "up":
      case "k":
        setSelectedIndex((i) => Math.max(0, i - count));
        return true;
      case "g":
        if (key.shift) {
          setSelectedIndex(Math.max(0, itemCount - 1));
        } else {
          setSelectedIndex(0);
        }
        return true;
      default:
        return false;
    }
  }

  return { selectedIndex, setSelectedIndex, handleKey };
}
