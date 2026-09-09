export default function StatusBadge({
  status,
  hasOpenIssue = false,
}: {
  status: "up" | "down" | null;
  /** True if there's an unresolved SSL or broken-link incident, even though uptime itself is fine. */
  hasOpenIssue?: boolean;
}) {
  const dotColor =
    status === "down"
      ? "#DC2626"
      : status === "up"
        ? hasOpenIssue
          ? "#D97706"
          : "#16A34A"
        : "#9CA3AF";

  const label =
    status === "down"
      ? "Down"
      : status === "up"
        ? hasOpenIssue
          ? "Issues found"
          : "Operational"
        : "Pending first check";

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      {label}
    </span>
  );
}
