import { useState } from 'react';

interface Props {
  url: string;
  mimetype: string;
  filename: string;
  uploader: string;
  uploadedAt: number;
  onDelete?: () => void;
}

export default function MediaTile({
  url,
  mimetype,
  filename,
  uploader,
  uploadedAt,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const isVideo = mimetype.startsWith('video/');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-ink/5 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {isVideo ? (
          <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <img src={url} alt={filename} loading="lazy" className="h-full w-full object-cover" />
        )}
        {isVideo && (
          <div className="absolute inset-0 grid place-items-center bg-ink/10 group-hover:bg-ink/5 transition">
            <div className="rounded-full bg-cream/90 px-3 py-2 text-xs font-medium">▶ Play</div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-3 text-left">
          <div className="text-cream text-xs font-medium drop-shadow truncate">{uploader}</div>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-cream text-3xl leading-none"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            {isVideo ? (
              <video src={url} controls autoPlay playsInline className="w-full max-h-[80vh] rounded-xl" />
            ) : (
              <img src={url} alt={filename} className="w-full max-h-[80vh] object-contain rounded-xl" />
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-cream/80 text-sm">
              <div>
                <span className="font-medium text-cream">{uploader}</span> ·{' '}
                <span className="opacity-70">{new Date(uploadedAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={url}
                  download={filename}
                  className="rounded-full bg-cream text-ink px-4 py-1.5 font-medium hover:bg-accent hover:text-cream transition"
                >
                  Download
                </a>
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-full border border-cream/40 text-cream px-4 py-1.5 hover:bg-cream/10 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
