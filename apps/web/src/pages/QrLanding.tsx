import { useEffect, useState } from 'react';
import { api, guestToken } from '../lib/api';
import { Screen } from '../components/ui';

/** Printed stickers point here; the phone's camera opens it, and we scan on behalf of the saved player. */
export function QrLanding({ code }: { code: string }) {
  const token = guestToken.get();
  const [msg, setMsg] = useState('בודק…');
  useEffect(() => {
    if (!token) return setMsg('פתחו קודם את הקישור האישי שלכם מהמארח, ואז סרקו שוב.');
    api<{ clues: string[] }>('POST', '/api/guest/qr', { token, body: { code } }).then(
      (r) => setMsg(r.clues.length ? '🔍 מצאתם ראיה! היא כבר אצל כולם.' : 'הקוד הזה לא פותח כלום… עדיין.'),
      (e: Error) => setMsg(e.message),
    );
  }, [code, token]);
  return (
    <Screen>
      <div className="wordmark">MYSTERY NIGHT</div>
      <h1>{msg}</h1>
      {token && (
        <a className="btn primary" href={`/g/${token}`}>
          חזרה למשחק
        </a>
      )}
    </Screen>
  );
}
