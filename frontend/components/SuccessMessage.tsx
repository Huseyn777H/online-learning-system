export default function SuccessMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="my-3 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700"
    >
      {message}
    </div>
  );
}
