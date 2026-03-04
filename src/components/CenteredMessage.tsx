interface CenteredMessageProps {
  color?: string;
  children: string;
}

export function CenteredMessage({ color = "#888888", children }: CenteredMessageProps) {
  return (
    <box flexGrow={1} justifyContent="center" alignItems="center">
      <text fg={color}>{children}</text>
    </box>
  );
}
