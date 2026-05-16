import { useRef, useState } from 'react';
import { GalleryItem } from '../lib/api';

interface Props { items: GalleryItem[] }

type Stage = 'idle' | 'loading-ffmpeg' | 'downloading' | 'encoding' | 'done' | 'error';

const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js';
const FFMPEG_WASM_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm';

export default function VideoMontage({ items }: Props) {
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [detail, setDetail] = useState('');
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const ffmpegRef = useRef<unknown>(null);

  const videos = items.filter((i) => i.mimetype.startsWith('video/'));

  async function generate() {
    if (videos.length === 0) return;

    setStage('loading-ffmpeg');
    setProgress(0);
    setDetail('Loading FFmpeg…');

    try {
      // Dynamic import so FFmpeg WASM doesn't bloat the main bundle
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');

      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('log', ({ message }: { message: string }) => setDetail(message.slice(0, 80)));
      ffmpeg.on('progress', ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100)));

      await ffmpeg.load({
        coreURL: FFMPEG_CORE_URL,
        wasmURL: FFMPEG_WASM_URL,
      });

      setStage('downloading');
      setDetail('Downloading videos…');

      const listLines: string[] = [];
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        setDetail(`Downloading ${i + 1} / ${videos.length}: ${video.filename}`);
        setProgress(Math.round((i / videos.length) * 50));

        const res = await fetch(video.viewUrl);
        const blob = await res.blob();
        const ext = video.filename.split('.').pop() || 'mp4';
        const fname = `input${i}.${ext}`;
        await ffmpeg.writeFile(fname, await fetchFile(blob));
        listLines.push(`file '${fname}'`);
      }

      // Write concat list
      const encoder = new TextEncoder();
      await ffmpeg.writeFile('list.txt', encoder.encode(listLines.join('\n')));

      setStage('encoding');
      setDetail('Encoding…');
      setProgress(0);

      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        'output.mp4',
      ]);

      const raw = await ffmpeg.readFile('output.mp4');
      // Copy into a plain ArrayBuffer so TypeScript / Blob constructor is happy
      const src = typeof raw === 'string' ? new TextEncoder().encode(raw) : (raw as Uint8Array);
      const copy = new Uint8Array(src).buffer;
      const url = URL.createObjectURL(new Blob([copy], { type: 'video/mp4' }));
      setOutputUrl(url);
      setStage('done');
      setDetail('');
    } catch (e) {
      setStage('error');
      setDetail(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  function download() {
    if (!outputUrl) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = `la-galeria-montage-${new Date().toISOString().slice(0, 10)}.mp4`;
    a.click();
  }

  if (videos.length === 0) {
    return <p className="text-sm text-ink/50">No videos uploaded yet.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/70">
        {videos.length} video{videos.length > 1 ? 's' : ''} will be concatenated into one MP4.
        Processing runs in your browser — no upload needed.
      </p>

      {stage === 'idle' && (
        <button type="button" onClick={generate} className="btn-primary text-sm">
          🎬 Generate montage
        </button>
      )}

      {(stage === 'loading-ffmpeg' || stage === 'downloading' || stage === 'encoding') && (
        <div className="space-y-2">
          <div className="text-sm text-ink/70 truncate">{detail}</div>
          <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-ink/50 tabular-nums">{progress}%</div>
        </div>
      )}

      {stage === 'done' && outputUrl && (
        <div className="space-y-3">
          <video src={outputUrl} controls className="w-full rounded-xl max-h-64" />
          <div className="flex gap-2">
            <button type="button" onClick={download} className="btn-primary text-sm flex-1">
              ↓ Download MP4
            </button>
            <button
              type="button"
              onClick={() => { setStage('idle'); setOutputUrl(null); setProgress(0); }}
              className="btn-secondary text-sm"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}

      {stage === 'error' && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{detail}</p>
          <button type="button" onClick={() => setStage('idle')} className="btn-secondary text-sm">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
