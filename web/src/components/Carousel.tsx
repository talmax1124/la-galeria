import { useCallback, useEffect, useRef, useState } from 'react';
import { GalleryItem } from '../lib/api';
import ReactionBar from './ReactionBar';
import CommentSection from './CommentSection';

interface Props {
  items: GalleryItem[];
  startIndex: number;
  onClose: () => void;
}

export default function Carousel({ items, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [showComments, setShowComments] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const item = items[index];

  const prev = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : items.length - 1)), [items.length]);
  const next = useCallback(() => setIndex((i) => (i < items.length - 1 ? i + 1 : 0)), [items.length]);

  useEffect(() => {
    setShowComments(false);
  }, [index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-plum flex flex-col"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
        touchStartX.current = null;
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-ivory/10">
        <div className="text-ivory/60 text-sm">
          <span className="font-medium text-ivory">{item.uploader}</span>
          {' · '}{new Date(item.uploadedAt).toLocaleString()}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={item.viewUrl}
            download={item.filename}
            className="text-ivory/60 hover:text-ivory text-sm transition"
            onClick={(e) => e.stopPropagation()}
          >
            ↓ Save
          </a>
          <button type="button" onClick={onClose} className="text-ivory text-3xl leading-none">×</button>
        </div>
      </div>

      {/* Media */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-2">
        {item.mimetype.startsWith('video/') ? (
          <video
            key={item.id}
            src={item.viewUrl}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        ) : (
          <img
            key={item.id}
            src={item.viewUrl}
            alt={item.filename}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        )}

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-ivory/20 hover:bg-ivory/40 text-ivory rounded-full w-10 h-10 flex items-center justify-center text-xl transition"
            >‹</button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-ivory/20 hover:bg-ivory/40 text-ivory rounded-full w-10 h-10 flex items-center justify-center text-xl transition"
            >›</button>
          </>
        )}
      </div>

      {/* Bottom panel */}
      <div className="shrink-0 px-4 pb-4 pt-2 space-y-3 border-t border-ivory/10">
        <ReactionBar uploadId={item.id} />

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="text-ivory/50 text-sm hover:text-ivory/80 transition"
        >
          {showComments ? '▾ Ocultar comentarios' : '▸ Comentarios'}
        </button>

        {showComments && (
          <div className="max-h-56 overflow-y-auto">
            <CommentSection uploadId={item.id} />
          </div>
        )}

        {items.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {items.map((it, i) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                  i === index ? 'border-rose' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                {it.mimetype.startsWith('video/') ? (
                  <div className="w-full h-full bg-ivory/10 grid place-items-center text-ivory text-xs">▶</div>
                ) : (
                  <img src={it.viewUrl} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
