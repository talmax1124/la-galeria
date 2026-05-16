import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCodeView from '../components/QRCodeView';
import VideoMontage from '../components/VideoMontage';
import Carousel from '../components/Carousel';
import { GalleryItem, adminZipUrl, deleteItem, fetchGallery } from '../lib/api';

const KEY_STORAGE = 'la-galeria:admin-key';

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const [key, setKey] = useState<string>(() => params.get('key') || localStorage.getItem(KEY_STORAGE) || '');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (key) {
      localStorage.setItem(KEY_STORAGE, key);
      if (!params.get('key')) {
        const next = new URLSearchParams(params);
        next.set('key', key);
        setParams(next, { replace: true });
      }
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGallery();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this upload permanently?')) return;
    try {
      await deleteItem(id, key);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  const uploadUrl = useMemo(() => `${window.location.origin}/`, []);

  if (!key) {
    return <AdminKeyPrompt onSubmit={setKey} />;
  }

  const totalSize = items.reduce((acc, i) => acc + i.sizeBytes, 0);
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);

  return (
    <>
      {carouselIndex !== null && (
        <Carousel items={items} startIndex={carouselIndex} onClose={() => setCarouselIndex(null)} />
      )}
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-plum">Host controls</h1>
            <p className="text-sm text-plum/50">
              {items.length} uploads · {formatSize(totalSize)} total
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={refresh} className="btn-secondary text-sm" disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <a href={adminZipUrl(key)} className="btn-primary text-sm">
              Download all as ZIP
            </a>
          </div>
        </header>

        {error && (
          <div className="card p-4 text-sm text-red-700 bg-red-50 border-red-200">
            {error}{' '}
            <button
              type="button"
              onClick={() => { localStorage.removeItem(KEY_STORAGE); setKey(''); }}
              className="underline ml-2"
            >
              Re-enter key
            </button>
          </div>
        )}

        <section className="card p-5">
          <h2 className="font-display text-xl text-plum mb-3">QR para invitados</h2>
          <p className="text-sm text-plum/60 mb-4">
            Imprime esto y colócalo en el evento. Los invitados lo escanean para subir fotos.
          </p>
          <QRCodeView value={uploadUrl} />
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl text-plum mb-3">🎬 Video montaje</h2>
          <VideoMontage items={items} />
        </section>

        <section>
          <h2 className="font-display text-xl text-plum mb-3">Todas las subidas</h2>
          {items.length === 0 ? (
            <div className="text-plum/50 font-display italic">Aún no hay nada subido.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item, i) => (
                <AdminThumb
                  key={item.id}
                  item={item}
                  onClick={() => setCarouselIndex(i)}
                  onDelete={() => onDelete(item.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function AdminThumb({ item, onClick, onDelete }: { item: GalleryItem; onClick: () => void; onDelete: () => void }) {
  const isVideo = item.mimetype.startsWith('video/');
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        className="aspect-square w-full overflow-hidden rounded-2xl bg-petal/40 focus:outline-none focus:ring-2 focus:ring-rose/50 block"
      >
        {isVideo ? (
          <video src={item.viewUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <img src={item.viewUrl} alt={item.filename} loading="lazy" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum/70 to-transparent p-2">
          <div className="text-ivory text-xs font-medium truncate">{item.uploader}</div>
        </div>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-2 right-2 bg-plum/70 hover:bg-red-600 text-ivory rounded-full w-7 h-7
                   flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition"
        aria-label="Delete"
      >×</button>
    </div>
  );
}

function AdminKeyPrompt({ onSubmit }: { onSubmit: (key: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (v) onSubmit(v);
      }}
      className="max-w-sm mx-auto card p-6 mt-12 text-center"
    >
      <div className="font-script text-4xl text-rose mb-1">Acceso</div>
      <h1 className="font-display text-2xl text-plum mb-2">Host access</h1>
      <p className="text-sm text-plum/60 mb-4">Enter the admin key set in the Worker.</p>
      <input
        type="password"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Admin key"
        className="w-full rounded-xl border border-rose/30 bg-blush/60 px-4 py-3 text-plum
                   focus:outline-none focus:ring-2 focus:ring-rose/40"
      />
      <button type="submit" className="btn-primary w-full mt-4" disabled={!value.trim()}>
        Enter
      </button>
    </form>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
