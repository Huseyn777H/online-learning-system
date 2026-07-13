import { forwardRef } from "react";

const ErrorMessage = forwardRef<HTMLDivElement, { message: string | null }>(function ErrorMessage(
  { message },
  ref
) {
  if (!message) return null;
  return (
    <div
      ref={ref}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className="my-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 focus:outline-none"
    >
      {message}
    </div>
  );
});

export default ErrorMessage;
