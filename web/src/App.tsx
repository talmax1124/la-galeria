import { Link, NavLink, Route, Routes } from 'react-router-dom';
import Upload from './pages/Upload';
import Gallery from './pages/Gallery';
import Camera from './pages/Camera';
import Admin from './pages/Admin';

export default function App() {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 bg-blush/90 backdrop-blur border-b border-rose/20">
        <div className="mx-auto max-w-5xl px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex flex-col leading-none">
            <span className="font-script text-3xl text-plum tracking-wide">Miryangeline</span>
            <span className="font-display text-xs tracking-[0.25em] uppercase text-gold -mt-1">Quinceañera</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavTab to="/" label="Upload" end />
            <NavTab to="/gallery" label="Gallery" />
            <NavTab to="/camera" label="Camera" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="text-center text-xs text-plum/40 py-10 font-display tracking-wider">
        <span className="text-rose/60">✦</span>{' '}Made with love for a magical night{' '}<span className="text-rose/60">✦</span>
        {' · '}
        <Link to="/admin" className="underline-offset-2 hover:underline text-plum/40">
          Host
        </Link>
      </footer>
    </div>
  );
}

function NavTab({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `px-4 py-2 rounded-full text-sm font-medium transition ${
          isActive
            ? 'bg-plum text-ivory shadow-sm'
            : 'text-plum/70 hover:bg-petal'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="font-display text-3xl mb-2 text-plum">Page not found</h1>
      <Link to="/" className="underline underline-offset-4 text-rose">
        Back to upload
      </Link>
    </div>
  );
}
