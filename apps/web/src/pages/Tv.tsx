import { useEffect, useState } from 'react';
import type { TvView } from '@mn/shared';
import { useLive } from '../lib/live';
import { ErrorScreen, Loading, Qr, Toast } from '../components/ui';

export function Tv({ token }: { token: string }) {
  const live = useLive<TvView>(token);
  if (live.error) return <ErrorScreen message={live.error} />;
  if (!live.view) return <Loading />;
  const v = live.view;
  return (
    <>
      <div className="tv-toast">
        <Toast toast={live.toast} />
      </div>
      <Scene v={v} />
      {v.scene.scene !== 'blackout' && v.scene.scene !== 'lobby' && (
        <div
          className="tv"
          style={{
            position: 'fixed',
            inset: 'auto 0 0 0',
            background: 'none',
            padding: 0,
            placeItems: 'stretch',
          }}
        >
          <div className="foot">
            <span>🔍 {v.evidenceCount} ראיות</span>
            {v.session.voteOpen && (
              <span>
                ⚖️ {v.votes.cast}/{v.votes.of} הצביעו
              </span>
            )}
            <span>{v.session.title}</span>
          </div>
        </div>
      )}
    </>
  );
}

function Scene({ v }: { v: TvView }) {
  const s = v.scene;
  switch (s.scene) {
    case 'lobby':
      return (
        <div className="tv">
          <div>
            <div className="corner">MYSTERY NIGHT</div>
            <h1>{s.title}</h1>
            <h2>{s.tagline}</h2>
            <Qr value={s.joinUrl} className="qr" />
            <h2>
              סרקו כדי להצטרף · קוד <b className="ltr gold">{s.inviteCode}</b>
            </h2>
            <div className="names">
              {s.joined.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
        </div>
      );
    case 'paused':
      return (
        <div className="tv">
          <div>
            <h1>⏸ הפסקה</h1>
            <h2>הערב ימשיך בעוד רגע. תהנו מהאוכל.</h2>
          </div>
        </div>
      );
    case 'blackout':
      return <Blackout startedAt={s.startedAt} seconds={s.seconds} caption={s.caption} />;
    case 'uv':
      return (
        <div className="tv uv">
          <div>
            <h1>{s.title}</h1>
            <p className="body">{s.body}</p>
            <div className="stamp">מזויף</div>
          </div>
        </div>
      );
    case 'stream':
      return (
        <div className="tv stream">
          <div>
            <span className="live">● LIVE</span>
            <h1 style={{ marginTop: '3vmin' }}>{s.title}</h1>
            <p className="body">{s.body}</p>
          </div>
        </div>
      );
    case 'clue':
      return (
        <div className="tv">
          <div>
            <h2>ראיה חדשה</h2>
            <h1>{s.clue.title}</h1>
            <div className="evcard pre">{s.clue.body}</div>
          </div>
        </div>
      );
    case 'finale':
      return (
        <div className="tv" style={{ overflowY: 'auto' }}>
          <div>
            <h1>{s.title}</h1>
            <h2>{s.body}</h2>
            <div className="names" style={{ gap: '3vmin' }}>
              {s.finale.culprits.map((c) => (
                <span key={c.characterId} style={{ fontSize: '4vmin', background: 'rgba(255,59,48,.2)' }}>
                  {c.name} ({c.guestName})
                </span>
              ))}
            </div>
            <p className="body">{s.finale.explanation}</p>
            <div className="evcard" style={{ textAlign: 'center', fontWeight: 800 }}>
              {s.finale.riddle}
            </div>
            <div className="results">
              {s.finale.results.map((r) => (
                <div key={r.guestName}>
                  {r.correct === r.of ? '🏆' : r.correct ? '🥈' : '·'} {r.guestName} · {r.correct}/{r.of}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'title':
      return (
        <div className="tv">
          <div>
            <div className="corner">MYSTERY NIGHT</div>
            <h1>{s.title}</h1>
            {s.subtitle && <h2>{s.subtitle}</h2>}
          </div>
        </div>
      );
    default:
      return (
        <div className="tv">
          <div>
            <div className="corner">MYSTERY NIGHT</div>
            <h1>{s.title}</h1>
            <p className="body">{s.body}</p>
          </div>
        </div>
      );
  }
}

function Blackout({ startedAt, seconds, caption }: { startedAt: number; seconds: number; caption: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil(seconds - (now - startedAt) / 1000));
  return (
    <div className="tv blackout">
      <div>
        <div className="led">
          {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}
        </div>
        <h2 style={{ color: '#ff6b6b' }}>{left ? caption : 'האורות חוזרים…'}</h2>
      </div>
    </div>
  );
}
