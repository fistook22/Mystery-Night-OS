import { useEffect, useState } from 'react';
import type { HostView } from '@mn/shared';
import { api } from '../lib/api';
import { ErrorScreen, Loading, Qr } from '../components/ui';

export function Print({ token }: { token: string }) {
  const [v, setV] = useState<HostView | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<HostView>('GET', '/api/view', { token }).then(setV, (e: Error) => setError(e.message));
  }, [token]);
  if (error) return <ErrorScreen message={error} />;
  if (!v) return <Loading />;
  return (
    <div className="print">
      <div className="no-print" style={{ marginBottom: 20 }}>
        <h1>מדבקות להחבאה</h1>
        <p>
          הדפיסו, גזרו, והחביאו כל מדבקה במקום אחר בבית (מתחת לצלחת, בתוך ספר, מאחורי תמונה). האורחים סורקים
          אותן עם המצלמה.
        </p>
        <button className="btn primary" style={{ marginTop: 12 }} onClick={() => window.print()}>
          הדפסה
        </button>
      </div>
      <div className="sheet">
        {v.stickers.map((s) => (
          <div key={s.url} className="sticker">
            <Qr value={s.url} className="" />
            <b>MYSTERY NIGHT</b>
            <div>{s.label}</div>
            <div className="ltr" style={{ fontSize: 12 }}>
              {decodeURIComponent(s.url.split('/qr/')[1] ?? '')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
