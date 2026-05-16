import { useEffect, useState } from 'react';
import Carousel from '../components/Carousel';
import { GalleryItem, fetchGallery } from '../lib/api';

type GroupKey = 'uploader' | 'time';

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupKey>('uploader');
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGallery()
      .then(({ items }) => { if (!cancelled) setItems(items); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  if (error) return (
    <div className="text-center py-20 text-plum/60">
      <p className="mb-2">No se pudo cargar la galería.</p>
      <code className="text-xs">{error}</code>
    </div>
  );

  if (items === null) return <div className="text-center py-20 text-plum/50 font-display italic">Cargando…</div>;

  if (items.length === 0) return (
    <div className="text-center py-20 text-plum/60">
      <div className="font-script text-5xl text-rose mb-3">Aún no hay fotos</div>
      <p className="font-display italic">¡Sé la primera en compartir algo!</p>
    </div>
  );

  const groups = groupBy === 'uploader' ? groupByUploader(items) : [{ key: 'Todos', items }];
  const flatItems = groups.flatMap((g) => g.items);

  return (
    <>
      {carouselIndex !== null && (
        <Carousel
          items={flatItems}
          startIndex={carouselIndex}
          onClose={() => setCarouselIndex(null)}
        />
      )}

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-plum">La Galería</h1>
          <div className="flex gap-1 rounded-full bg-petal p-1 text-sm">
            <Pill active={groupBy === 'uploader'} onClick={() => setGroupBy('uploader')}>Por persona</Pill>
            <Pill active={groupBy === 'time'} onClick={() => setGroupBy('time')}>Por hora</Pill>
          </div>
        </div>

        {groups.map((g) => (
          <section key={g.key}>
            {groupBy === 'uploader' && (
              <h2 className="font-display text-xl text-plum mb-3">
                {g.key}{' '}
                <span className="text-plum/40 text-base font-normal">· {g.items.length}</span>
              </h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {g.items.map((item) => {
                const flatIndex = flatItems.findIndex((fi) => fi.id === item.id);
                return (
                  <Thumb
                    key={item.id}
                    item={item}
                    onClick={() => setCarouselIndex(flatIndex)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function Thumb({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const isVideo = item.mimetype.startsWith('video/');
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-petal/40 focus:outline-none focus:ring-2 focus:ring-rose/50"
    >
      {isVideo ? (
        <video src={item.viewUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
      ) : (
        <img src={item.viewUrl} alt={item.filename} loading="lazy" className="h-full w-full object-cover" />
      )}
      {isVideo && (
        <div className="absolute inset-0 grid place-items-center bg-plum/20 group-hover:bg-plum/10 transition">
          <div className="rounded-full bg-ivory/90 px-3 py-1.5 text-xs font-medium text-plum">▶ Play</div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum/70 to-transparent p-2">
        <div className="text-ivory text-xs font-medium truncate">{item.uploader}</div>
      </div>
    </button>
  );
}

function groupByUploader(items: GalleryItem[]): { key: string; items: GalleryItem[] }[] {
  const map = new Map<string, GalleryItem[]>();
  for (const it of items) {
    const list = map.get(it.uploader) || [];
    list.push(it);
    map.set(it.uploader, list);
  }
  return Array.from(map.entries())
    .map(([key, items]) => ({ key, items }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full transition ${active ? 'bg-plum text-ivory' : 'text-plum/60 hover:bg-petal'}`}
    >
      {children}
    </button>
  );
}
