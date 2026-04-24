interface ErrorMessageProps {
  error: string | null;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error) return null;
  return (
    <div role="alert" className="mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      {error}
    </div>
  );
}
