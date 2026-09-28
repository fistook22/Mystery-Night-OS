import { useEffect, useState } from 'react';
import type { HostView } from '@mn/shared';
import { api } from '../lib/api';
import { useLive } from '../lib/live';
import { ErrorScreen, Loading, Qr, fmtClock } from '../components/ui';

export function Host({ token }: { token: string }) {
  const live = useLive<HostView>(token);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (live.error) return <ErrorScreen message={live.error} />;
  if (!live.view) return <Loading />;
  const v = live.view;
  const s = v.session;

  async function act(action: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ result: string | null }>('POST', `/api/host/${action}`, { token });
      if (action === 'hint')
        setMsg(r.result ? `נשלח רמז: ${r.result}` : 'אין כרגע רמז מתאים. השולחן בכיוון הנכון.');
      if (action === 'skip') setMsg(r.result ? `דילגנו אל: ${r.result}` : 'אין עוד שלבים.');
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const next = v.beats.find((b) => !b.fired);
  return (
    <div className="page stack">
      <div className="row">
        <div className="grow">
          <div className="wordmark" style={{ fontSize: 14 }}>
            MYSTERY NIGHT · מארח
          </div>
          <h1 style={{ fontSize: 26 }}>{s.title}</h1>
        </div>
        <span className={`dot ${live.connected ? '' : 'off'}`} />
      </div>
      {msg && <div className="card gold">{msg}</div>}

      {s.status === 'pregame' ? (
        <Pregame v={v} token={token} busy={busy} onStart={() => act('start')} />
      ) : (
        <>
          <div className="card center">
            <div className="host-clock">{fmtClock(s.elapsedMin)}</div>
            <p className="muted">
              {s.status === 'paused'
                ? '⏸ בהפסקה'
                : s.status === 'live'
                  ? 'הערב רץ'
                  : s.status === 'finale'
                    ? 'החשיפה'
                    : 'הערב הסתיים'}{' '}
              · מתוך {s.durationMin} דקות
            </p>
            {next && s.status === 'live' && (
              <p style={{ marginTop: 6 }}>
                הבא: <b>{next.label}</b> בעוד {Math.max(0, next.atMin - s.elapsedMin)} דק׳
              </p>
            )}
          </div>
          {(s.status === 'live' || s.status === 'paused') && (
            <div className="stack">
              <button
                className="btn primary block"
                disabled={busy}
                onClick={() => act(s.status === 'paused' ? 'resume' : 'pause')}
              >
                {s.status === 'paused' ? '▶ המשך' : '⏸ הפסקה לארוחה'}
              </button>
              <div className="row">
                <button
                  className="btn grow"
                  disabled={busy || s.status !== 'live'}
                  onClick={() => act('hint')}
                >
                  💡 רמז לשולחן
                </button>
                <button
                  className="btn grow"
                  disabled={busy || s.status !== 'live'}
                  onClick={() => act('skip', 'לדלג לשלב הבא בסיפור?')}
                >
                  ⏭ דילוג
                </button>
              </div>
            </div>
          )}
          <div className="card stack">
            <div className="row">
              <h2 className="grow">התקדמות</h2>
              <span className="muted">
                {v.progress.found}/{v.progress.total} ראיות
              </span>
            </div>
            <div className="progress">
              <i style={{ width: `${(100 * v.progress.found) / Math.max(1, v.progress.total)}%` }} />
            </div>
            {s.voteOpen && (
              <p>
                ⚖️ {v.votes.cast}/{v.votes.of} הצביעו
              </p>
            )}
          </div>
          <div className="card">
            <h2>שלבי הערב</h2>
            <div className="beats">
              {v.beats.map((b) => (
                <div key={b.label} className={`beat ${b.fired ? 'fired' : ''} ${b === next ? 'next' : ''}`}>
                  <span>{b.label}</span>
                  <span className="muted ltr">{fmtClock(b.atMin)}</span>
                </div>
              ))}
            </div>
          </div>
          {v.finale && (
            <div className="card stack">
              <h2>תוצאות</h2>
              {v.finale.results.map((r) => (
                <div key={r.guestName} className="row">
                  <span className="grow">
                    {r.guestName} · {r.characterName}
                  </span>
                  <span className="pill">
                    {r.correct}/{r.of}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="card">
            <h2>יומן</h2>
            <div className="stack">
              {[...v.notifications].reverse().map((n) => (
                <p key={n.at + n.text} style={{ fontSize: 14 }}>
                  {n.text}
                </p>
              ))}
            </div>
          </div>
          {s.status !== 'ended' && (
            <button className="btn danger block" onClick={() => act('end', 'לסיים את הערב לגמרי?')}>
              סיום הערב
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Pregame({
  v,
  token,
  busy,
  onStart,
}: {
  v: HostView;
  token: string;
  busy: boolean;
  onStart: () => void;
}) {
  const [hiding, setHiding] = useState(v.hidingPlace);
  const [saved, setSaved] = useState(true);
  useEffect(() => setHiding(v.hidingPlace), [v.hidingPlace]);
  const share = `https://wa.me/?text=${encodeURIComponent(`הוזמנת לערב תעלומה 🕵️ ${v.session.title}\nהצטרפו כאן: ${v.links.invite}`)}`;

  async function saveHiding() {
    await api('PATCH', '/api/host/setup', { token, body: { hidingPlace: hiding } });
    setSaved(true);
  }

  const enough = v.guests.length >= v.minPlayers && v.missingCore.length === 0;
  return (
    <>
      <div className="card stack center">
        <h2>1. הזמינו את החברים</h2>
        <Qr value={v.links.invite} />
        <p className="ltr" style={{ fontSize: 14, wordBreak: 'break-all' }}>
          {v.links.invite}
        </p>
        <div className="row">
          <a className="btn primary grow" href={share} target="_blank" rel="noreferrer">
            שליחה בוואטסאפ
          </a>
          <button className="btn grow" onClick={() => void navigator.clipboard?.writeText(v.links.invite)}>
            העתקה
          </button>
        </div>
      </div>

      <div className="card stack">
        <div className="row">
          <h2 className="grow">2. מי הצטרף</h2>
          <span className="muted">
            {v.guests.length}/{v.maxPlayers}
          </span>
        </div>
        {v.guests.map((g) => (
          <div key={g.name + g.characterName} className="row">
            <span className="grow">{g.name}</span>
            <span className="muted">{g.characterName}</span>
          </div>
        ))}
        {!v.guests.length && <p className="muted">עוד אף אחד. שלחו את הקישור.</p>}
        {v.missingCore.length > 0 && (
          <p className="gold">
            צריך עוד לפחות{' '}
            {v.minPlayers - v.guests.length > 0 ? v.minPlayers - v.guests.length : v.missingCore.length}{' '}
            משתתפים כדי להתחיל.
          </p>
        )}
      </div>

      <div className="card stack">
        <h2>3. הכנת הבית</h2>
        <p className="muted">
          החביאו מעטפה עם "הקלף האמיתי" במקום כלשהו בבית, וכתבו כאן רמז למקום. הרמז יוצג רק בחשיפה. אתם לא
          יודעים מי האשמים, אז גם אתם משחקים.
        </p>
        <input
          className="input"
          value={hiding}
          onChange={(e) => {
            setHiding(e.target.value);
            setSaved(false);
          }}
          placeholder="למשל: איפה ששומרים את הלחם"
          maxLength={200}
        />
        <button className="btn small" disabled={saved} onClick={() => void saveHiding()}>
          {saved ? '✓ נשמר' : 'שמירה'}
        </button>
        <a className="btn" href={`/host/${token}/print`} target="_blank" rel="noreferrer">
          🖨️ הדפסת מדבקות QR להחבאה
        </a>
      </div>

      <div className="card stack">
        <h2>4. מסך הטלוויזיה</h2>
        <p className="muted">פתחו את הקישור הזה בדפדפן של הטלוויזיה או של מחשב שמחובר אליה.</p>
        <a className="btn" href={v.links.tv} target="_blank" rel="noreferrer">
          📺 פתיחת מסך הטלוויזיה
        </a>
      </div>

      <button className="btn primary block" disabled={!enough || busy} onClick={onStart}>
        {enough ? '🎬 התחלת הערב' : `ממתינים למשתתפים (${v.guests.length}/${v.minPlayers})`}
      </button>
    </>
  );
}
