import { useEffect, useState } from 'react';

/** Minimal path router: /g/:token (guest), /tv/:token, /host/:token, /join/:code. */
export function App() {
  const [health, setHealth] = useState<string>('…');
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d: { ok: boolean }) => setHealth(d.ok ? 'השרת מחובר' : 'שגיאה'))
      .catch(() => setHealth('השרת לא זמין'));
  }, []);

  return (
    <main className="splash">
      <div className="wordmark">MYSTERY NIGHT</div>
      <p>{health}</p>
    </main>
  );
}
