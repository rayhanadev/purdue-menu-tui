import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { breadcrumbsAtom, dateAtom } from "../lib/atoms.ts";
import { displayDate } from "../lib/date";

export function Header() {
  const breadcrumbs = useAtomValue(breadcrumbsAtom);
  const date = useAtomValue(dateAtom);
  const path = breadcrumbs.join(" > ");

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <box flexDirection="row" justifyContent="space-between" paddingX={1} height={1}>
      <text fg="#CEB888">
        <strong>Purdue Menus</strong>
        {path ? <span fg="#888888"> │ {path}</span> : ""}
      </text>
      <text fg="#888888">
        {displayDate(date)} {time}
      </text>
    </box>
  );
}
