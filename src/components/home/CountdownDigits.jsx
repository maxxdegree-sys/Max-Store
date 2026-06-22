import { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

function useCountdown(targetMs) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, targetMs - now);
  return {
    h: Math.floor(diff / 3.6e6),
    m: Math.floor((diff % 3.6e6) / 6e4),
    s: Math.floor((diff % 6e4) / 1e3)
  };
}

export default function CountdownDigits({ targetMs }) {
  const { h, m, s } = useCountdown(targetMs);
  return (
    <>
      {[pad(h), pad(m), pad(s)].map((v, i) => (
        <span key={i} className="rounded-lg bg-ink-900 text-white px-3 py-2 font-extrabold tabular-nums">{v}</span>
      ))}
    </>
  );
}
