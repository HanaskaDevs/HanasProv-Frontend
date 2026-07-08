export default function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-brand-900/20 border-t-brand-900 ${className}`}
    />
  );
}
