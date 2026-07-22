import Link from "next/link";

const PERKS = [
  "Learn at your own pace with lifetime access",
  "Track your progress on every course",
  "Earn certificates you can show off",
];

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 -my-8 flex min-h-[calc(100vh-57px)] sm:mx-0 sm:my-0">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-brand-gradient p-12 text-white lg:flex">
        <Link href="/" className="text-xl font-bold tracking-tight">
          OLS
        </Link>
        <div>
          <h2 className="mb-4 text-3xl font-bold leading-tight">Learn Without Limits</h2>
          <ul className="space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-sm text-white/90">
                <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-light">
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                {perk}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} Online Learning System</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8 text-center lg:text-left">
            <Link href="/" className="mb-6 inline-block text-lg font-bold text-primary lg:hidden">
              OLS
            </Link>
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
