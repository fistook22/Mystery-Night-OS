import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function Toast({ toast }: { toast: { text: string; at: number } | null }) {
  const [shown, setShown] = useState<typeof toast>(null);
  useEffect(() => {
    if (!toast) return;
    setShown(toast);
    const t = setTimeout(() => setShown(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  return shown ? (
    <div className="toast" role="status" key={shown.at}>
      {shown.text}
    </div>
  ) : null;
}

export function Qr({ value, className = 'qr-box' }: { value: string; className?: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(value, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [value]);
  return <div className={className} aria-label={value} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Screen({ children }: { children: React.ReactNode }) {
  return <main className="hero">{children}</main>;
}

export function Loading() {
  return (
    <Screen>
      <div className="wordmark">MYSTERY NIGHT</div>
      <p className="muted">טוען…</p>
    </Screen>
  );
}

export function ErrorScreen({ message }: { message: string }) {
  return (
    <Screen>
      <div className="wordmark">MYSTERY NIGHT</div>
      <h1>אופס</h1>
      <p>{message}</p>
      <a className="btn" href="/">
        לדף הבית
      </a>
    </Screen>
  );
}

export const fmtClock = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
