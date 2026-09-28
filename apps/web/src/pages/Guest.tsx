import { useEffect, useMemo, useRef, useState } from 'react';
import type { ContactView, EvidenceItem, GuestView } from '@mn/shared';
import { api, guestToken } from '../lib/api';
import { useLive } from '../lib/live';
import { ErrorScreen, Loading, Toast, fmtClock } from '../components/ui';

type Tab = 'file' | 'evidence' | 'social' | 'contacts' | 'case';

const KIND_ICON: Record<string, string> = {
  photo: '📸',
  document: '📄',
  email: '✉️',
  log: '🖥️',
  chat: '💬',
  lookup: '🔎',
  physical: '🔦',
  testimony: '🗣️',
};

export function Guest({ token }: { token: string }) {
  const live = useLive<GuestView>(token);
  const [tab, setTab] = useState<Tab>('file');
  const seen = useRef<Record<Tab, number>>({ file: 0, evidence: 0, social: 0, contacts: 0, case: 0 });

  useEffect(() => guestToken.set(token), [token]);

  const v = live.view;
  const counts = useMemo(
    () =>
      v
        ? {
            file: v.me.missions.length,
            evidence: v.evidence.length,
            social: v.feed.length + v.dms.length + (v.stream ? 1 : 0),
            contacts: v.contacts.length,
            case: v.session.voteOpen ? 1 : 0,
          }
        : null,
    [v],
  );
  useEffect(() => {
    if (counts) seen.current[tab] = counts[tab];
  }, [tab, counts]);

  if (live.error) return <ErrorScreen message={live.error} />;
  if (!v || !counts) return <Loading />;

  const badge = (t: Tab) => Math.max(0, counts[t] - seen.current[t]);
  const tabs: { id: Tab; ic: string; label: string }[] = [
    { id: 'file', ic: '🗂️', label: 'הדמות' },
    { id: 'evidence', ic: '🔍', label: 'ראיות' },
    { id: 'social', ic: '📱', label: 'רשתות' },
    { id: 'contacts', ic: '📞', label: 'קו חקירה' },
    { id: 'case', ic: '⚖️', label: 'חקירה' },
  ];

  return (
    <div className="app">
      <Toast toast={live.toast} />
      <header className="app-head">
        <span
          className={`dot ${live.connected ? '' : 'off'}`}
          title={live.connected ? 'מחובר' : 'מתחבר מחדש…'}
        />
        <div className="grow">
          <div className="title">{v.session.title}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            {v.me.guestName} · {v.me.character.name}
          </div>
        </div>
        <StatusPill v={v} />
      </header>

      <div className="app-body">
        {tab === 'file' && <FileTab v={v} />}
        {tab === 'evidence' && <EvidenceTab items={v.evidence} started={v.session.status !== 'pregame'} />}
        {tab === 'social' && <SocialTab v={v} />}
        {tab === 'contacts' && <ContactsTab token={token} contacts={v.contacts} />}
        {tab === 'case' && <CaseTab token={token} v={v} />}
      </div>

      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            <span className="ic">{t.ic}</span>
            {t.label}
            {tab !== t.id && badge(t.id) > 0 && <span className="badge">{badge(t.id)}</span>}
          </button>
        ))}
      </nav>

      {v.finale && <Finale v={v} />}
    </div>
  );
}

function StatusPill({ v }: { v: GuestView }) {
  const s = v.session;
  if (s.status === 'pregame') return <span className="pill gold">לפני הערב</span>;
  if (s.status === 'paused') return <span className="pill">⏸ הפסקה</span>;
  return <span className="clock ltr">{fmtClock(s.elapsedMin)}</span>;
}

