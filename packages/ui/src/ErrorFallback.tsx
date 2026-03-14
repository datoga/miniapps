"use client";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

export function ErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  buttonLabel = "Try again",
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
        {description}
      </p>
      {process.env["NODE_ENV"] === "development" && (
        <pre className="mb-6 max-w-lg overflow-auto rounded bg-red-50 p-4 text-left text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
