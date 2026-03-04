interface FilterInputProps {
  query: string | null;
  placeholder: string;
  onInput: (value: string | null) => void;
  onSubmit: () => void;
}

export function FilterInput({ query, placeholder, onInput, onSubmit }: FilterInputProps) {
  return (
    <box height={1} paddingX={1} flexDirection="row">
      <text fg="#CEB888">Filter: </text>
      <input
        flexGrow={1}
        focused
        value={query ?? ""}
        placeholder={placeholder}
        onInput={(value: string) => onInput(value || null)}
        onSubmit={onSubmit}
      />
    </box>
  );
}
