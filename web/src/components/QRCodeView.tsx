import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  value: string;
  size?: number;
}

export default function QRCodeView({ value, size = 320 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: '#5b2750', light: '#fefaf5' },
    }).catch(() => {});
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 2,
      color: { dark: '#5b2750', light: '#fefaf5' },
    }).then(setDataUrl);
  }, [value, size]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-xl shadow border border-rose/20" />
      <div className="text-xs text-plum/50 break-all max-w-xs text-center">{value}</div>
      {dataUrl && (
        <a href={dataUrl} download="miryangeline-qr.png" className="btn-secondary text-sm">
          Download QR (PNG)
        </a>
      )}
    </div>
  );
}
