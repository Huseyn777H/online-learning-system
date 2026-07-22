function scorePassword(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const LEVELS = [
  { label: "Very weak", color: "bg-red-400" },
  { label: "Weak", color: "bg-orange-400" },
  { label: "Fair", color: "bg-amber-400" },
  { label: "Good", color: "bg-lime-500" },
  { label: "Strong", color: "bg-green-500" },
];

export default function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const score = scorePassword(password);
  const level = LEVELS[score];

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? level.color : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-500">{level.label}</p>
    </div>
  );
}
