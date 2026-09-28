import { useRoute } from './lib/router';
import { Home } from './pages/Home';
import { Join } from './pages/Join';
import { Guest } from './pages/Guest';
import { Tv } from './pages/Tv';
import { Host } from './pages/Host';
import { Print } from './pages/Print';
import { QrLanding } from './pages/QrLanding';
import { ErrorScreen } from './components/ui';

export function App() {
  const r = useRoute();
  switch (r.page) {
    case 'home':
      return <Home />;
    case 'join':
      return <Join code={r.code} />;
    case 'guest':
      return <Guest token={r.token} />;
    case 'tv':
      return <Tv token={r.token} />;
    case 'host':
      return <Host token={r.token} />;
    case 'print':
      return <Print token={r.token} />;
    case 'qr':
      return <QrLanding code={r.code} />;
    default:
      return <ErrorScreen message="הדף לא נמצא." />;
  }
}
