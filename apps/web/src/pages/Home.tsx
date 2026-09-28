import { useState } from 'react';
import { api } from '../lib/api';
import { navigate } from '../lib/router';
import { Screen } from '../components/ui';

export function Home() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    try {
      const r = await api<{ hostToken: string }>('POST', '/api/sessions', { body: {} });
      navigate(`/host/${r.hostToken}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Screen>
      <div className="wordmark">MYSTERY NIGHT</div>
      <h1>
        ערב תעלומה עם
        <br />
        <span className="gold">סוכני AI בזמן אמת</span>
      </h1>
      <p>הדמויות מתקשרות, מקשיבות ומשקרות. הראיות מתגלות על הטלפון שלכם.</p>
      <div className="card stack">
        <h2>השוד של המאייר</h2>
        <p className="muted">קלף של 20 מיליון. 94 שניות של חושך. שני גנבים. · 6–9 משתתפים · כשעתיים וחצי</p>
        <button className="btn primary block" disabled={busy} onClick={create}>
          {busy ? 'יוצר…' : 'צרו ערב חדש'}
        </button>
        {error && <p className="gold">{error}</p>}
      </div>
    </Screen>
  );
}
