const PALETTE = [
  "bg-indigo-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-teal-500",
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-base",
  lg: "h-20 w-20 text-2xl",
};

export default function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof SIZES }) {
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorFor(
        name
      )} ${SIZES[size]}`}
    >
      {initialsFor(name)}
    </div>
  );
}
