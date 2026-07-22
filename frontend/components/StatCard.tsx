export default function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft transition hover:shadow-card">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 bg-brand-gradient bg-clip-text text-3xl font-extrabold text-transparent">{value}</p>
    </div>
  );
}
