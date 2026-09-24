export function SalesLineChart({
  points,
}: {
  points: { label: string; value: number }[];
}) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const width = 560;
  const height = 180;
  const padX = 18;
  const padY = 18;
  const step = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => {
    const x = padX + index * step;
    const y = height - padY - (point.value / max) * (height - padY * 2);
    return { x, y };
  });
  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
        <path d={path} fill="none" stroke="#FF5C4D" strokeWidth="3" strokeLinecap="round" />
        {coords.map((point, index) => (
          <circle key={points[index].label} cx={point.x} cy={point.y} r="4" fill="#FF5C4D" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] capitalize text-ink/40">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

export function HourlyBarChart({
  points,
}: {
  points: { label: string; value: number }[];
}) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="flex h-44 items-end gap-2">
      {points.map((point) => (
        <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-36 w-full items-end rounded-md bg-coral/10">
            <div
              className="w-full rounded-md bg-coral"
              style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-ink/40">{point.label.replace(" ", "")}</span>
        </div>
      ))}
    </div>
  );
}
