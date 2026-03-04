import { useAtomValue } from "jotai";
import { hintsAtom } from "../lib/atoms.ts";

export function StatusBar() {
  const hints = useAtomValue(hintsAtom);

  return (
    <box flexDirection="row" height={1} paddingX={1} gap={2}>
      {hints.map(({ key, label }) => (
        <text key={key} fg="#888888">
          <span fg="#CEB888">
            <strong>{key}</strong>
          </span>{" "}
          {label}
        </text>
      ))}
    </box>
  );
}
