import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { uploadOne, newTask, UploadTask } from '../lib/upload';

const NAME_KEY = 'la-galeria:name';

const FILTERS = [
  { id: 'normal',    label: 'Normal',   css: 'none' },
  { id: 'vivid',     label: 'Vivid',    css: 'saturate(1.8) contrast(1.1)' },
  { id: 'grayscale', label: 'B&W',      css: 'grayscale(1)' },
  { id: 'sepia',     label: 'Sepia',    css: 'sepia(0.8)' },
  { id: 'warm',      label: 'Warm',     css: 'sepia(0.4) saturate(1.4) brightness(1.05)' },
  { id: 'cool',      label: 'Cool',     css: 'hue-rotate(200deg) saturate(1.2)' },
  { id: 'vintage',   label: 'Vintage',  css: 'sepia(0.3) contrast(0.9) brightness(0.95) saturate(0.8)' },
  { id: 'fade',      label: 'Fade',     css: 'contrast(0.8) brightness(1.1) saturate(0.7)' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

const CANVAS_FILTER: Record<FilterId, string> = {
  normal:    'none',
  vivid:     'saturate(180%) contrast(110%)',
  grayscale: 'grayscale(100%)',
  sepia:     'sepia(80%)',
  warm:      'sepia(40%) saturate(140%) brightness(105%)',
  cool:      'hue-rotate(200deg) saturate(120%)',
  vintage:   'sepia(30%) contrast(90%) brightness(95%) saturate(80%)',
  fade:      'contrast(80%) brightness(110%) saturate(70%)',
};

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [filter, setFilter] = useState<FilterId>('normal');
  const [captured, setCaptured] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [task, setTask] = useState<UploadTask | null>(null);
  const [name] = useState(() => localStorage.getItem(NAME_KEY) || '');
  const [camError, setCamError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCamError('Camera access denied. Please allow camera access in your browser settings.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.filter = CANVAS_FILTER[filter];
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setCaptured(canvas.toDataURL('image/jpeg', 0.92));
      },
      'image/jpeg',
      0.92,
    );
  }

  function retake() {
    setCaptured(null);
    setCapturedBlob(null);
    setTask(null);
  }

  async function upload() {
    if (!capturedBlob || !name) return;
    const filename = `camera-${Date.now()}.jpg`;
    const file = new File([capturedBlob], filename, { type: 'image/jpeg' });
    const t = newTask(file);
    setTask(t);
    await uploadOne(t, name, (updated) => setTask({ ...updated }));
  }

  const filterCss = FILTERS.find((f) => f.id === filter)?.css || 'none';
  const currentFilter = filterCss === 'none' ? undefined : filterCss;

  if (camError) {
    return (
      <div className="text-center py-20 space-y-3">
        <div className="text-4xl">📷</div>
        <p className="text-plum/60">{camError}</p>
        <Link to="/" className="btn-secondary">Volver</Link>
      </div>
    );
  }

  if (!name) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-plum/60">Primero escribe tu nombre en la página de subida.</p>
        <Link to="/" className="btn-primary">Ir a poner nombre</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="font-display text-3xl text-center text-plum">Cámara</h1>

      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
        {captured ? (
          <img src={captured} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ filter: currentFilter }}
          />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {!captured && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className="shrink-0 flex flex-col items-center gap-1 transition"
            >
              <div
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 ${
                  filter === f.id ? 'border-rose' : 'border-transparent'
                }`}
              >
                <video
                  autoPlay
                  playsInline
                  muted
                  ref={(el) => { if (el && videoRef.current?.srcObject) el.srcObject = videoRef.current.srcObject; }}
                  className="w-full h-full object-cover"
                  style={{ filter: f.css === 'none' ? undefined : f.css }}
                />
              </div>
              <span className={`text-xs ${filter === f.id ? 'text-rose font-medium' : 'text-plum/50'}`}>
                {f.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {!captured ? (
        <button type="button" onClick={capture} className="btn-primary w-full text-lg py-4">
          📸 Capturar
        </button>
      ) : (
        <div className="space-y-2">
          {task?.status === 'done' ? (
            <div className="space-y-2">
              <div className="card p-3 text-center text-sm font-medium text-plum">✓ ¡Subida!</div>
              <div className="flex gap-2">
                <button type="button" onClick={retake} className="btn-secondary flex-1">Otra foto</button>
                <Link to="/gallery" className="btn-primary flex-1 text-center">Ver galería</Link>
              </div>
            </div>
          ) : task?.status === 'error' ? (
            <div className="space-y-2">
              <div className="card p-3 text-center text-sm text-red-600">{task.error}</div>
              <button type="button" onClick={retake} className="btn-secondary w-full">Repetir</button>
            </div>
          ) : task ? (
            <div className="card p-3">
              <div className="text-sm text-center text-plum/60 mb-2">Subiendo… {task.progress.percent}%</div>
              <div className="h-1.5 rounded-full bg-petal">
                <div className="h-full bg-rose rounded-full transition-all" style={{ width: `${task.progress.percent}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={retake} className="btn-secondary flex-1">Repetir</button>
              <button type="button" onClick={upload} className="btn-primary flex-1">Subir ↑</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
