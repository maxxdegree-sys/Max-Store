export default function Loader({ fullScreen = false }) {
  const inner = (
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
      <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-brand-600 animate-ping2" />
    </div>
  );
  if (fullScreen) {
    return <div className="min-h-screen grid place-items-center bg-white dark:bg-ink-900">{inner}</div>;
  }
  return <div className="py-16 grid place-items-center">{inner}</div>;
}
