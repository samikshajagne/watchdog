export default function StatusBadge({
  status,
}: {
  status: "up" | "down" | null;
}) {
  const dotColor =
    status === "up" ? "#16A34A" : status === "down" ? "#DC2626" : "#9CA3AF";
  const label = status === "up" ? "Operational" : status === "down" ? "Down" : "Pending first check";

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
