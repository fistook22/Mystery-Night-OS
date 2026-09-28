import { useEffect, useState } from 'react';
import type { PlayerType } from '@mn/shared';
import { api, guestToken } from '../lib/api';
import { navigate } from '../lib/router';
import { ErrorScreen, Loading, Screen } from '../components/ui';

const TYPES: { id: PlayerType; title: string; sub: string }[] = [
  { id: 'talker', title: '🎤 הנשמה של המסיבה', sub: 'מדבר/ת, משכנע/ת, בטבע של הבמה' },
  { id: 'detective', title: '🔍 הבלש/ית', sub: 'שם/ה לב לפרטים הקטנים' },
  { id: 'schemer', title: '🃏 המתכנן/ת', sub: 'אוהב/ת סודות ותחבולות' },
  { id: 'chill', title: '🍷 זורם/ת', sub: 'בא/ה ליהנות, בלי לחץ' },
];

interface JoinInfo {
  title: string;
  tagline: string;
  status: string;
  joined: number;
  maxPlayers: number;
}

export function Join({ code }: { code: string }) {
  const [info, setInfo] = useState<JoinInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<PlayerType | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<JoinInfo>('GET', `/api/join/${code}`).then(setInfo, (e: Error) => setError(e.message));
  }, [code]);

  async function join() {
    setBusy(true);
    try {
      const r = await api<{ token: string }>('POST', `/api/join/${code}`, {
        body: { name, playerType: type },
      });
      guestToken.set(r.token);
      navigate(`/g/${r.token}`, true);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (error && !info) return <ErrorScreen message={error} />;
  if (!info) return <Loading />;
  return (
    <Screen>
      <div className="wordmark">MYSTERY NIGHT</div>
      <h1>{info.title}</h1>
      <p>{info.tagline}</p>
      <div className="card stack" style={{ textAlign: 'start' }}>
        <label className="label" htmlFor="name">
          איך קוראים לך?
        </label>
        <input
          id="name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="השם שלך"
          maxLength={40}
          autoComplete="given-name"
        />
        <div className="label">איזה סוג שחקן/ית את/ה?</div>
        {TYPES.map((t) => (
          <button
            key={t.id}
            className={`card ${type === t.id ? 'evidence new' : ''}`}
            style={{ textAlign: 'start' }}
            onClick={() => setType(t.id)}
          >
            <h3>{t.title}</h3>
            <p className="muted">{t.sub}</p>
          </button>
        ))}
        <button className="btn primary block" disabled={!name.trim() || busy} onClick={join}>
          {busy ? 'מצטרף/ת…' : 'קבלו את הדמות שלי'}
        </button>
        {error && <p className="gold">{error}</p>}
        <p className="muted center">
          {info.joined}/{info.maxPlayers} הצטרפו
        </p>
      </div>
    </Screen>
  );
}