// ── Character file ──────────────────────────────────────────────────────────
function FileTab({ v }: { v: GuestView }) {
  const [reveal, setReveal] = useState(false);
  const ch = v.me.character;
  return (
    <>
      {v.session.status === 'pregame' && (
        <div className="card">
          <div className="label">הסיפור</div>
          <p>{v.premise}</p>
        </div>
      )}
      <div className="card character">
        <div className="label">הדמות שלך</div>
        <div className="name">{ch.name}</div>
        <div className="role">{ch.role}</div>
        <p className="muted ltr" style={{ textAlign: 'right' }}>
          @{ch.handle}
        </p>
        <p style={{ marginTop: 10 }}>{ch.publicIntro}</p>
        <div className="label" style={{ marginTop: 14 }}>
          הסוד שלך (רק את/ה רואה)
        </div>
        <button
          className={`secret ${reveal ? '' : 'hidden'}`}
          onClick={() => setReveal((r) => !r)}
          style={{ textAlign: 'start', width: '100%' }}
        >
          {ch.secret}
        </button>
        {!reveal && (
          <p className="muted center" style={{ fontSize: 13 }}>
            הקישו כדי לחשוף. אל תראו לאף אחד.
          </p>
        )}
        <div className="label" style={{ marginTop: 14 }}>
          המטרה שלך
        </div>
        <p>{ch.goal}</p>
        <div className="label" style={{ marginTop: 14 }}>
          תחפושת
        </div>
        <p>{ch.costume}</p>
      </div>
      {v.me.missions.map((m) => (
        <div key={m} className="mission">
          <div className="label gold">🎯 משימה סודית</div>
          {m}
        </div>
      ))}
      <div className="card">
        <h2>מי בחדר</h2>
        <div className="stack">
          {v.cast
            .filter((c) => c.characterId !== ch.characterId)
            .map((c) => (
              <div key={c.characterId}>
                <h3>
                  {c.name} <span className="muted">· {c.role}</span>
                </h3>
                <p className="muted" style={{ fontSize: 14 }}>
                  משוחק/ת ע״י {c.guestName} · {c.publicIntro}
                </p>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

// ── Evidence locker ─────────────────────────────────────────────────────────
function EvidenceTab({ items, started }: { items: EvidenceItem[]; started: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!started) return <Empty text="הראיות יופיעו כאן כשהערב יתחיל." />;
  if (!items.length) return <Empty text="עוד אין ראיות. הישארו ערניים." />;
  return (
    <>
      <p className="muted">{items.length} ראיות · הקישו כדי לפתוח</p>
      {items.map((e) => (
        <article
          key={e.id}
          className={`card evidence ${e.isNew ? 'new' : ''}`}
          onClick={() => setOpen(open === e.id ? null : e.id)}
        >
          <div className="row">
            <span className="kind">{KIND_ICON[e.kind] ?? '📎'}</span>
            <div className="grow">
              <h3>{e.title}</h3>
              <p className="muted" style={{ fontSize: 14 }}>
                {e.summary}
              </p>
            </div>
            {e.isNew && <span className="pill gold">חדש</span>}
          </div>
          {open === e.id && (
            <>
              <div className={`body pre ${e.kind}`}>{e.body}</div>
              {e.foundBy && (
                <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                  נמצאה ע״י {e.foundBy}
                </p>
              )}
            </>
          )}
        </article>
      ))}
    </>
  );
}

// ── Social: Pixelgram / Streamly / Huddle ───────────────────────────────────
function SocialTab({ v }: { v: GuestView }) {
  const [sub, setSub] = useState<'px' | 'st' | 'hd'>('px');
  return (
    <>
      <div className="segmented">
        <button className={sub === 'px' ? 'on' : ''} onClick={() => setSub('px')}>
          Pixelgram
        </button>
        <button className={sub === 'st' ? 'on' : ''} onClick={() => setSub('st')}>
          Streamly
        </button>
        <button className={sub === 'hd' ? 'on' : ''} onClick={() => setSub('hd')}>
          Huddle {v.dms.length > 0 && `(${v.dms.length})`}
        </button>
      </div>
      {sub === 'px' &&
        v.feed.map((p) => (
          <article key={p.id} className="ig-post">
            <div className="ig-head">
              <div className="ig-ring">
                <div>{p.authorName[0]}</div>
              </div>
              <b>{p.handle}</b>
              <span className="muted" style={{ fontSize: 13 }}>
                {p.time}
              </span>
            </div>
            {p.recovered && <span className="pill red ig-recovered">⟲ נמחק · שוחזר</span>}
            {p.image && (
              <div className="ig-img" aria-label={p.image}>
                📷
              </div>
            )}
            <div className="ig-text">
              <p>{p.text}</p>
              <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                ♥ {p.likes.toLocaleString('he-IL')}
              </p>
            </div>
          </article>
        ))}
      {sub === 'st' &&
        (v.stream ? (
          <div className="tw">
            <div className="tw-player">
              <span className="tag">▶ VOD · {v.stream.vodLength}</span>
            </div>
            <div className="tw-meta">
              <div className="tw-av">YO</div>
              <div>
                <b>{v.stream.channel}</b>
                <p style={{ fontSize: 14, unicodeBidi: 'plaintext' }}>{v.stream.title}</p>
              </div>
            </div>
            <div className="tw-chat">
              {v.stream.chat.map((l, i) => (
                <div key={i} className={`tw-line ${l.flagged ? 'flag' : ''}`}>
                  <span className="t">{l.t}</span>
                  <b>{l.user}</b>: <span>{l.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Empty text="ההקלטה של יוני עוד לא עלתה." />
        ))}
      {sub === 'hd' &&
        (v.dms.length ? (
          v.dms.map((d) => (
            <div key={d.id} className="hd">
              <div className="hd-title"># {d.title}</div>
              {d.messages.map((m, i) => (
                <div key={i} className="hd-msg">
                  <div className="av">{m.from[0]}</div>
                  <div>
                    <b className="ltr">{m.from}</b>{' '}
                    <span className="muted" style={{ fontSize: 12 }}>
                      {m.time}
                    </span>
                    <p>{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <Empty text="עוד לא דלפו הודעות." />
        ))}
    </>
  );
}

// ── Contacts (AI characters) ────────────────────────────────────────────────
function ContactsTab({ token, contacts }: { token: string; contacts: ContactView[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<{ npc: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const c = contacts.find((x) => x.id === open);

  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [c?.messages.length, pending]);

  if (!contacts.length) return <Empty text="קו החקירה עוד לא נפתח." />;
  if (!c)
    return (
      <>
        <p className="muted">דברו עם הדמויות. הן זוכרות מה אמרתם.</p>
        {contacts.map((x) => (
          <button
            key={x.id}
            className="card contact"
            onClick={() => setOpen(x.id)}
            style={{ textAlign: 'start' }}
          >
            <div className="av">{x.name.split(' ').pop()?.[0]}</div>
            <div className="grow">
              <h3>{x.name}</h3>
              <p className="muted" style={{ fontSize: 14 }}>
                {x.title}
              </p>
            </div>
            <span className="pill">💬 {x.messages.filter((m) => m.sender === 'guest').length || ''}</span>
          </button>
        ))}
      </>
    );

  async function send() {
    const t = text.trim();
    if (!t || !c) return;
    setText('');
    setError(null);
    setPending({ npc: c.id, text: t });
    try {
      await api('POST', '/api/guest/npc', { token, body: { npc: c.id, text: t } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  const waiting = pending?.npc === c.id;
  const alreadyShown = waiting && c.messages.some((m) => m.sender === 'guest' && m.text === pending.text);
  return (
    <>
      <div className="row">
        <button className="btn small" onClick={() => setOpen(null)}>
          → חזרה
        </button>
        <div className="grow">
          <h3>{c.name}</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            {c.title}
          </p>
        </div>
        <button className="btn small" disabled title="שיחות קוליות מגיעות בשלב הבא">
          📞
        </button>
      </div>
      <div className="chat">
        <div className="bubble npc">{c.opening}</div>
        {c.messages.map((m, i) => (
          <div key={i} className={`bubble ${m.sender}`}>
            {m.text}
          </div>
        ))}
        {waiting && !alreadyShown && <div className="bubble guest">{pending.text}</div>}
        {waiting && <div className="typing">•••</div>}
        {error && <p className="gold">{error}</p>}
        <div ref={end} />
      </div>
      <div className="composer">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !waiting && void send()}
          placeholder={`הודעה ל${c.name.split(' ').pop()}…`}
          maxLength={500}
        />
        <button className="btn primary" disabled={!text.trim() || waiting} onClick={() => void send()}>
          שלח
        </button>
      </div>
    </>
  );
}

// ── Case: tools, QR, accusation ─────────────────────────────────────────────
function CaseTab({ token, v }: { token: string; v: GuestView }) {
  const started = v.session.status !== 'pregame';
  return (
    <>
      {v.session.voteOpen && <Accuse token={token} v={v} />}
      {!started && <Empty text="הכלים ייפתחו כשהערב יתחיל." />}
      {v.tools.map((t) => (
        <ToolCard key={t.id} token={token} tool={t} />
      ))}
      {started && <CodeCard token={token} />}
      {v.notifications.length > 0 && (
        <div className="card">
          <h2>יומן הערב</h2>
          <div className="stack">
            {[...v.notifications].reverse().map((n) => (
              <p key={n.at + n.text} style={{ fontSize: 14 }}>
                {n.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ToolCard({ token, tool }: { token: string; tool: GuestView['tools'][number] }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<string | null>(null);
  async function check() {
    try {
      const r = await api<{ clue: string | null }>('POST', '/api/guest/tool', {
        token,
        body: { tool: tool.id, value },
      });
      setResult(r.clue ? '✅ נמצאה התאמה. הראיה נוספה ללשונית הראיות.' : `❌ ${tool.miss}`);
    } catch (e) {
      setResult((e as Error).message);
    }
  }
  return (
    <div className="card stack">
      <h2>🔎 {tool.title}</h2>
      <p className="muted">{tool.prompt}</p>
      <div className="row">
        <input
          className="input ltr"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={tool.placeholder}
          maxLength={20}
        />
        <button className="btn primary" disabled={!value.trim()} onClick={() => void check()}>
          בדיקה
        </button>
      </div>
      {result && <p>{result}</p>}
    </div>
  );
}

function CodeCard({ token }: { token: string }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<string | null>(null);
  async function submit() {
    try {
      const r = await api<{ clues: string[] }>('POST', '/api/guest/qr', { token, body: { code } });
      setResult(r.clues.length ? '🔍 מצאתם ראיה!' : 'הקוד לא פותח כלום.');
      setCode('');
    } catch (e) {
      setResult((e as Error).message);
    }
  }
  return (
    <div className="card stack">
      <h2>🏷️ מצאתם מדבקה?</h2>
      <p className="muted">סרקו אותה במצלמה של הטלפון, או הקלידו את הקוד שמודפס עליה.</p>
      <div className="row">
        <input
          className="input ltr"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD-1234"
          maxLength={20}
        />
        <button className="btn" disabled={!code.trim()} onClick={() => void submit()}>
          פתח
        </button>
      </div>
      {result && <p>{result}</p>}
    </div>
  );
}

function Accuse({ token, v }: { token: string; v: GuestView }) {
  const [picked, setPicked] = useState<string[]>(v.accusation.mine ?? []);
  const [saved, setSaved] = useState(!!v.accusation.mine);
  const toggle = (id: string) => {
    setSaved(false);
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < v.accusation.maxSuspects ? [...p, id] : p,
    );
  };
  async function submit() {
    await api('POST', '/api/guest/accuse', { token, body: { suspects: picked } });
    setSaved(true);
  }
  return (
    <div className="card stack mission">
      <h2>⚖️ ההצבעה פתוחה</h2>
      <p>{v.accusation.prompt}</p>
      {v.cast.map((c) => (
        <button
          key={c.characterId}
          className={`btn block ${picked.includes(c.characterId) ? 'primary' : ''}`}
          onClick={() => toggle(c.characterId)}
        >
          {c.name} <span style={{ opacity: 0.7, fontWeight: 400 }}>({c.guestName})</span>
        </button>
      ))}
      <button className="btn primary block" disabled={!picked.length || saved} onClick={() => void submit()}>
        {saved ? '✓ ההצבעה נשמרה (אפשר לשנות)' : 'הגשת האשמה'}
      </button>
    </div>
  );
}

function Finale({ v }: { v: GuestView }) {
  const f = v.finale!;
  const mine = f.results.find((r) => r.guestName === v.me.guestName);
  return (
    <div className="finale">
      <div className="stack" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="wordmark center">MYSTERY NIGHT</div>
        <h1>החשיפה</h1>
        {f.culprits.map((c) => (
          <div key={c.characterId} className="culprit">
            <div className="n">{c.name}</div>
            <div className="muted">שוחק/ה ע״י {c.guestName}</div>
          </div>
        ))}
        <p className="card">{f.explanation}</p>
        <div className="riddle">{f.riddle}</div>
        {mine && (
          <p className="center gold" style={{ fontSize: 20, fontWeight: 800 }}>
            {mine.correct === mine.of
              ? '🏆 פתרת את התיק!'
              : mine.correct > 0
                ? '🥈 פתרת חצי מהתיק'
                : 'הפעם הם הצליחו לעבוד עליך 😉'}
          </p>
        )}
        <div className="card stack">
          <h2>תוצאות</h2>
          {f.results.map((r) => (
            <div key={r.guestName} className="row">
              <span className="grow">
                {r.guestName} <span className="muted">· {r.characterName}</span>
              </span>
              <span className="pill">
                {r.correct}/{r.of}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="muted center" style={{ padding: '40px 10px' }}>
      {text}
    </p>
  );
}
