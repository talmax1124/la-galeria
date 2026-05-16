import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FileDropzone from '../components/FileDropzone';
import NameModal from '../components/NameModal';
import { UploadTask, uploadAll } from '../lib/upload';

const NAME_KEY = 'la-galeria:name';

export default function Upload() {
  const [name, setName] = useState<string>('');
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(NAME_KEY) || '';
    if (stored) setName(stored);
    else setNameModalOpen(true);
  }, []);

  function saveName(n: string) {
    localStorage.setItem(NAME_KEY, n);
    setName(n);
    setNameModalOpen(false);
  }

  function clearName() {
    localStorage.removeItem(NAME_KEY);
    setName('');
    setNameModalOpen(true);
  }

  async function onFiles(files: File[]) {
    if (!name) {
      setNameModalOpen(true);
      return;
    }
    setBusy(true);
    await uploadAll(files, name, 3, (updated) => {
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === updated.id);
        if (idx === -1) return [...prev, updated];
        const next = prev.slice();
        next[idx] = updated;
        return next;
      });
    });
    setBusy(false);
  }

  const completed = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="space-y-6">
      <NameModal
        open={nameModalOpen}
        initialName={name}
        onSubmit={saveName}
        onClose={name ? () => setNameModalOpen(false) : undefined}
      />

      <section className="text-center py-4">
        <div className="font-script text-6xl text-rose mb-1">Comparte tu momento</div>
        <p className="font-display text-plum/60 max-w-md mx-auto text-lg italic">
          Sube fotos y videos de esta noche especial. Todos los recuerdos en un solo lugar.
        </p>
      </section>

      <section className="card p-4 flex items-center justify-between">
        <div className="text-sm text-plum">
          {name ? (
            <>
              Subiendo como <span className="font-semibold text-plum">{name}</span>
            </>
          ) : (
            <span className="text-plum/40">Sin nombre</span>
          )}
        </div>
        <button type="button" onClick={clearName} className="text-sm underline underline-offset-2 text-rose/70 hover:text-rose">
          Cambiar
        </button>
      </section>

      <FileDropzone onFiles={onFiles} disabled={!name} />

      {tasks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-plum">Tus subidas</h2>
            <div className="text-sm text-plum/50">
              {completed} de {tasks.length} listas
            </div>
          </div>
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="card p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-plum">{t.file.name}</div>
                    <div className="text-xs text-plum/50">{formatStatus(t)}</div>
                  </div>
                  <div className="text-xs tabular-nums w-12 text-right text-plum/60">
                    {t.status === 'done' ? '✓' : `${t.progress.percent}%`}
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-petal overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      t.status === 'error' ? 'bg-red-400' : 'bg-rose'
                    }`}
                    style={{ width: `${t.status === 'done' ? 100 : t.progress.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tasks.length > 0 && completed > 0 && !busy && (
        <div className="text-center">
          <Link to="/gallery" className="btn-primary">
            Ver la galería →
          </Link>
        </div>
      )}
    </div>
  );
}

function formatStatus(t: UploadTask): string {
  switch (t.status) {
    case 'queued':
      return 'En espera…';
    case 'uploading':
      return `Subiendo… ${formatSize(t.progress.loaded)} / ${formatSize(t.progress.total)}`;
    case 'done':
      return 'Subido';
    case 'error':
      return t.error || 'Error';
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
